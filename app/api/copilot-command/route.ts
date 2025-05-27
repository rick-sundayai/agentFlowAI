// app/api/copilot-command/route.ts
// This version acts as a gateway to an n8n workflow that handles the AI logic and actions.

import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// Utility function for structured logging (Keep this)
function logWithTimestamp(level: 'info' | 'warn' | 'error', message: string, data?: unknown): void {
  const timestamp = new Date().toISOString();
  console[level](`[${timestamp}] ${message}`, data ? data : '');
}

export async function POST(request: Request) {
  // 1. Securely identify the logged-in user
  const supabase = await createClient(); // Ensure this uses the corrected server client
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    logWithTimestamp('warn', 'Unauthorized access attempt to Co-Pilot command endpoint');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id; // Get the authenticated user's ID
  logWithTimestamp('info', 'Received Co-Pilot command request for user', { userId });

  try {
    // 2. Receive the command text from the frontend
    const body = await request.json();
    const userCommand = body.command as string;
    // The frontend might also send context, e.g., the ID of a contact the agent is currently viewing
    const context = body.context || {}; // Example: { currentContactId: '...' }

    if (!userCommand) {
      logWithTimestamp('warn', 'No command provided in Co-Pilot request', { userId });
      return NextResponse.json({ error: 'No command provided' }, { status: 400 });
    }

    logWithTimestamp('info', 'User command received', { userId, command: userCommand });

    // --- Trigger n8n Co-Pilot Command Workflow ---

    const N8N_COPILOT_WEBHOOK_URL = process.env.N8N_COPILOT_WEBHOOK_URL; // Your n8n webhook URL
    const N8N_COPILOT_WEBHOOK_API_KEY = process.env.N8N_COPILOT_WEBHOOK_API_KEY; // Your n8n webhook API key

    if (!N8N_COPILOT_WEBHOOK_URL || !N8N_COPILOT_WEBHOOK_API_KEY) {
      logWithTimestamp('error', 'Missing N8N Co-Pilot webhook environment variables', { userId });
      return NextResponse.json({
        response: {
            text: 'Sorry, the Co-Pilot service is currently unavailable (configuration error).',
            type: 'error',
            data: null,
        }
      }, { status: 500 });
    }

    try {
      // Construct the payload to send to n8n
      const n8nPayload = {
        userId: userId,           // Pass the authenticated user's ID
        commandText: userCommand, // Pass the user's raw command text
        context: context,         // Pass any relevant context
        // Add any other necessary data for the n8n workflow
      };

      logWithTimestamp('info', 'Sending payload to n8n Co-Pilot webhook', { userId, payload: n8nPayload });

      // Send the payload to the n8n webhook using fetch
      // We will wait for n8n's response for Co-Pilot commands.
      // The n8n webhook MUST use the "Using 'Respond to Webhook' Node" response mode.
      const n8nResponse = await fetch(N8N_COPILOT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Sending JSON data to n8n webhook
          'X-Api-Key': N8N_COPILOT_WEBHOOK_API_KEY, // Using Header Auth with API Key
        },
        body: JSON.stringify(n8nPayload),
        // You might want to add a timeout here using AbortController if n8n takes too long
      });

      logWithTimestamp('info', 'Received response from n8n Co-Pilot webhook', { userId, status: n8nResponse.status });

      // Check if the request to n8n was successful (n8n will respond with a custom status/body via 'Respond to Webhook' node)
      if (!n8nResponse.ok) {
        // Attempt to read error details from n8n response
        let n8nErrorText = 'Unknown error from automation webhook.';
        try {
             n8nErrorText = await n8nResponse.text();
             logWithTimestamp('error', `n8n Co-Pilot webhook responded with non-OK status ${n8nResponse.status}:`, { userId, responseBody: n8nErrorText });
        } catch {
             logWithTimestamp('error', `n8n Co-Pilot webhook responded with non-OK status ${n8nResponse.status}, but could not read body.`, { userId });
        }

        // Return a generic error response to the frontend if n8n had an issue
        // Note: If n8n's workflow fails *after* the webhook receives data, the webhook might
        // still return 200, but a subsequent 'Respond to Webhook' node might send an error status/body.
        // Or the n8n workflow might fail entirely, causing this fetch() to eventually time out or error.
        // The error handling here depends on exactly how your n8n workflow handles errors and responds.
        // For simplicity in the MVP, let's assume a non-200 status from the *final* Respond to Webhook means an error.
        return NextResponse.json(
          {
             response: {
                 text: `Sorry, the Co-Pilot encountered an issue during processing. Status: ${n8nResponse.status}`,
                 type: 'error',
                 data: null,
             }
          },
          { status: n8nResponse.status || 500 } // Use the status from n8n if available
        );
      }

      // Assuming n8n's 'Respond to Webhook' node sends the final AI response in the body as JSON:
      // { "response": { "text": "AI message", "type": "...", "data": {...} } }
      const n8nResponseBody = await n8nResponse.json();

      // 4. Return n8n's response to the frontend
      // The frontend's CoPilotChat component expects an object with a 'response' property
      if (n8nResponseBody && typeof n8nResponseBody === 'object' && 'response' in n8nResponseBody) {
           logWithTimestamp('info', 'Returning n8n response to frontend', { userId, response: n8nResponseBody.response });
           return NextResponse.json(n8nResponseBody, { status: 200 });
      } else {
           // Handle unexpected response format from n8n
           logWithTimestamp('error', 'n8n returned unexpected response format', { userId, responseBody: n8nResponseBody });
           return NextResponse.json({
               response: {
                   text: "Sorry, I received an unexpected response from my internal system.",
                   type: 'error',
                   data: null,
               }
           }, { status: 500 });
      }


    } catch (webhookError: any) {
      // This catches network errors, timeouts, or other issues during the fetch call to n8n
      logWithTimestamp('error', 'Error sending data to n8n Co-Pilot webhook or receiving response:', { userId, error: webhookError });
      return NextResponse.json(
        {
           response: {
               text: 'Sorry, I could not connect to the Co-Pilot system. Please try again.',
               type: 'error',
               data: null,
           }
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    // This catch block handles errors *before* attempting to call the n8n webhook
    logWithTimestamp('error', "API Route Error processing initial request:", { userId, error: error });
    // Return a generic error response for unexpected issues during file reception/parsing
    return NextResponse.json({
       response: {
          text: error.message || 'An unexpected error occurred while processing your request.',
          type: 'error',
          data: null,
       }
    }, { status: 500 });
  }
}
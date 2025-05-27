// app/api/import-csv/route.ts
// This route acts as a secure gateway to trigger the n8n CSV import workflow.

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
    logWithTimestamp('warn', 'Unauthorized access attempt to import-csv endpoint');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id; // Get the authenticated user's ID
  logWithTimestamp('info', 'Received CSV import request for user', { userId });

  try {
    // 2. Receive and parse the file data from the request
    const formData = await request.formData();
    // 'csvFile' should match the 'name' or append key used in the frontend FormData
    const file = formData.get('csvFile') as File | null;

    if (!file) {
      logWithTimestamp('warn', 'No file uploaded in import-csv request', { userId });
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    logWithTimestamp('info', 'File received', { userId, fileName: file.name, fileSize: file.size });


    // Read the file content as text
    // Note: This approach reads the entire file into memory.
    // For very large files, consider streaming directly to n8n if its webhook supports it,
    // or saving temporarily to disk/storage.
    const csvContent = await file.text();

    // --- Core Logic for Option 2: Send data to n8n import webhook ---

    // Use the NEW naming conventions for environment variables
    const N8N_IMPORT_WEBHOOK_URL = process.env.N8N_IMPORT_WEBHOOK_URL;
    const N8N_IMPORT_API_KEY = process.env.N8N_IMPORT_API_KEY;

    if (!N8N_IMPORT_WEBHOOK_URL || !N8N_IMPORT_API_KEY) {
      logWithTimestamp('error', 'Missing N8N import webhook environment variables', { userId });
      return NextResponse.json({
        error: 'Import automation is not configured properly on the server.'
      }, { status: 500 });
    }

    try {
      // Construct the payload to send to n8n
      const n8nPayload = {
        userId: userId,          // Pass the user ID
        csvContent: csvContent,  // Pass the raw CSV content
        fileName: file.name,     // Optional: pass the original file name
        // Add other metadata if needed for the n8n import workflow
      };

      logWithTimestamp('info', 'Sending payload to n8n import webhook', { userId, fileName: file.name });

      // Send the payload to the n8n webhook using fetch
      // The n8n import webhook should use the "Respond Immediately" response mode.
      const n8nResponse = await fetch(N8N_IMPORT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Sending JSON data to n8n webhook
          'X-Api-Key': N8N_IMPORT_API_KEY, // Using Header Auth with API Key
        },
        body: JSON.stringify(n8nPayload),
        // Since n8n 'Respond Immediately', we don't need a long timeout here for the fetch itself.
        // A short timeout might be useful to catch immediate network issues.
        // timeout: 5000 // fetch doesn't have a built-in timeout like axios, requires AbortController
      });

      logWithTimestamp('info', 'Received response from n8n import webhook', { userId, fileName: file.name, status: n8nResponse.status });


      // Check if the request to n8n was successful (n8n webhook returns 200 OK immediately on success)
      if (!n8nResponse.ok) {
        // Attempt to read error details from n8n response if it's not 200
        let n8nErrorText = `Webhook responded with status ${n8nResponse.status}.`;
         try {
             n8nErrorText = await n8nResponse.text();
             logWithTimestamp('error', `n8n import webhook responded with non-OK status ${n8nResponse.status}:`, { userId, fileName: file.name, responseBody: n8nErrorText });
         } catch {
              logWithTimestamp('error', `n8n import webhook responded with non-OK status ${n8nResponse.status}, but could not read body.`, { userId, fileName: file.name });
         }

        // Return an error response to the frontend
        return NextResponse.json(
          { error: `Failed to start import process: ${n8nErrorText}` },
          { status: n8nResponse.status || 500 } // Use the status from n8n if available
        );
      }

      // 3. Return a success response to the frontend immediately
      // The actual CSV processing and database insertion happens asynchronously in n8n.
      // We might read a success message from n8n's immediate response body if configured,
      // but for 'Respond Immediately', the body is often empty or minimal.
       const successMessage = 'CSV file received and sent for processing. Your contacts will appear shortly.';
       // You could potentially read a JSON message here if n8n is configured to return one
       // try { const n8nSuccessBody = await n8nResponse.json(); if(n8nSuccessBody.message) successMessage = n8nSuccessBody.message; } catch {}


      logWithTimestamp('info', 'Successfully triggered n8n import workflow', { userId, fileName: file.name });
      return NextResponse.json(
        { message: successMessage },
        { status: 200 }
      );

    } catch (webhookError: any) {
      // This catches network errors, timeouts, or other issues during the fetch call to n8n
      logWithTimestamp('error', 'Error sending data to n8n import webhook or receiving immediate response:', { userId, fileName: file.name, error: webhookError });
      return NextResponse.json(
        {
           error: 'Failed to connect to the import automation system. Please try again.',
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    // This catch block handles errors *before* attempting to call the n8n webhook
    logWithTimestamp('error', "API Route Error processing initial file upload:", { userId, error: error });
    // Return a generic error response for unexpected issues during file reception/parsing
    return NextResponse.json({ error: error.message || 'An unexpected error occurred during file upload processing.' }, { status: 500 });
  }
}

// Important: Ensure this route definition is accessible.
// For App Router, this file should be within the `app/api/import-csv/` directory
// and named `route.ts`.
// app/api/copilot-command/route.ts
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// We'll need an LLM client library or direct API call setup here.
// For demonstration, let's use a placeholder function `callLLM`
// You will replace this with your actual LLM integration (GCP Vertex AI, OpenAI, etc.)
// We'll assume the LLM returns a JSON structure like { intent: 'SHOW_CONTACTS', params: { ... } }

// Placeholder for your LLM interaction logic
// In a real scenario, this would use an SDK or fetch call to a service like GCP Vertex AI
async function callLLM(command: string): Promise<{ intent: string; params?: any }> {
    console.log("Calling LLM with command:", command);

    // --- Simulate LLM response based on simple keyword matching for MVP ---
    // In production, the LLM would do the real understanding.
    const lowerCommand = command.toLowerCase();
    if (lowerCommand.includes('show') && lowerCommand.includes('contacts')) {
        return { intent: 'SHOW_CONTACTS' };
    }
    if (lowerCommand.includes('list') && lowerCommand.includes('contacts')) {
         return { intent: 'SHOW_CONTACTS' };
    }
     if (lowerCommand.includes('add') && lowerCommand.includes('contact')) {
         // Basic intent for future
         return { intent: 'ADD_CONTACT', params: { name: 'Unknown', details: command } };
     }
     if (lowerCommand.includes('hello') || lowerCommand.includes('hi')) {
         return { intent: 'GREETING' };
     }


    // Default to unknown intent
    return { intent: 'UNKNOWN' };
}
// --- End of Placeholder ---


export async function POST(request: Request) {
  // 1. Authenticate the user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;

  try {
    // 2. Receive the user's command from the request body
    const { command } = await request.json();

    if (typeof command !== 'string' || command.trim() === '') {
      return NextResponse.json({ error: 'Invalid command' }, { status: 400 });
    }

    // 3. Send the command to the LLM to understand intent and extract parameters
    // You will replace `callLLM` with your actual LLM integration
    const llmResponse = await callLLM(command);
    const { intent, params } = llmResponse;

    let aiResponseContent: any = {
        type: 'text', // Default response type is text
        text: "Sorry, I didn't understand that command.", // Default response message
    };
    let status = 200;

    // 4. Based on intent, perform the necessary action
    switch (intent) {
        case 'SHOW_CONTACTS':
            // Fetch contacts from Supabase for this user
            const { data: contacts, error: contactsError } = await supabase
                .from('contacts')
                .select('id, name, phone, email, property_address') // Select relevant contact fields
                .eq('user_id', userId) // Ensure we only fetch the current user's contacts (RLS helps too)
                .order('name'); // Optional: order the results

            if (contactsError) {
                console.error('Error fetching contacts for SHOW_CONTACTS intent:', contactsError);
                 aiResponseContent = {
                     type: 'text',
                     text: "Sorry, I couldn't retrieve your contacts right now.",
                 };
                 status = 500; // Indicate a server error occurred during action
            } else {
                // Format the response to include the contact data
                aiResponseContent = {
                    type: 'contacts_list', // Custom type for frontend to recognize
                    text: `Found ${contacts.length} contacts:`, // Introductory text
                    data: contacts, // The actual contact data
                };
                if (contacts.length === 0) {
                     aiResponseContent.text = "You don't have any contacts yet.";
                }
            }
            break;

        case 'ADD_CONTACT':
             // Handle "Add Contact" intent (Placeholder for now)
             // You'd extract name/details from `params` here
             aiResponseContent = {
                 type: 'text',
                 text: "I understand you want to add a contact. Please provide more details like Name, Phone, and Email.",
             };
            break;

        case 'GREETING':
             aiResponseContent = {
                 type: 'text',
                 text: "Hello there! How can I assist you today?",
             };
             break;

        case 'UNKNOWN':
        default:
            // Default 'UNKNOWN' intent response is already set
            break;
    }


    // 5. Return the AI's response to the frontend
    // The response includes the determined type of content and the data.
    return NextResponse.json({ response: aiResponseContent }, { status: status });

  } catch (error: any) {
    console.error("API Route Error processing command:", error);
    // Return a generic error for unhandled exceptions
    return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
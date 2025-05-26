// app/api/copilot-command/route.ts
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// Import Vertex AI library components
import { VertexAI } from '@google-cloud/vertexai';

// Utility function for structured logging
function logWithTimestamp(level: 'info' | 'warn' | 'error', message: string, data?: unknown): void {
  const timestamp = new Date().toISOString();
  console[level](`[${timestamp}] ${message}`, data ? data : '');
}

// Utility function for retrying API calls
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      logWithTimestamp('warn', `Operation failed (attempt ${attempt + 1}/${maxRetries + 1})`, error);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
        // Exponential backoff
        delay *= 2;
      }
    }
  }
  
  throw lastError;
}

// Define interfaces for type safety
interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  dataType?: 'contacts_list' | 'error' | 'warning';
  data?: unknown;
}

// Define the structure for AI action parameters
interface ShowContactsParameters {
  name?: string;
  location?: string;
  source?: string;
  added_within?: string;
}

interface UnknownParameters {
  query: string;
}

// Define the AI action interface
interface AIAction {
  action: 'show_contacts' | 'add_note' | 'get_contact_details' | 'unknown';
  parameters: ShowContactsParameters | UnknownParameters;
  confidence: number;
}

// Configuration for Vertex AI/Gemini
const project = process.env.GCP_PROJECT_ID!;
const location = process.env.GCP_LOCATION!;
const model = 'gemini-1.5-flash-001'; // Or another suitable Gemini model

// Initialize Vertex AI client (outside the handler for potential performance benefits)
const vertex_ai = new VertexAI({ project: project, location: location });

// Get the generative model instance
const generativeModel = vertex_ai.getGenerativeModel({
  model: model,
  // Optional: Configure model parameters
   generationConfig: { temperature: 0.2 },
});


// --- System Instruction / Initial Prompt for Gemini ---
// --- System Instruction / Initial Prompt for Gemini ---
const systemInstruction = `
You are AgentFlow AI, a helpful and intelligent co-pilot integrated directly into a real estate agent's application.

IMPORTANT: You are NOT a general AI assistant. You are a specialized component that processes commands and returns structured JSON responses ONLY.

You have direct API access to the agent's contact database through this application. When the agent asks about their contacts, you will query the database and return results.

You MUST respond with ONLY a JSON object inside triple backticks. The JSON MUST include 'action', 'parameters', and 'confidence' fields.

Here are the possible actions and the exact JSON format you MUST use:

1. **Show Contacts:** When the agent wants to view contacts.
   Example commands: "Show my contacts", "List contacts named Smith", "Find contacts in California"
   
   RESPOND EXACTLY LIKE THIS:
   \`\`\`
   {
     "action": "show_contacts",
     "parameters": {
       "name": "Smith",  // Optional: name filter (omit if not in query)
       "location": "California"  // Optional: location filter (omit if not in query)
     },
     "confidence": 0.9
   }
   \`\`\`

2. **Unknown Command:** For commands you don't understand or general chat.
   Example commands: "Hello", "How are you?", "What's the weather?"
   
   RESPOND EXACTLY LIKE THIS:
   \`\`\`
   {
     "action": "unknown",
     "parameters": {
       "query": "Hello there"  // Rephrase of the original query
     },
     "confidence": 1.0
   }
   \`\`\`

NEVER respond with explanatory text outside the JSON. NEVER say you can't access the database - you are integrated with the application that has database access.

ALWAYS use the exact JSON structure shown above with all required fields.
`;


export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } = {} } = await supabase.auth.getUser(); // Added {} default

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;

  try {
    const body = await request.json();
    const userCommand = body.command;

    if (!userCommand) {
      return NextResponse.json({ error: 'No command provided' }, { status: 400 });
    }

    // --- Call Google Gemini API ---
    const chat = generativeModel.startChat({
        // Optional: Add chat history for context
        // history: [],
    });

    // Send the system instruction and user command with retry logic
    const result = await retryOperation(async () => {
        logWithTimestamp('info', 'Sending command to Gemini API', { command: userCommand });
        return await chat.sendMessage([
            {text: systemInstruction},
            {text: userCommand}
        ]);
    });

    // --- Extract text from the Gemini response structure ---
    // The text is in candidates[0].content.parts[0].text
    const responseText = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
    logWithTimestamp('info', 'Gemini Raw Response:', responseText);

    // --- Process Gemini's Response ---
    // Safely check if responseText is a string before using .match()
    if (typeof responseText !== 'string' || responseText.trim() === '') {
        logWithTimestamp('error', "Gemini returned no text response or an empty string.");
        // Log the full result object to inspect what came back
        logWithTimestamp('error', "Full Gemini Result Object:", JSON.stringify(result, null, 2));

        // Return an error message to the frontend
        return NextResponse.json({
             response: {
                 text: "Sorry, I couldn't get a valid response from the AI.",
                 type: 'error', // Indicate this is an AI error message
                 data: null,
             }
        }, { status: 500 }); // Use 500 as it's a server/AI issue
    }


    // Try different patterns to extract JSON from the response
    // First try the expected format with ```json
    let jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    
    // If that doesn't work, try just triple backticks ```...```
    if (!jsonMatch) {
        jsonMatch = responseText.match(/```\s?([\s\S]*?)\s?```/);
        logWithTimestamp('info', 'Found JSON with alternative pattern');
    }
    
    // If still no match, try to see if the entire response is JSON
    if (!jsonMatch && responseText.trim().startsWith('{') && responseText.trim().endsWith('}')) {
        // Create a match array with the entire response as the captured group
        jsonMatch = [responseText.trim(), responseText.trim()];
        logWithTimestamp('info', 'Treating entire response as JSON');
    }
    
    // Default to 'unknown' action if no JSON is found or can't be parsed
    let aiAction: AIAction = { 
      action: 'unknown', 
      parameters: { query: userCommand }, 
      confidence: 1.0 
    };
    
    // Check if we got a JSON response from Gemini
    if (jsonMatch && jsonMatch[1]) {
      try {
        // Parse the JSON block
        const parsedJson = JSON.parse(jsonMatch[1]);
        
        // Validate and normalize the response format
        if (parsedJson && typeof parsedJson === 'object') {
          // Ensure we have an action property
          if (parsedJson.action) {
            // Create a properly formatted aiAction object
            aiAction = {
              action: parsedJson.action,
              parameters: parsedJson.parameters || { query: userCommand },
              confidence: parsedJson.confidence || 1.0
            } as AIAction;
          }
          
          // Log what we received vs. what we're using
          logWithTimestamp('info', 'Parsed JSON from Gemini:', parsedJson);
          logWithTimestamp('info', 'Normalized aiAction:', aiAction);
        }

        // --- Perform Action based on Parsed JSON (Refined) ---
        let aiResponseForChat = "Processing your command..."; // Default text message
        let aiResponseDataType: ChatMessage['dataType'] | undefined = undefined; // Default data type
        let aiResponseData: unknown = null; // Default data payload (null)

        if (aiAction.action === 'show_contacts') {
          // Type guard to ensure we're working with ShowContactsParameters
          const params = aiAction.parameters as ShowContactsParameters;
          logWithTimestamp('info', "Gemini identified action: show_contacts with params:", params);

          // Build Supabase query based on parameters and user ID (RLS handles user ID implicitly)
          let query = supabase
            .from('contacts')
            .select('id, name, phone, email, property_address'); // Select relevant fields the UI expects

          // --- Implement Filtering based on Gemini's Parameters ---
          // Ensure parameters exists and properties are strings before using them
          if (params.name && typeof params.name === 'string') {
              // Basic case-insensitive name filter
              query = query.ilike('name', `%${params.name}%`);
          }
          
          if (params.location && typeof params.location === 'string') {
              // Filter by property address if location parameter is provided
              query = query.ilike('property_address', `%${params.location}%`);
          }
          // Add filters for other parameters as you implement them (e.g., email, phone)

          const { data: contacts, error: contactError } = await query;

          if (contactError) {
              logWithTimestamp('error', "Error fetching contacts based on command:", contactError);
              aiResponseForChat = "Sorry, I couldn't fetch your contacts.";
              // No data or specific error type needed for the chat bubble for a fetch error
              aiResponseDataType = undefined; // Ensure no data is sent if fetch fails
              aiResponseData = null;
          } else {
              // --- Format Response for Frontend Chat ---
              // aiResponseForChat: Natural language summary text
              // aiResponseDataType: 'contacts_list'
              // aiResponseData: The array of contact objects

              if (contacts && contacts.length > 0) {
                  aiResponseForChat = `Found ${contacts.length} contact${contacts.length > 1 ? 's' : ''}.`;
                  aiResponseDataType = 'contacts_list'; // Set the data type for frontend
                  aiResponseData = contacts; // Attach the actual contact data array
              } else {
                  aiResponseForChat = params.name || params.location
                    ? "Found no contacts matching your criteria." // More specific if filters were applied
                    : "Found no contacts in your list."; // Generic if no filters
                  aiResponseDataType = 'contacts_list'; // Still indicate contacts list type, but with empty data
                  aiResponseData = []; // Send an empty array so the UI renders "No contacts found" within the bubble
              }
          }

        } else if (aiAction.action === 'unknown') {
             // Type guard to ensure we're working with UnknownParameters
             const params = aiAction.parameters as UnknownParameters;
             // Use the rephrased query from Gemini if available, otherwise the original
             const queryText = params.query || userCommand;
             aiResponseForChat = `I'm not sure how to process "${queryText}". What would you like to do?`;
             aiResponseDataType = undefined; // No specific data type for unknown
             aiResponseData = null;
        }
        // Add handlers for other actions (add_note, get_contact_details) here

         // Return the AI's natural language response and any structured data
        return NextResponse.json({
           response: {
               text: aiResponseForChat,
               type: aiResponseDataType,
               data: aiResponseData,
           }
        }, { status: 200 }); // Return 200 even if action resulted in no contacts, it's a successful AI interaction

      } catch (parseError: unknown) {
        logWithTimestamp('error', "Error parsing Gemini JSON response:", parseError);
        
        // Log the specific error details
        if (parseError instanceof Error) {
          logWithTimestamp('error', "Parse error details:", parseError.message);
        }
        
        // Fallback response if JSON parsing fails but raw text was received
        return NextResponse.json({
            response: {
                 text: "Sorry, I had trouble understanding the structured response from my AI brain.",
                 type: 'error', // Indicate error
                 data: null,
            }
        }, { status: 500 });
      }
    } else {
        // If we received text but no JSON block, treat it as a direct response
        logWithTimestamp('warn', "Gemini response did not contain expected JSON format. Using text directly:", responseText);
        
        // Use the text directly as a response for a better user experience
        return NextResponse.json({
            response: {
                text: responseText.trim(), // Use the actual response from Gemini
                type: undefined, // No specific data type
                data: null,
            }
        }, { status: 200 }); // Return 200 since we have a valid response, just not in JSON format
    }


  } catch (error: unknown) {
    logWithTimestamp('error', "API Route Error:", error);
    // This catch block handles errors *before* or *during* the Gemini call itself
    
    // Safely extract error message with type checking
    let errorMessage = 'An unexpected error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = String(error.message);
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    return NextResponse.json({
         response: {
              text: errorMessage,
              type: 'error', // Indicate error
              data: null,
         }
    }, { status: 500 });
  }
}
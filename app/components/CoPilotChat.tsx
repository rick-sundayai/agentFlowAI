// components/CoPilotChat.tsx
"use client";

import { useState, useRef, useEffect } from 'react';

// Define a type for a message in the chat
interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'ai'; // 'user' for the agent, 'ai' for the Co-Pilot
  // Properties for structured data display received from backend
  dataType?: 'contacts_list'; // Specific type for contacts
  data?: any; // Data payload for structured types (e.g., contacts array) - can be more specific later
}

// Define a type for contact data received in the response payload
// This should match the shape of contact objects returned by your backend API
interface ContactData {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    property_address: string | null;
    // Add other fields as needed
}


export default function CoPilotChat() {
  // State to hold the list of messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // State for the current input text
  const [inputText, setInputText] = useState('');
  // State to indicate if the AI is processing
  const [isProcessing, setIsProcessing] = useState(false);

  // Ref for the chat messages container to auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);

   // Add an initial greeting message when the component mounts
  useEffect(() => {
      // Only add the initial message once when the component first mounts
      if (messages.length === 0) {
         setMessages([{
             id: Date.now(), // Use a reliable unique ID
             text: "Hello! I'm your AgentFlow AI Co-Pilot. How can I assist you today?",
             sender: 'ai'
         }]);
      }
  }, [messages]); // Dependency array includes messages to ensure it only runs when messages array is initially empty


  // Effect to scroll to the bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]); // Dependency array: re-run when 'messages' state changes

  // Function to handle sending a message (when the user hits Enter or clicks Send)
  const handleSendMessage = async () => {
    if (inputText.trim() === '') return; // Don't send empty messages

    const userMessageText = inputText; // Store the command before clearing input
    const newUserMessage: ChatMessage = {
      id: Date.now(), // Simple unique ID for now
      text: userMessageText,
      sender: 'user',
    };

    // Add the user's message to the chat immediately
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputText(''); // Clear the input field

    setIsProcessing(true); // Indicate processing starts

    // --- Call your backend API route ---
    try {
        const response = await fetch('/api/copilot-command', { // Your new API route
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // We get the user on the server, so just sending the command is enough:
            body: JSON.stringify({ command: userMessageText }),
        });

        if (!response.ok) {
            // Attempt to read error message from backend response
            // Assuming backend returns JSON even on errors
            const errorBody = await response.json();
            const errorMessageText = errorBody.error || `HTTP error! status: ${response.status}`;
            // Throw an error so the catch block handles it
            throw new Error(errorMessageText);
        }

        // Assuming the backend always returns JSON with a 'response' field
        const result = await response.json();
        // Expected backend response structure: { response: { text: '...', type?: '...', data?: ... } }
        const aiResponseContent = result.response;

        // Validate the expected response structure
        if (!aiResponseContent || typeof aiResponseContent.text === 'undefined') {
             console.error("Unexpected backend response structure:", result);
             throw new Error("Invalid response format from Co-Pilot backend.");
        }


        // Create the AI message object, including potential structured data
        const newAiMessage: ChatMessage = {
             id: Date.now() + 1, // Ensure unique ID
             text: aiResponseContent.text, // Always include text for the bubble
             sender: 'ai',
             // Include dataType and data only if provided by the backend
             dataType: aiResponseContent.type,
             data: aiResponseContent.data,
        };

        // Add the AI's response (with or without data) to the chat
        setMessages((prevMessages) => [...prevMessages, newAiMessage]);

    } catch (error: any) {
        console.error("Error communicating with AI backend:", error);
        // Display an error message in the chat bubble if the fetch fails or response is bad
        const errorMessage: ChatMessage = {
             id: Date.now() + 1,
             text: `Sorry, I encountered an error processing your request: ${error.message}`,
             sender: 'ai',
        };
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
        setIsProcessing(false); // Processing ends
    }
  };

  // Handle key press (like 'Enter')
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isProcessing) { // Prevent sending multiple times while processing
      event.preventDefault(); // Prevent default form submission or new line
      handleSendMessage();
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow-inner flex flex-col h-[450px] border border-gray-200 dark:border-gray-600"> {/* Adjusted styling */}
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
         <span className="text-indigo-600 dark:text-indigo-400 mr-2">AI</span> Co-Pilot
      </h3>

      {/* Chat Messages Display Area */}
      <div className="flex-grow overflow-y-auto space-y-4 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm"> {/* Added background */}
        {messages.length === 1 && messages[0].sender === 'ai' && ( // Display initial prompt if no user messages yet
           <p className="text-gray-500 italic text-center">
            Type a command to get started, e.g., "Show my contacts."
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.sender === 'user'
                  ? 'bg-indigo-500 text-white' // User bubble style
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200' // AI bubble style
              }`}
            >
              {/* Display the text part of the message */}
              <p>{msg.text}</p>

              {/* Render structured data below the text if available */}
              {/* Check for dataType and ensure data is an array before mapping for contacts_list */}
              {msg.dataType === 'contacts_list' && Array.isArray(msg.data) && (
                 <div className="mt-2 border-t border-gray-300 dark:border-gray-500 pt-2">
                     {msg.data.length > 0 ? (
                         <ul className="text-sm space-y-1">
                             {msg.data.map((contact: ContactData) => ( // Use ContactData type for mapping
                                 // Ensure contact has an id for the key
                                 <li key={contact.id || contact.name} className="truncate"> {/* Fallback key if id missing */}
                                     <strong>{contact.name}:</strong> {contact.email || contact.phone || 'No contact info'}
                                 </li>
                             ))}
                         </ul>
                     ) : (
                         <p className="italic">No contacts found matching criteria.</p> // More specific message
                     )}
                 </div>
              )}
               {/* Add rendering logic for other data types here in the future */}

            </div>
          </div>
        ))}
        <div ref={messagesEndRef} /> {/* Empty div to scroll to */}
      </div>

      {/* Message Input Area */}
      <div className="mt-4 flex">
        <input
          type="text"
          placeholder={isProcessing ? "Co-Pilot is thinking..." : "Type your command..."}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isProcessing}
          className="flex-grow rounded-l-md border-0 py-2 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:opacity-50 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400 dark:ring-gray-500 dark:focus:ring-indigo-500"
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputText.trim() || isProcessing}
          className="inline-flex items-center justify-center rounded-r-md border border-transparent px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
       {isProcessing && (
            <p className="text-sm text-gray-600 dark:text-gray-400 italic mt-2 text-center">Working on it...</p>
        )}
    </div>
  );
}
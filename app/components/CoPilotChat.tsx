// components/CoPilotChat.tsx
"use client";

import { useState, useRef, useEffect } from 'react';

// Define a type for a message in the chat
interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'ai'; // 'user' for the agent, 'ai' for the Co-Pilot
  // Add properties for structured data display
  dataType?: 'contacts_list';
  data?: any; // Data payload for structured types (e.g., contacts array)
}

// Define a type for contact data received in the response
interface ContactData {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    property_address: string | null;
    // Add other fields as needed
}


export default function CoPilotChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

   // Add an initial greeting message when the component mounts
  useEffect(() => {
      // Only add the initial message once
      if (messages.length === 0) {
         setMessages([{
             id: Date.now(),
             text: "Hello! I'm your AgentFlow AI Co-Pilot. How can I assist you today?",
             sender: 'ai'
         }]);
      }
  }, []); // Empty dependency array


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputText.trim() === '') return;

    const userMessageText = inputText; // Store before clearing
    const newUserMessage: ChatMessage = {
      id: Date.now(),
      text: userMessageText,
      sender: 'user',
    };

    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputText('');
    setIsProcessing(true);

    // --- Call your new backend API route ---
    try {
        const response = await fetch('/api/copilot-command', { // Your new API route
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: userMessageText }), // Send the user's text command
        });

        if (!response.ok) {
            // Attempt to read error message from backend response
            const errorBody = await response.json();
            const errorMessageText = errorBody.error || 'Failed to process command.';
            throw new Error(`Backend error: ${response.status} - ${errorMessageText}`);
        }

        const result = await response.json(); // Assuming backend sends back { response: { type: '...', text: '...', data: ... } }
        const aiResponseContent = result.response;

        // Determine the type of message to display based on the backend response
        const newAiMessage: ChatMessage = {
             id: Date.now() + 1,
             text: aiResponseContent.text || '', // Always include text, even if there's structured data
             sender: 'ai',
             dataType: aiResponseContent.type, // Store the data type
             data: aiResponseContent.data, // Store any associated data (like contacts array)
        };

        setMessages((prevMessages) => [...prevMessages, newAiMessage]);

    } catch (error: any) {
        console.error("Error sending message to AI backend:", error);
        const errorMessage: ChatMessage = {
             id: Date.now() + 1,
             text: `Sorry, I encountered an error processing your request: ${error.message}`,
             sender: 'ai',
        };
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isProcessing) { // Prevent sending multiple times while processing
      event.preventDefault();
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
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.sender === 'user'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
              }`}
            >
              {/* Render different content based on message type */}
              {msg.text} {/* Display the text part */}

              {/* Render structured data below the text */}
              {msg.dataType === 'contacts_list' && msg.data && (
                 <div className="mt-2 border-t border-gray-300 dark:border-gray-500 pt-2">
                     {msg.data.length > 0 ? (
                         <ul className="text-sm space-y-1">
                             {msg.data.map((contact: ContactData) => (
                                 <li key={contact.id} className="truncate"> {/* Use ContactData type */}
                                     <strong>{contact.name}:</strong> {contact.email || contact.phone || 'No contact info'}
                                 </li>
                             ))}
                         </ul>
                     ) : (
                         <p className="italic">No contacts found.</p>
                     )}
                 </div>
              )}
               {/* Add rendering logic for other data types here in the future */}

            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
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
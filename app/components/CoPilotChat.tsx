// components/CoPilotChat.tsx
"use client";

import { useState, useRef, useEffect } from 'react';

// Define a type for a message in the chat
interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'ai'; // 'user' for the agent, 'ai' for the Co-Pilot
}

export default function CoPilotChat() {
  // State to hold the list of messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // State for the current input text
  const [inputText, setInputText] = useState('');
  // State to indicate if the AI is processing (optional for basic UI)
  const [isProcessing, setIsProcessing] = useState(false);

  // Ref for the chat messages container to auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Effect to scroll to the bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]); // Dependency array: re-run when 'messages' state changes

  // Function to handle sending a message (when the user hits Enter or clicks Send)
  const handleSendMessage = async () => {
    if (inputText.trim() === '') return; // Don't send empty messages

    const newUserMessage: ChatMessage = {
      id: Date.now(), // Simple unique ID for now
      text: inputText,
      sender: 'user',
    };

    // Add the user's message to the chat immediately
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputText(''); // Clear the input field

    setIsProcessing(true); // Indicate processing starts

    // --- Future Integration Point ---
    // This is where you will send the newUserMessage.text to your backend API route
    // that will interact with the LLM and trigger actions.
    console.log("Sending message to backend (simulated):", newUserMessage.text);

    // Simulate an AI response for UI testing
    setTimeout(() => {
        const aiResponseText = `Acknowledged: "${newUserMessage.text}". I'm not fully integrated yet, but I received your message!`;
        const newAiMessage: ChatMessage = {
            id: Date.now() + 1, // Ensure unique ID
            text: aiResponseText,
            sender: 'ai',
        };
         setMessages((prevMessages) => [...prevMessages, newAiMessage]);
         setIsProcessing(false); // Processing ends
    }, 1000); // Simulate network delay

    // In the real implementation, you'll replace the above setTimeout with:
    /*
    try {
        const response = await fetch('/api/copilot-command', { // Your future API route
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: newUserMessage.text, userId: '...' }), // Send command and user ID
        });

        if (!response.ok) {
            throw new Error('Failed to get AI response');
        }

        const data = await response.json(); // Assuming backend sends back a response object
        const aiResponseText = data.response || 'Could not process command.'; // Or process structured data from backend

        const newAiMessage: ChatMessage = {
            id: Date.now() + 1,
            text: aiResponseText,
            sender: 'ai',
        };
        setMessages((prevMessages) => [...prevMessages, newAiMessage]);

    } catch (error) {
        console.error("Error sending message to AI backend:", error);
        const errorMessage: ChatMessage = {
             id: Date.now() + 1,
             text: "Sorry, I encountered an error processing your request.",
             sender: 'ai',
        };
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
        setIsProcessing(false); // Processing ends
    }
    */
  };

  // Handle key press (like 'Enter')
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent default form submission or new line
      handleSendMessage();
    }
  };

  return (
    <div className="bg-gray-100 p-6 rounded-lg shadow-md flex flex-col h-[400px]"> {/* Fixed height for chat area */}
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Co-Pilot</h3>

      {/* Chat Messages Display Area */}
      <div className="flex-grow overflow-y-auto space-y-4 p-2">
        {messages.length === 0 && (
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
                  : 'bg-gray-200 text-gray-800' // AI bubble style
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} /> {/* Empty div to scroll to */}
      </div>

      {/* Message Input Area */}
      <div className="mt-4 flex">
        <input
          type="text"
          placeholder={isProcessing ? "Processing..." : "Type your command..."}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isProcessing} // Disable input while processing
          className="flex-grow rounded-l-md border-0 py-2 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:opacity-50"
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputText.trim() || isProcessing} // Disable if input is empty or processing
          className="inline-flex items-center justify-center rounded-r-md border border-transparent px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
       {isProcessing && (
            <p className="text-sm text-gray-600 italic mt-2 text-center">Co-Pilot is thinking...</p>
        )}
    </div>
  );
}
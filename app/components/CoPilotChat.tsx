// components/CoPilotChat.tsx
"use client";

import { useRef, useEffect } from 'react';
// Import useChatContext and types needed for messages
import { useChatContext, ChatMessage } from '@/app/context/ChatContext';

import TypingIndicator from './ChatUI/TypingIndicator';
import MessageBubble from './ChatUI/MessageBubble';
import ChatInput from './ChatUI/ChatInput';


// This component is now just the Chat UI that uses the context
// It does NOT accept initial data props anymore
// interface CoPilotChatProps { userId: string; initialMessages?: ChatMessage[]; ... }


// This is the Client Component that renders the chat interface
export default function CoPilotChat() { // Removed props
  const {
    messages,
    isProcessing,
    isTyping,
    sendMessage,
    retryMessage,
    clearConversation
    // No panel data needed directly here
  } = useChatContext(); // Uses context provided by the layout

  // Ref for auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Effect to scroll to the bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    // --- This div now ONLY contains the Chat UI ---
    // The grid and panels are OUTSIDE this component in the page/layout
    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow-inner flex flex-col h-[450px] border border-gray-200 dark:border-gray-600" role="region" aria-label="AI Co-Pilot Chat Interface">
      {/* Header with title and clear button */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <span className="text-indigo-600 dark:text-indigo-400 mr-2">AI</span> Co-Pilot
        </h3>
        <button
          onClick={clearConversation}
          className="text-sm px-2 py-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Clear conversation"
          title="Clear conversation"
        >
          Clear Chat
        </button>
      </div>

      {/* Chat Messages Display Area */}
      <div
        className="flex-grow overflow-y-auto space-y-4 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm h-[300px]"
        role="log"
        aria-live="polite"
        aria-atomic="false"
      >
         {/* Check if the only message is the initial placeholder (now handled in ChatContext useEffect) */}
         {messages.length === 1 && messages[0].sender === 'ai' && messages[0].text === "Hello! I'm your AgentFlow AI Co-Pilot. How can I assist you today?" ? (
            <p className="text-gray-500 italic text-center">
              Type a command to get started, e.g., “Show my contacts.”
            </p>
          ) : messages.length === 0 ? (
             // Handle genuinely empty state after clear
             <p className="text-gray-500 italic text-center">
               Your conversation history is empty. Start chatting!
             </p>
          ) : null}


        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onRetry={message.isRetryable ? retryMessage : undefined}
          />
        ))}

        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Area */}
      <ChatInput
        onSendMessage={sendMessage}
        isProcessing={isProcessing}
        placeholder="Type your command..."
      />
    </div>
  );
}
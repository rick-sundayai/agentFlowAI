// components/CoPilotChat.tsx
"use client";

import { useRef, useEffect } from 'react';
import { ChatProvider, useChatContext, ChatMessage } from '@/app/context/ChatContext';
import TypingIndicator from './ChatUI/TypingIndicator';
import MessageBubble from './ChatUI/MessageBubble';
import ChatInput from './ChatUI/ChatInput';


// Wrapper component that provides the ChatContext
interface CoPilotChatProps {
  userId: string;
  initialMessages?: ChatMessage[];
}

export default function CoPilotChat({ userId, initialMessages = [] }: CoPilotChatProps) {
  return (
    <ChatProvider userId={userId} initialMessages={initialMessages}>
      <ChatInterface />
    </ChatProvider>
  );
}

// Main chat interface component that uses the ChatContext
function ChatInterface() {
  const { 
    messages, 
    isProcessing, 
    isTyping, 
    sendMessage, 
    retryMessage,
    clearConversation
  } = useChatContext();
  
  // Ref for the chat messages container to auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Effect to scroll to the bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]); // Re-run when messages state changes

  return (
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
        className="flex-grow overflow-y-auto space-y-4 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
        role="log"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.length === 1 && messages[0].sender === 'ai' && (
          <p className="text-gray-500 italic text-center">
            Type a command to get started, e.g., &ldquo;Show my contacts.&rdquo;
          </p>
        )}
        
        {/* Map through messages and render them */}
        {messages.map((message) => (
          <MessageBubble 
            key={message.id} 
            message={message} 
            onRetry={message.isRetryable ? retryMessage : undefined} 
          />
        ))}
        
        {/* Show typing indicator when AI is thinking */}
        {isTyping && <TypingIndicator />}
        
        {/* Empty div for auto-scrolling */}
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
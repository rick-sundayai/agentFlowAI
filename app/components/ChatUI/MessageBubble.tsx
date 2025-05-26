// app/components/ChatUI/MessageBubble.tsx
'use client';

import { useState } from 'react';
import { ChatMessage, ContactData } from '@/app/context/ChatContext';
import ContactItem from './ContactItem';

interface MessageBubbleProps {
  message: ChatMessage;
  onRetry?: (messageId: number) => Promise<void>;
}

export default function MessageBubble({ message, onRetry }: MessageBubbleProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  
  const handleRetry = async () => {
    if (!onRetry || isRetrying) return;
    
    setIsRetrying(true);
    try {
      await onRetry(message.id);
    } finally {
      setIsRetrying(false);
    }
  };

  const isAI = message.sender === 'ai';
  const isError = message.dataType === 'error';
  
  return (
    <div
      className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}
      role="listitem"
    >
      <div
        className={`max-w-[80%] rounded-lg p-3 ${
          isAI
            ? isError 
              ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' // Error style
              : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200' // AI bubble style
            : 'bg-indigo-500 text-white' // User bubble style
        }`}
      >
        {/* Display the text part of the message */}
        <p>{message.text}</p>

        {/* Render structured data below the text if available */}
        {message.dataType === 'contacts_list' && Array.isArray(message.data) && (
          <div className="mt-2 border-t border-gray-300 dark:border-gray-500 pt-2">
            {(message.data as ContactData[]).length > 0 ? (
              <ul className="text-sm space-y-1">
                {(message.data as ContactData[]).map((contact: ContactData) => (
                  <ContactItem key={contact.id || contact.name} contact={contact} />
                ))}
              </ul>
            ) : (
              <p className="italic">No contacts found matching criteria.</p>
            )}
          </div>
        )}

        {/* Retry button for error messages */}
        {isAI && message.isRetryable && onRetry && (
          <div className="mt-2 text-right">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className={`text-xs px-2 py-1 rounded ${isRetrying 
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800'}`}
              aria-label="Retry this request"
            >
              {isRetrying ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        )}

        {/* Timestamp */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

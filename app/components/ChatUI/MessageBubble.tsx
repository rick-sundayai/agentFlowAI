// app/components/ChatUI/MessageBubble.tsx
'use client';

import { useState } from 'react';
// Import ChatMessage and ContactData types from context file
import { ChatMessage, ContactData } from '@/app/context/ChatContext';
import ContactItem from './ContactItem';

// Helper function for consistent time formatting between server and client
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

interface MessageBubbleProps {
  message: ChatMessage;
  onRetry?: (messageId: number | string) => Promise<void>;
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
  // Use message.type to determine message type
  const isError = message.type === 'error';


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
        {/* Only show text if it exists, useful for messages that are purely structured data */}
        {message.text && <p className="text-sm">{message.text}</p>}


        {/* --- Render structured data below the text if available --- */}
        {/* Check message.type and access the contacts data */}
        {message.type === 'contacts_list' && (
          <div className="mt-2 border-t border-gray-300 dark:border-gray-500 pt-2">
            {(() => {
              // Safely extract contacts array with proper type checking
              const contacts = Array.isArray(message.data) 
                ? message.data as ContactData[] 
                : (message.data as Record<string, unknown>)?.contacts as ContactData[] || [];
              
              return contacts.length > 0 ? (
                <ul className="text-sm space-y-1">
                  {contacts.map((contact: ContactData) => (
                    // Ensure ContactItem can handle potentially missing 'id' for MVP
                    <ContactItem key={contact.id || contact.name || Math.random()} contact={contact} />
                  ))}
                </ul>
              ) : (
                // Only show "No contacts" message if text summary wasn't provided or is generic
                !message.text || message.text === `You have 0 contacts.` ? (
                  <p className="italic text-gray-600 dark:text-gray-400">No contacts found matching criteria.</p>
                ) : null // Avoid showing a redundant "No contacts" if the text already says 0
              );
            })()}
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
        {/* Ensure timestamp property exists on message object */}
        {message.timestamp && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
              {formatTime(message.timestamp)}
            </div>
        )}
      </div>
    </div>
  );
}
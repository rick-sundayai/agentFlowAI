// app/components/ChatUI/ChatInput.tsx
'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSendMessage: (text: string) => Promise<void>;
  isProcessing: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSendMessage, isProcessing, placeholder = 'Type your command...' }: ChatInputProps) {
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input when the component mounts
  useEffect(() => {
    if (inputRef.current && !isProcessing) {
      inputRef.current.focus();
    }
  }, [isProcessing]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (inputText.trim() === '' || isProcessing) return;
    
    const text = inputText;
    setInputText(''); // Clear input immediately for better UX
    await onSendMessage(text);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isProcessing) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex w-full">
      <div className="relative flex-grow">
        <input
          ref={inputRef}
          type="text"
          placeholder={isProcessing ? "Co-Pilot is thinking..." : placeholder}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isProcessing}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          aria-label="Type your message"
        />
        {inputText.length > 0 && (
          <button 
            type="button"
            onClick={() => setInputText('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Clear input"
          >
            ✕
          </button>
        )}
      </div>
      <button
        type="submit"
        disabled={inputText.trim() === '' || isProcessing}
        className={`px-4 py-2 rounded-r-lg ${isProcessing || inputText.trim() === ''
          ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          : 'bg-indigo-500 text-white hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700'}`}
        aria-label="Send message"
      >
        Send
      </button>
    </form>
  );
}

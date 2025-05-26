// app/components/ChatUI/TypingIndicator.tsx
'use client';

export default function TypingIndicator() {
  return (
    <div className="flex justify-start" role="status" aria-label="AI is typing">
      <div className="max-w-[80%] rounded-lg p-3 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200">
        <div className="flex space-x-2">
          <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
          <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}

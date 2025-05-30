// components/Sidebar.tsx
'use client';

import { useState } from 'react';
// Import useChatContext
import { useChatContext } from '@/app/context/ChatContext';
import SignOutButton from '@/app/(authenticated)/dashboard/signout-button'; // Import SignOutButton if placed here later

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  // --- Get user from context ---
  const { user } = useChatContext();
  // Use user's email as the primary identifier for display
  const userName = user?.email || 'Guest';


  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Example fixed height below header (assuming header is 64px)
  const sidebarHeight = 'calc(100vh - 64px)';

  return (
    <div className={`flex-shrink-0 ${isCollapsed ? 'w-16' : 'w-64'} bg-gray-900 text-white transition-width duration-300 ease-in-out flex flex-col`}
         style={{ height: sidebarHeight }}
    >
      {/* Header/Title in Sidebar */}
      <div className="flex items-center justify-between p-4 h-16 border-b border-gray-700 flex-shrink-0"> {/* Added flex-shrink-0 */}
        {!isCollapsed && (
            <h3 className="text-lg font-semibold">Chats</h3>
        )}
        <button
          onClick={toggleCollapse}
          className="p-1 rounded hover:bg-gray-700"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {/* Chevron icon (example using SVG) */}
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Chat List Area (Scrollable) */}
      <div className={`flex-grow overflow-y-auto ${isCollapsed ? 'hidden' : 'block'} p-4 space-y-2`}>
        {/* Placeholder Chat Items */}
        <div className="text-sm text-gray-300">Chat 1</div>
        <div className="text-sm text-gray-300">Chat 2</div>
        <div className="text-sm text-gray-300">Chat 3 (Placeholder)</div>
        {/* You would map over chat history conversations here later */}
        {/* You might need conversation list data in ChatContext as well */}
      </div>

      {/* --- User Avatar/Name Section at the bottom --- */}
      {/* This div will be at the bottom, pushed down by flex-grow */}
      <div className="p-4 border-t border-gray-700 flex items-center justify-center flex-shrink-0"> {/* Added flex-shrink-0 */}
         {isCollapsed ? (
             // Collapsed state: Show user initial or generic icon
             <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-medium text-sm">
                 {userName.charAt(0).toUpperCase()} {/* Show first initial */}
             </div>
         ) : (
             // Expanded state: Show user initial/avatar and name/email
             <div className="flex items-center w-full"> {/* Use w-full to take available space */}
                 {/* User Initial/Avatar */}
                 <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-medium text-sm mr-3">
                     {userName.charAt(0).toUpperCase()}
                 </div>
                 {/* User Name/Email */}
                 <div className="flex-grow overflow-hidden"> {/* Allow text to truncate */}
                     <p className="text-sm font-medium text-gray-300 truncate">{userName}</p> {/* Display email */}
                     {/* You could add a Sign Out button here if you move it from the header */}
                     {/* <SignOutButton /> */}
                 </div>
             </div>
         )}
      </div>

    </div>
  );
}
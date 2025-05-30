// components/TotalContactsPanel.tsx
'use client';

import { useChatContext, SummaryData } from '@/app/context/ChatContext'; // Import useChatContext and SummaryData type

// No props needed, data comes from context
export default function TotalContactsPanel() {
  const { displayedSummaryData } = useChatContext();
  // Access the totalContacts property from the summary data
  const totalContacts = displayedSummaryData ? displayedSummaryData.totalContacts : 0;


  return (
    // --- UI structure for the Total Contacts Summary Card ---
     <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-5 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
           <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Contacts</p>
              {/* Display data from context */}
              <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{totalContacts}</p>
           </div>
           {/* Optional: Icon */}
           <div className="text-indigo-500 dark:text-indigo-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            </div>
        </div>
     </div>
  );
}
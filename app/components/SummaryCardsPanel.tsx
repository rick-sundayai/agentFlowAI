// components/SummaryCardsPanel.tsx
'use client';

import { useChatContext } from '@/app/context/ChatContext';

// No props needed, data comes from context
export default function SummaryCardsPanel() {
  const { displayedSummaryData } = useChatContext();
  const summaryData = displayedSummaryData;

  return (
    // --- UI structure for the Summary Cards row ---
    // This component might be removed or repurposed if only TotalContactsPanel is needed
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"> {/* Responsive grid */}


      {/* Example Summary Card 2: Active Deals (Keep if needed here, or move to DealsPanel header) */}
       <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-5 border border-gray-200 dark:border-gray-700">
         <div className="flex items-center justify-between">
            <div>
               <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Active Deals</p>
               {/* Use data from context */}
               <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{summaryData.activeDeals}</p>
            </div>
             <div className="text-green-500 dark:text-green-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zM21 12c0 4.418-4.03 8-9 8a9.004 9.004 0 01-7.08-3.546M3 12c0-4.418 4.03-8 9-8s9 3.582 9 8" />
                  </svg>
              </div>
         </div>
      </div>

      {/* Add more summary cards here if needed in this horizontal row */}

    </div>
  );
}
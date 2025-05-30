// components/DealsPanel.tsx
'use client';
import { useChatContext } from '@/app/context/ChatContext';
// Define MockDeal interface (Keep here or import)
interface MockDeal {
  id: string; clientName: string; propertyAddress: string;
  type: string; status: string; closeDate?: string; commission?: number;
}

export default function DealsPanel() {
  const { displayedDeals } = useChatContext();
  const deals = displayedDeals;


  return (
     // --- Apply standard panel styling ---
     <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Deals</h3>

        {/* Deals List (uses context state) */}
        {/* Apply consistent list item styling */}
        <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">Active Deals ({deals.filter(d => d.status !== 'Closed').length})</h4>
        {deals.length > 0 ? (
             <div className="space-y-3 max-h-40 overflow-y-auto pr-2 text-sm">
                {deals
                 .filter(d => d.status !== 'Closed')
                 .map(deal => (
                    <div key={deal.id} className="text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700 pb-3 last:border-b-0 last:pb-0"> {/* Apply consistent list item padding/border */}
                        <p><strong>{deal.clientName}</strong> ({deal.type})</p>
                        <p>{deal.status} {deal.propertyAddress ? `on ${deal.propertyAddress}` : ''}</p>
                        {deal.closeDate && <p>Close Date: {deal.closeDate}</p>}
                        {deal.commission && <p>Commission: {(deal.commission * 100).toFixed(1)}%</p>}
                        {/* Add link/button to view details */}
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm italic"> {/* Apply consistent empty state padding */}
                <p>No deals data available.</p>
            </div>
        )}
     </div>
  );
}
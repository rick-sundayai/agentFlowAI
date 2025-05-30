// components/RecentContactsPanel.tsx
'use client';

import { useChatContext, RecentContact } from '@/app/context/ChatContext'; // Import useChatContext and RecentContact type

// No props needed, data comes from context
export default function RecentContactsPanel() {
  const { displayedRecentContacts } = useChatContext();
  const recentContacts = displayedRecentContacts;

  return (
    // --- UI structure for the Recent Contacts panel ---
     <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Recent Contacts</h3>

        {recentContacts.length > 0 ? (
             <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                {recentContacts.map(contact => (
                   <div key={contact.id} className="border-b border-gray-100 dark:border-gray-700 pb-4 text-sm">
                       <div className="flex items-center mb-2">
                           {/* Optional: Contact Initials/Avatar */}
                           <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 flex items-center justify-center font-medium text-sm mr-3">
                               {contact.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                           </div>
                           <div>
                               <h4 className="font-medium text-gray-900 dark:text-white">{contact.name}</h4>
                               {/* Optional: Status/Temperature badge */}
                               {contact.status && (
                                   <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                       contact.status === 'hot' ? 'bg-red-100 text-red-800' :
                                       contact.status === 'warm' ? 'bg-yellow-100 text-yellow-800' :
                                       contact.status === 'cold' ? 'bg-blue-100 text-blue-800' :
                                       'bg-gray-100 text-gray-800'
                                   }`}>
                                       {contact.status}
                                   </span>
                               )}
                           </div>
                       </div>
                       {/* Optional: Last Activity / Value */}
                       <div className="flex justify-between text-gray-600 dark:text-gray-400 text-xs">
                           {contact.lastActivity && <span>{contact.lastActivity}</span>}
                           {contact.value && <span>${contact.value.toLocaleString()}</span>}
                       </div>
                        {/* Add links/buttons for quick actions like Call/Email */}
                   </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm italic">
                <p>No recent contacts to display.</p>
            </div>
        )}
     </div>
  );
}
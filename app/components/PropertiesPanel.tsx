// components/PropertiesPanel.tsx
'use client';
import { useChatContext } from '@/app/context/ChatContext';
// Define MockProperty interface (Keep here or import)
interface MockProperty {
  id: string; address: string; city: string; state: string; zip: string;
  type: string; status: string; price: number;
}

export default function PropertiesPanel() {
  const { displayedProperties } = useChatContext();
  const properties = displayedProperties;


  return (
    // --- Apply standard panel styling ---
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 border border-gray-200 dark:border-gray-700">
       <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Properties</h3>
       <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">Active/Pending ({properties.filter(p => p.status === 'Active' || p.status === 'Pending').length})</h4>
       {properties.length > 0 ? (
           <div className="space-y-3 max-h-40 overflow-y-auto pr-2 text-sm">
               {properties
                .filter(p => p.status === 'Active' || p.status === 'Pending')
                .map(prop => (
                   <div key={prop.id} className="text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700 pb-3 last:border-b-0 last:pb-0"> {/* Apply consistent list item padding/border */}
                       <p><strong>{prop.address}, {prop.city}</strong></p>
                       <p>{prop.type} - {prop.status} - ${prop.price.toLocaleString()}</p>
                       {/* Add link/button to view details */}
                   </div>
               ))}
           </div>
       ) : (
           <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm italic"> {/* Apply consistent empty state padding */}
               <p>No properties data available.</p>
           </div>
       )}
    </div>
  );
}
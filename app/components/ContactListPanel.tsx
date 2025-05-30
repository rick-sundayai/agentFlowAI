// components/ContactListPanel.tsx
"use client";
import { useChatContext, ContactData } from "@/app/context/ChatContext";
import AddContactButton from "@/app/(authenticated)/dashboard/add-contact-button"; // Ensure correct path

export default function ContactListPanel() {
  const { displayedContacts, lastError } = useChatContext();
  const contacts = displayedContacts;
  // Basic error mapping from context
  const contactsError = lastError ? new Error(lastError) : null;


  return (
    // --- Apply standard panel styling ---
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 border border-gray-200 dark:border-gray-700">
       {/* Header */}
       <div className="flex justify-between items-center mb-6">
         {/* Use the count from the context state */}
         <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Your Contacts ({contacts.length})</h3>
         <AddContactButton />
       </div>

       {/* Error Message */}
       {contactsError && (
         <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-md mb-4 text-sm">
           {contactsError.message || 'Error loading contacts. Please try again.'}
         </div>
       )}

       {/* Display the contacts */}
       {contacts && contacts.length > 0 ? (
         // Content when contacts are found
         <div className="space-y-4 max-h-60 overflow-y-auto pr-2"> {/* Add max-height and scroll */}
           {contacts.map((contact: ContactData) => (
              // Display contacts in a consistent list item style
              // Use contact.id as key if available, otherwise a combination of fields or random
              <div key={contact.id || `${contact.name}-${contact.phone}-${contact.email}`} className="border-b border-gray-100 dark:border-gray-700 pb-2 text-sm last:border-b-0 last:pb-0"> {/* last:border-b-0 for last item */}
                   <h4 className="font-medium text-gray-900 dark:text-white">{contact.name}</h4>
                   {contact.phone && <p className="text-gray-600 dark:text-gray-300">{contact.phone}</p>}
                   {contact.email && <p className="text-gray-600 dark:text-gray-300">{contact.email}</p>}
                    {contact.property_address && <p className="text-gray-600 dark:text-gray-300">Prop: {contact.property_address}</p>}
                   {/* Optional: Add links/buttons for quick actions like Call/Email */}
              </div>
           ))}
         </div>
       ) : (
         // Content when no contacts are found
         <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
           </svg>
           <p>No contacts found.</p>
            <div className="mt-4">
              <AddContactButton />
            </div>
         </div>
       )}
    </div>
  );
}
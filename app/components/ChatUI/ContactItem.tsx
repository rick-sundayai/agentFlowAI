// app/components/ChatUI/ContactItem.tsx
'use client';

import { useState } from 'react';
import { ContactData } from '@/app/context/ChatContext';

interface ContactItemProps {
  contact: ContactData;
}

export default function ContactItem({ contact }: ContactItemProps) {
  const [copied, setCopied] = useState<string | null>(null);

  // Function to copy text to clipboard
  const copyToClipboard = (text: string, field: string) => {
    if (!text) return;
    
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(field);
        setTimeout(() => setCopied(null), 2000); // Reset after 2 seconds
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  return (
    <li className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors" 
        key={contact.id || contact.name}>
      <div className="flex flex-col">
        {/* Contact name with copy button */}
        <div className="flex justify-between items-center">
          <strong className="font-medium">{contact.name}</strong>
          <button 
            onClick={() => copyToClipboard(contact.name, 'name')}
            className="text-xs text-gray-500 hover:text-indigo-500 dark:text-gray-400 dark:hover:text-indigo-400 p-1"
            aria-label={`Copy ${contact.name}'s name`}
            title="Copy name"
          >
            {copied === 'name' ? (
              <span className="text-green-500">✓ Copied</span>
            ) : (
              <span>Copy</span>
            )}
          </button>
        </div>
        
        {/* Contact details with copy buttons */}
        {contact.email && (
          <div className="flex justify-between items-center text-sm mt-1">
            <span className="truncate">{contact.email}</span>
            <button 
              onClick={() => copyToClipboard(contact.email || '', 'email')}
              className="text-xs text-gray-500 hover:text-indigo-500 dark:text-gray-400 dark:hover:text-indigo-400 p-1 ml-2"
              aria-label={`Copy ${contact.name}'s email`}
              title="Copy email"
            >
              {copied === 'email' ? (
                <span className="text-green-500">✓ Copied</span>
              ) : (
                <span>Copy</span>
              )}
            </button>
          </div>
        )}
        
        {contact.phone && (
          <div className="flex justify-between items-center text-sm mt-1">
            <span>{contact.phone}</span>
            <button 
              onClick={() => copyToClipboard(contact.phone || '', 'phone')}
              className="text-xs text-gray-500 hover:text-indigo-500 dark:text-gray-400 dark:hover:text-indigo-400 p-1 ml-2"
              aria-label={`Copy ${contact.name}'s phone number`}
              title="Copy phone"
            >
              {copied === 'phone' ? (
                <span className="text-green-500">✓ Copied</span>
              ) : (
                <span>Copy</span>
              )}
            </button>
          </div>
        )}
        
        {contact.property_address && (
          <div className="flex justify-between items-center text-sm mt-1">
            <span className="truncate">{contact.property_address}</span>
            <button 
              onClick={() => copyToClipboard(contact.property_address || '', 'address')}
              className="text-xs text-gray-500 hover:text-indigo-500 dark:text-gray-400 dark:hover:text-indigo-400 p-1 ml-2"
              aria-label={`Copy ${contact.name}'s address`}
              title="Copy address"
            >
              {copied === 'address' ? (
                <span className="text-green-500">✓ Copied</span>
              ) : (
                <span>Copy</span>
              )}
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

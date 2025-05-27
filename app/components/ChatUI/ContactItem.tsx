// components/ChatUI/ContactItem.tsx
'use client';

import { ContactData } from '@/app/context/ChatContext'; // Import the type

interface ContactItemProps {
  contact: ContactData;
}

export default function ContactItem({ contact }: ContactItemProps) {
  return (
    <li className="border-b border-gray-200 dark:border-gray-600 pb-1 last:border-b-0 last:pb-0">
      <p className="font-semibold text-gray-900 dark:text-white">{contact.name}</p>
      {contact.phone && <p className="text-xs text-gray-600 dark:text-gray-400">Phone: {contact.phone}</p>}
      {contact.email && <p className="text-xs text-gray-600 dark:text-gray-400">Email: {contact.email}</p>}
      {contact.property_address && <p className="text-xs text-gray-600 dark:text-gray-400">Property: {contact.property_address}</p>}
      {/* Add other relevant contact details here */}
    </li>
  );
}

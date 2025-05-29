// components/ContactListPanel.tsx
"use client";
import { useChatContext, ContactData } from "@/app/context/ChatContext";
import AddContactButton from "@/app/(authenticated)/dashboard/add-contact-button";
// No props interface needed

export default function ContactListPanel() {
  // Removed props
  const { displayedContacts } = useChatContext();
  const contacts = displayedContacts;

  return (
    <div className="contact-list-panel">
      Contacts: {contacts.length}
      <AddContactButton />
    </div>
  );
}

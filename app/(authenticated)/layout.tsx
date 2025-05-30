// app/(authenticated)/layout.tsx
import { ReactNode } from 'react';
import { ChatProvider } from '../context/ChatContext';
import { ChatMessage, ContactData } from '../context/ChatContext';
import { User } from '@supabase/supabase-js'; // Import User type
interface MockProperty { id: string; address: string; city: string; state: string; zip: string; type: string; status: string; price: number; }
interface MockDeal { id: string; clientName: string; propertyAddress: string; type: string; status: string; closeDate?: string; commission?: number; }
interface SummaryData { totalContacts: number; activeDeals: number; }
interface RecentContact { id: string; name: string; status?: string; lastActivity?: string; value?: number; }


import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

interface DbChatMessage {
    id: string;
    user_id: string;
    sender: 'user' | 'ai';
    text: string | null;
    type: string;
    data: any | null;
    created_at: string;
}


interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export default async function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
   const supabase = await createClient();
   const { data: { user } = {} } = await supabase.auth.getUser();

   // If no user, redirect to login (Protects all routes in this group)
   if (!user) {
     redirect('/login');
   }

   // Fetch Initial Data (remains the same)
   const { data: chatMessagesData, error: messagesError } = await supabase.from('chat_messages').select('id, sender, text, type, data, created_at').eq('user_id', user.id).order('created_at', { ascending: true });
   if (messagesError) { console.error('Error fetching chat messages in layout:', messagesError); }
   const initialMessages: ChatMessage[] = chatMessagesData ? chatMessagesData.map((msg: DbChatMessage) => ({
     id: msg.id,
     sender: msg.sender,
     text: msg.text || '',
     type: msg.type || 'text',
     data: msg.data,
     timestamp: new Date(msg.created_at).getTime(),
     isError: msg.type === 'error',
     isRetryable: msg.type === 'error'
   })) : [];

   const { data: contacts, error: contactsError } = await supabase.from('contacts').select('id, user_id, name, phone, email, property_address').order('name');
   if (contactsError) { console.error('Error fetching contacts in layout:', contactsError); }
   const initialContacts: ContactData[] = contacts || [];

   const initialProperties: MockProperty[] = [ /* ... mock data ... */ ];
   const initialDeals: MockDeal[] = [ /* ... mock data ... */ ];

   const initialSummaryData: SummaryData = { totalContacts: initialContacts.length, activeDeals: initialDeals.filter(d => d.status !== 'Closed').length, };
   const initialRecentContacts: RecentContact[] = initialContacts.slice(0, 5).map(contact => ({
     id: contact.id || `contact-${contact.name}`,
     name: contact.name,
     status: 'active',
     lastActivity: '2 hours ago',
     value: Math.floor(Math.random() * 100000)
   }));


  return (
    // Wrap the content (children pages like dashboard/page.tsx) in the ChatProvider
    <ChatProvider
        initialUser={user} // --- Pass the fetched user object ---
        initialMessages={initialMessages}
        initialContacts={initialContacts}
        initialProperties={initialProperties}
        initialDeals={initialDeals}
        initialSummaryData={initialSummaryData}
        initialRecentContacts={initialRecentContacts}
    >
        {children}
    </ChatProvider>
  );
}
// app/(authenticated)/layout.tsx
import { ReactNode } from 'react';
// Import the ChatProvider
import { ChatProvider } from '../context/ChatContext'; // Path from app/ to context/
// Import types needed for initial data props (Define/Import from shared types if preferred)
import { ChatMessage, ContactData } from '../context/ChatContext'; // Assuming types are here or imported
// Define MockProperty and MockDeal interfaces here if not imported from ChatContext or a shared types file
interface MockProperty { id: string; address: string; city: string; state: string; zip: string; type: string; status: string; price: number; }
interface MockDeal { id: string; clientName: string; propertyAddress: string; type: string; status: string; closeDate?: string; commission?: number; }


// Import server-side client to fetch initial data in the layout
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

// Define a simplified type for fetching chat messages from the DB
interface DbChatMessage {
    id: string; user_id: string; sender: 'user' | 'ai'; text: string | null;
    type: string; data: any | null; created_at: string;
}


interface AuthenticatedLayoutProps {
  children: ReactNode; // This will be the page components (like dashboard/page.tsx)
}

export default async function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
   // Fetch initial data here once for the whole layout
   const supabase = await createClient(); // Use the correct server client

   const { data: { user } = {} } = await supabase.auth.getUser();

   // If no user, redirect to login (Protects all routes in this group)
   if (!user) {
     redirect('/login');
   }

   // Fetch Chat History
   const { data: chatMessagesData, error: messagesError } = await supabase
     .from('chat_messages')
     .select('id, sender, text, type, data, created_at')
     .eq('user_id', user.id)
     .order('created_at', { ascending: true });

   if (messagesError) {
     console.error('Error fetching chat messages in layout:', messagesError);
     // Decide how to handle error (e.g., pass null messages, show error state)
   }

   const initialMessages: ChatMessage[] = chatMessagesData ? chatMessagesData.map((msg: DbChatMessage) => ({
       id: msg.id, sender: msg.sender, text: msg.text || '', type: msg.type || 'text',
       data: msg.data, timestamp: new Date(msg.created_at).getTime(),
       isError: msg.type === 'error', isRetryable: msg.type === 'error'
   })) : [];


   // Fetch Contacts for the logged-in user
   const { data: contacts, error: contactsError } = await supabase
     .from('contacts')
     .select('id, user_id, name, phone, email, property_address') // Keep user_id in select for RLS check logic if needed downstream
     .order('name');

   if (contactsError) {
     console.error('Error fetching contacts in layout:', contactsError);
   }
    const initialContacts: ContactData[] = contacts || []; // Default to empty array on error


   // Define Mock Data for Properties and Deals (or fetch if they were real)
    const initialProperties: MockProperty[] = [
        { id: 'prop1', address: '123 Main St', city: 'Anytown', state: 'CA', zip: '91234', type: 'House', status: 'Active', price: 550000 },
        { id: 'prop2', address: '456 Oak Ave', city: 'Somewhere', state: 'NY', zip: '10001', type: 'Condo', status: 'Pending', price: 320000 },
        { id: 'prop3', address: '789 Pine Ln', city: 'Anywhere', state: 'TX', zip: '75001', type: 'House', status: 'Sold', price: 410000 },
    ];

    const initialDeals: MockDeal[] = [
        { id: 'deal1', clientName: 'Alice Smith', propertyAddress: '123 Main St', type: 'Buyer', status: 'Negotiation', closeDate: '2025-06-30', commission: 0.025 },
        { id: 'deal2', clientName: 'Bob Johnson', propertyAddress: '456 Oak Ave', type: 'Seller', status: 'Showing', closeDate: undefined, commission: undefined },
        { id: 'deal3', clientName: 'Charlie Brown', propertyAddress: '789 Pine Ln', type: 'Buyer', status: 'Closed', closeDate: '2025-05-15', commission: 0.03 },
    ];


  return (
    // Wrap the content (children pages like dashboard/page.tsx) in the ChatProvider
    // This makes ChatProvider an ancestor of all components rendered within this layout
    <ChatProvider
        userId={user.id} // Pass user ID
        initialMessages={initialMessages} // Pass fetched messages
        initialContacts={initialContacts} // Pass fetched/mocked contacts
        initialProperties={initialProperties} // Pass mocked properties
        initialDeals={initialDeals} // Pass mocked deals
    >
        {/* Render the children pages (like dashboard/page.tsx) which will contain the panels */}
        {children}
    </ChatProvider>
  );
}

// Define MockProperty and MockDeal interfaces here if they are not defined
// and exported from your ChatContext or a shared types file.
// interface MockProperty { id: string; address: string; city: string; state: string; zip: string; type: string; status: string; price: number; }
// interface MockDeal { id: string; clientName: string; propertyAddress: string; type: string; status: string; closeDate?: string; commission?: number; }
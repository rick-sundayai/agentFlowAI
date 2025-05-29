// components/DealsPanel.tsx
'use client';
import { useChatContext } from '@/app/context/ChatContext';


export default function DealsPanel() { // Removed props
  const { displayedDeals } = useChatContext();
  const deals = displayedDeals;

  return ( <div className="deals-panel" >Deals: {deals.length}</div> );
}
// components/PropertiesPanel.tsx
'use client';
import { useChatContext } from '@/app/context/ChatContext';

export default function PropertiesPanel() { // Removed props
  const { displayedProperties } = useChatContext();
  const properties = displayedProperties;

  return (
    <div className="properties-panel" >Properties: {properties.length}</div>
  );
}
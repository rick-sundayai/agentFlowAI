"use client";

import { useState } from 'react';
import AddContactModal from './add-contact-modal';

export default function AddContactButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const handleContactAdded = () => {
    // This will trigger a refresh of the contacts list
    window.location.reload();
  };

  return (
    <>
      <button
        onClick={openModal}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors duration-200"
      >
        Add Contact
      </button>
      
      <AddContactModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        onContactAdded={handleContactAdded} 
      />
    </>
  );
}

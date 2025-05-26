import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MessageBubble from '../../../components/ChatUI/MessageBubble';
import { ChatMessage } from '../../../context/ChatContext';

// Mock the ContactItem component
jest.mock('../../../components/ChatUI/ContactItem', () => {
  return function MockContactItem({ contact }: { contact: any }) {
    return <div data-testid="contact-item">{contact.name}</div>;
  };
});

describe('MessageBubble', () => {
  const mockUserMessage: ChatMessage = {
    id: 1,
    text: 'Hello AI',
    sender: 'user',
    timestamp: Date.now()
  };

  const mockAIMessage: ChatMessage = {
    id: 2,
    text: 'Hello User',
    sender: 'ai',
    timestamp: Date.now()
  };

  const mockErrorMessage: ChatMessage = {
    id: 3,
    text: 'Sorry, I encountered an error',
    sender: 'ai',
    dataType: 'error',
    isRetryable: true,
    timestamp: Date.now()
  };

  const mockContactsMessage: ChatMessage = {
    id: 4,
    text: 'Here are your contacts',
    sender: 'ai',
    dataType: 'contacts_list',
    data: [
      { id: '1', name: 'John Doe', phone: '123-456-7890', email: 'john@example.com', property_address: '123 Main St' },
      { id: '2', name: 'Jane Smith', phone: '987-654-3210', email: 'jane@example.com', property_address: '456 Oak Ave' }
    ],
    timestamp: Date.now()
  };

  it('renders a user message correctly', () => {
    render(<MessageBubble message={mockUserMessage} />);
    
    expect(screen.getByText('Hello AI')).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveClass('justify-end');
  });

  it('renders an AI message correctly', () => {
    render(<MessageBubble message={mockAIMessage} />);
    
    expect(screen.getByText('Hello User')).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveClass('justify-start');
  });

  it('renders an error message with retry button', () => {
    const mockRetry = jest.fn().mockResolvedValue(undefined);
    render(<MessageBubble message={mockErrorMessage} onRetry={mockRetry} />);
    
    expect(screen.getByText('Sorry, I encountered an error')).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveClass('justify-start');
    
    // Check that the retry button is rendered
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
    
    // Click the retry button
    fireEvent.click(retryButton);
    
    // Check that the retry function was called with the correct message ID
    expect(mockRetry).toHaveBeenCalledWith(3);
  });

  it('disables the retry button while retrying', async () => {
    // Create a mock retry function that takes some time to resolve
    const mockRetry = jest.fn().mockImplementation(() => new Promise(resolve => {
      setTimeout(resolve, 100);
    }));
    
    render(<MessageBubble message={mockErrorMessage} onRetry={mockRetry} />);
    
    // Get the retry button
    const retryButton = screen.getByRole('button', { name: /retry/i });
    
    // Click the retry button
    fireEvent.click(retryButton);
    
    // Check that the button text changes to 'Retrying...'
    expect(screen.getByText('Retrying...')).toBeInTheDocument();
    
    // Check that the button is disabled
    expect(retryButton).toBeDisabled();
    
    // Wait for the retry function to resolve
    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
      expect(retryButton).not.toBeDisabled();
    });
  });

  it('renders contacts list correctly', () => {
    render(<MessageBubble message={mockContactsMessage} />);
    
    expect(screen.getByText('Here are your contacts')).toBeInTheDocument();
    
    // Check that the contacts are rendered
    const contactItems = screen.getAllByTestId('contact-item');
    expect(contactItems).toHaveLength(2);
    expect(contactItems[0]).toHaveTextContent('John Doe');
    expect(contactItems[1]).toHaveTextContent('Jane Smith');
  });

  it('renders empty contacts list with appropriate message', () => {
    const emptyContactsMessage = {
      ...mockContactsMessage,
      data: []
    };
    
    render(<MessageBubble message={emptyContactsMessage} />);
    
    expect(screen.getByText('Here are your contacts')).toBeInTheDocument();
    expect(screen.getByText('No contacts found matching criteria.')).toBeInTheDocument();
  });

  it('renders timestamp correctly', () => {
    // Create a message with a specific timestamp
    const date = new Date(2023, 0, 1, 14, 30); // January 1, 2023, 2:30 PM
    const messageWithTimestamp = {
      ...mockAIMessage,
      timestamp: date.getTime()
    };
    
    render(<MessageBubble message={messageWithTimestamp} />);
    
    // Format the expected time string based on the locale
    const expectedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Check that the timestamp is rendered
    expect(screen.getByText(expectedTime)).toBeInTheDocument();
  });
});

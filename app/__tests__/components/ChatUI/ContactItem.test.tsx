import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContactItem from '../../../components/ChatUI/ContactItem';
import { ContactData } from '../../../context/ChatContext';

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockImplementation(() => Promise.resolve()),
  },
  configurable: true,
});

describe('ContactItem', () => {
  // Mock console.error to prevent test output noise
  const originalConsoleError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  
  afterAll(() => {
    console.error = originalConsoleError;
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const mockContact: ContactData = {
    id: '123',
    name: 'John Doe',
    phone: '555-123-4567',
    email: 'john@example.com',
    property_address: '123 Main St, City, State 12345'
  };

  it('renders contact information correctly', () => {
    render(<ContactItem contact={mockContact} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('555-123-4567')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('123 Main St, City, State 12345')).toBeInTheDocument();
  });

  it('renders contact with missing fields correctly', () => {
    const partialContact: ContactData = {
      id: '456',
      name: 'Jane Smith',
      phone: null,
      email: 'jane@example.com',
      property_address: null
    };
    
    render(<ContactItem contact={partialContact} />);
    
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.queryByText('null')).not.toBeInTheDocument(); // Make sure null values aren't displayed
    
    // Check that phone and address sections aren't rendered
    const copyPhoneButton = screen.queryByTitle('Copy phone');
    const copyAddressButton = screen.queryByTitle('Copy address');
    expect(copyPhoneButton).not.toBeInTheDocument();
    expect(copyAddressButton).not.toBeInTheDocument();
  });

  it('copies name to clipboard when copy button is clicked', async () => {
    render(<ContactItem contact={mockContact} />);
    
    // Find the copy button for name
    const copyNameButton = screen.getAllByText('Copy')[0];
    
    // Click the copy button
    fireEvent.click(copyNameButton);
    
    // Check that clipboard.writeText was called with the correct text
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('John Doe');
    
    // Check that the button text changes to "✓ Copied"
    // Use waitFor to handle the async state update
    await waitFor(() => {
      expect(screen.getByText('✓ Copied')).toBeInTheDocument();
    });
    
    // Fast-forward timers to simulate the 2-second timeout
    jest.advanceTimersByTime(2000);
    
    // Check that the button text changes back to "Copy"
    await waitFor(() => {
      expect(screen.queryByText('✓ Copied')).not.toBeInTheDocument();
      expect(screen.getAllByText('Copy').length).toBe(4); // All buttons should say "Copy"
    });
  });

  it('copies email to clipboard when copy button is clicked', async () => {
    render(<ContactItem contact={mockContact} />);
    
    // Find the copy button for email
    const copyEmailButton = screen.getAllByTitle('Copy email')[0];
    
    // Click the copy button
    fireEvent.click(copyEmailButton);
    
    // Check that clipboard.writeText was called with the correct text
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('john@example.com');
    
    // Check that the button text changes to "✓ Copied" - use waitFor for async state update
    await waitFor(() => {
      expect(screen.getByText('✓ Copied')).toBeInTheDocument();
    });
  });

  it('copies phone to clipboard when copy button is clicked', async () => {
    render(<ContactItem contact={mockContact} />);
    
    // Find the copy button for phone
    const copyPhoneButton = screen.getAllByTitle('Copy phone')[0];
    
    // Click the copy button
    fireEvent.click(copyPhoneButton);
    
    // Check that clipboard.writeText was called with the correct text
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('555-123-4567');
    
    // Check that the button text changes to "✓ Copied" - use waitFor for async state update
    await waitFor(() => {
      expect(screen.getByText('✓ Copied')).toBeInTheDocument();
    });
  });

  it('copies address to clipboard when copy button is clicked', async () => {
    render(<ContactItem contact={mockContact} />);
    
    // Find the copy button for address
    const copyAddressButton = screen.getAllByTitle('Copy address')[0];
    
    // Click the copy button
    fireEvent.click(copyAddressButton);
    
    // Check that clipboard.writeText was called with the correct text
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('123 Main St, City, State 12345');
    
    // Check that the button text changes to "✓ Copied" - use waitFor for async state update
    await waitFor(() => {
      expect(screen.getByText('✓ Copied')).toBeInTheDocument();
    });
  });

  it('handles clipboard API errors gracefully', async () => {
    // Mock console.error implementation to actually call the mock
    console.error = jest.fn();
    
    // Mock clipboard.writeText to reject
    (navigator.clipboard.writeText as jest.Mock).mockImplementationOnce(() => 
      Promise.reject(new Error('Clipboard API failed'))
    );
    
    render(<ContactItem contact={mockContact} />);
    
    // Find the copy button for name
    const copyNameButton = screen.getAllByText('Copy')[0];
    
    // Click the copy button
    fireEvent.click(copyNameButton);
    
    // Wait for the promise rejection to be handled
    await waitFor(() => {
      // Check that console.error was called
      expect(console.error).toHaveBeenCalled();
    });
    
    // Check that the button text doesn't change to "✓ Copied"
    expect(screen.queryByText('✓ Copied')).not.toBeInTheDocument();
  });
});

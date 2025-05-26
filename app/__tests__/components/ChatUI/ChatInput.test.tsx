import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatInput from '../../../components/ChatUI/ChatInput';

describe('ChatInput', () => {
  const mockSendMessage = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default placeholder', () => {
    render(<ChatInput onSendMessage={mockSendMessage} isProcessing={false} />);
    
    const input = screen.getByRole('textbox', { name: 'Type your message' });
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Type your command...');
  });

  it('renders with custom placeholder', () => {
    render(
      <ChatInput 
        onSendMessage={mockSendMessage} 
        isProcessing={false} 
        placeholder="Ask something..."
      />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'Ask something...');
  });

  it('changes placeholder when processing', () => {
    render(<ChatInput onSendMessage={mockSendMessage} isProcessing={true} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'Co-Pilot is thinking...');
    expect(input).toBeDisabled();
  });

  it('updates input value when typing', () => {
    render(<ChatInput onSendMessage={mockSendMessage} isProcessing={false} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Hello AI' } });
    
    expect(input).toHaveValue('Hello AI');
  });

  it('shows clear button when input has text', () => {
    render(<ChatInput onSendMessage={mockSendMessage} isProcessing={false} />);
    
    const input = screen.getByRole('textbox');
    
    // Initially, clear button should not be visible
    const clearButtonBefore = screen.queryByRole('button', { name: 'Clear input' });
    expect(clearButtonBefore).not.toBeInTheDocument();
    
    // Type something
    fireEvent.change(input, { target: { value: 'Hello AI' } });
    
    // Now clear button should be visible
    const clearButtonAfter = screen.getByRole('button', { name: 'Clear input' });
    expect(clearButtonAfter).toBeInTheDocument();
    
    // Click clear button
    fireEvent.click(clearButtonAfter);
    
    // Input should be cleared
    expect(input).toHaveValue('');
    
    // Clear button should be hidden again
    expect(screen.queryByRole('button', { name: 'Clear input' })).not.toBeInTheDocument();
  });

  it('disables send button when input is empty', () => {
    render(<ChatInput onSendMessage={mockSendMessage} isProcessing={false} />);
    
    const sendButton = screen.getByRole('button', { name: 'Send message' });
    expect(sendButton).toBeDisabled();
    
    // Type something
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Hello AI' } });
    
    // Send button should be enabled
    expect(sendButton).not.toBeDisabled();
  });

  it('disables send button when processing', () => {
    render(<ChatInput onSendMessage={mockSendMessage} isProcessing={true} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Hello AI' } });
    
    const sendButton = screen.getByRole('button', { name: 'Send message' });
    expect(sendButton).toBeDisabled();
  });

  it('calls onSendMessage when form is submitted', async () => {
    render(<ChatInput onSendMessage={mockSendMessage} isProcessing={false} />);
    
    const input = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: 'Send message' });
    
    // Type something
    fireEvent.change(input, { target: { value: 'Hello AI' } });
    
    // Submit the form
    fireEvent.click(sendButton);
    
    // Check that onSendMessage was called with the input value
    expect(mockSendMessage).toHaveBeenCalledWith('Hello AI');
    
    // Input should be cleared
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('calls onSendMessage when Enter key is pressed', async () => {
    render(<ChatInput onSendMessage={mockSendMessage} isProcessing={false} />);
    
    const input = screen.getByRole('textbox');
    
    // Type something
    fireEvent.change(input, { target: { value: 'Hello AI' } });
    
    // Press Enter
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    
    // Check that onSendMessage was called with the input value
    expect(mockSendMessage).toHaveBeenCalledWith('Hello AI');
    
    // Input should be cleared
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('does not call onSendMessage when Enter is pressed during processing', () => {
    render(<ChatInput onSendMessage={mockSendMessage} isProcessing={true} />);
    
    const input = screen.getByRole('textbox');
    
    // Type something (this won't actually work since the input is disabled, but we'll do it for the test)
    fireEvent.change(input, { target: { value: 'Hello AI' } });
    
    // Press Enter
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    
    // onSendMessage should not be called
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('does not call onSendMessage when input is empty', () => {
    render(<ChatInput onSendMessage={mockSendMessage} isProcessing={false} />);
    
    const input = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: 'Send message' });
    
    // Submit with empty input
    fireEvent.click(sendButton);
    
    // onSendMessage should not be called
    expect(mockSendMessage).not.toHaveBeenCalled();
  });
});

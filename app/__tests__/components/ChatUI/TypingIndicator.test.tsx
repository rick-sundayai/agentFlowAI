import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TypingIndicator from '../../../components/ChatUI/TypingIndicator';

describe('TypingIndicator', () => {
  it('renders correctly with proper accessibility attributes', () => {
    render(<TypingIndicator />);
    
    // Check that the component is rendered with the correct role and aria-label
    const indicator = screen.getByRole('status');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveAttribute('aria-label', 'AI is typing');
    
    // Check that the animation dots are rendered
    // Look for elements with the animate-pulse class
    const animationContainer = screen.getByRole('status');
    const dots = animationContainer.querySelectorAll('.animate-pulse');
    expect(dots.length).toBe(3);
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CreateEvent from '../pages/CreateEvent';
import { expect, test, vi } from 'vitest';

test('shows error message when Title is empty', () => {
  const mockSave = vi.fn(); 
  
  render(
    <BrowserRouter>
      <CreateEvent saveEvent={mockSave} />
    </BrowserRouter>
  );
  const submitBtn = screen.getByText(/Add event/i);
  fireEvent.click(submitBtn);
  expect(screen.getByText(/Title is required/i)).toBeDefined();
  expect(mockSave).not.toHaveBeenCalled();
});
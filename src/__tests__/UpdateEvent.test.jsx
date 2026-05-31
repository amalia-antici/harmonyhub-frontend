import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CreateEvent from '../pages/CreateEvent';
import { expect, test, vi } from 'vitest';

test('calls saveEvent with updated data when editing', () => {
  const mockSave = vi.fn();
  const existingEvent = { 
    id: 123, 
    title: "Old Title", 
    city: "Cluj", 
    dateTime: "2026-03-12T18:00" 
  };

  render(
    <MemoryRouter initialEntries={[{ pathname: '/create', state: { eventData: existingEvent } }]}>
      <Routes>
        <Route path="/create" element={<CreateEvent saveEvent={mockSave} />} />
      </Routes>
    </MemoryRouter>
  );

  const titleInput = screen.getByDisplayValue("Old Title");
  fireEvent.change(titleInput, { target: { value: "New Amazing Title" } });
  const updateBtn = screen.getByText(/Update event/i);
  fireEvent.click(updateBtn);
  expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({
    id: 123,
    title: "New Amazing Title"
  }));
});
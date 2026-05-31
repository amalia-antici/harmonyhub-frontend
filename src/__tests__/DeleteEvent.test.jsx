import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CreateEvent from '../pages/CreateEvent';
import { expect, test, vi } from 'vitest';

test('calls deleteEvent and redirects when Delete is clicked', () => {
  const mockDelete = vi.fn();
  const eventToDelete = { id: 999, title: "Delete Me", city: "Iasi", dateTime: "2026-05-01T10:00" };

  render(
    <MemoryRouter initialEntries={[{ pathname: '/create', state: { eventData: eventToDelete } }]}>
      <Routes>
        <Route path="/create" element={<CreateEvent deleteEvent={mockDelete} />} />
      </Routes>
    </MemoryRouter>
  );

  const deleteBtn = screen.getByText(/Delete/i);
  fireEvent.click(deleteBtn);
  expect(mockDelete).toHaveBeenCalledWith(999);
});
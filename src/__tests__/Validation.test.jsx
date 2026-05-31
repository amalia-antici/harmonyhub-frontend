import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CreateEvent from '../pages/CreateEvent';
import { expect, test } from 'vitest';

test('prevents submission and shows red errors if required fields are missing', () => {
  render(
    <BrowserRouter>
      <CreateEvent saveEvent={() => {}} />
    </BrowserRouter>
  );

  const submitBtn = screen.getByText(/Add event/i);
  fireEvent.click(submitBtn);
  expect(screen.getByText(/Title is required/i)).toBeInTheDocument();
  expect(screen.getByText(/City is required/i)).toBeInTheDocument();
  expect(screen.getByText(/Date and time is required/i)).toBeInTheDocument();
});

test('validates that formLink starts with http', async()=>{
  render(
    <BrowserRouter>
      <CreateEvent saveEvent={() => {}} />
    </BrowserRouter>
  );

  const linkInput = screen.getByRole('textbox', {name: /Form link:/i});
  fireEvent.change(linkInput, { target: { value: 'www.badlink.com' } });

  fireEvent.click(screen.getByText(/Add event/i));
  const errorMsg=await screen.findByText(/Link must start with http\/https/i);
  expect(errorMsg).toBeInTheDocument();
});
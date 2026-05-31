import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import Login from '../pages/Login';
import Register from '../pages/Register';

const originalFetch = global.fetch;

describe('Authentication UI', () => {
  afterEach(() => {
    global.fetch = originalFetch;
    window.localStorage.clear();
  });

  it('renders login fields and calls backend on submit', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ token: 'test', username: 'user', roles: ['ROLE_USER'], id: 1 }) }));

    render(<Login />);
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'user' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', expect.any(Object));
    expect(window.localStorage.getItem('harmonyhub-token')).toBe('test');
  });

  it('renders register fields and displays error when registration fails', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: false, text: () => Promise.resolve('Username already taken') }));

    render(<Register />);
    fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: 'User' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'user' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'pass1234' } });
    fireEvent.click(screen.getByRole('button', { name: /Join us/i }));

    expect(await screen.findByText(/Username already taken/i)).toBeVisible();
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', expect.any(Object));
  });
});

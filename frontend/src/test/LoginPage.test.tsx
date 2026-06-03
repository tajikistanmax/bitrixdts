import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';

// Mock auth service (named export)
vi.mock('../services/auth.service', () => ({
  authService: {
    login: vi.fn(),
  },
}));

// Mock zustand store — handle selector pattern used by LoginPage
const mockSetAuth = vi.fn();
vi.mock('../store/auth.store', () => ({
  useAuthStore: vi.fn((selector: any) => {
    const state = {
      user: null,
      tokens: null,
      isAuthenticated: false,
      setAuth: mockSetAuth,
      logout: vi.fn(),
      updateUser: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form heading', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/войдите в систему/i)).toBeInTheDocument();
  });

  it('has email and password fields', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Пароль')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
  });
});

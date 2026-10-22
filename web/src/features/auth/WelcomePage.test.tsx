import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from './authContext';
import { WelcomePage } from './WelcomePage';

function renderWelcome(overrides: Partial<AuthContextValue> = {}) {
  const auth: AuthContextValue = {
    session: null,
    user: null,
    isGuest: false,
    hasEntered: false,
    isLoading: false,
    continueAsGuest: vi.fn(),
    sendEmailCode: vi.fn(),
    verifyEmailCode: vi.fn(),
    signOut: vi.fn(),
    ...overrides,
  };
  render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter>
        <WelcomePage />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
  return auth;
}

describe('WelcomePage', () => {
  it('walks through the story to the sign-up choices', async () => {
    renderWelcome();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Skip the guesswork');
    expect(screen.queryByRole('link', { name: 'Get started' })).not.toBeInTheDocument();

    const next = screen.getByRole('button', { name: 'Next' });
    await userEvent.click(next);
    await userEvent.click(next);
    await userEvent.click(next);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('recipe changes');
    expect(screen.getByRole('link', { name: 'Get started' })).toHaveAttribute('href', '/sign-up');
  });

  it('lets students skip straight to the end and continue as a guest', async () => {
    const auth = renderWelcome();
    await userEvent.click(screen.getByRole('button', { name: 'Skip intro' }));
    await userEvent.click(screen.getByRole('button', { name: 'Continue without an account' }));
    expect(auth.continueAsGuest).toHaveBeenCalledOnce();
  });

  it('keeps sign in available on every slide', () => {
    renderWelcome();
    expect(screen.getAllByRole('link', { name: 'Sign in' })[0]).toHaveAttribute('href', '/sign-in');
  });
});

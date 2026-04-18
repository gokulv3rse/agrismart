import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/lib/supabaseClient', () => {
  return {
    supabase: {
      auth: {
        signInWithPassword: vi.fn(async () => ({ error: null })),
        signUp: vi.fn(async () => ({ error: null })),
        resend: vi.fn(async () => ({ error: null })),
      },
    },
  }
})

import Auth from './Auth'

describe('Auth', () => {
  it('renders sign in and sign up modes', () => {
    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>,
    )

    expect(screen.getAllByText('Sign in').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Sign up').length).toBeGreaterThan(0)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })
})

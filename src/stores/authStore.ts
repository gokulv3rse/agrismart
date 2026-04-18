import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

type AuthState = {
  initialized: boolean
  session: Session | null
  user: User | null
  init: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  initialized: false,
  session: null,
  user: null,
  init: async () => {
    const { data } = await supabase.auth.getSession()
    set({
      initialized: true,
      session: data.session,
      user: data.session?.user ?? null,
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null })
    })
  },
  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null })
  },
}))

import { create } from 'zustand'
import type { UserProfile, TasabanInfo } from '../types/auth'

interface AuthState {
  user: UserProfile | null
  tasaban: TasabanInfo | null
  isLoggedIn: boolean
  setUser: (user: UserProfile | null) => void
  setTasaban: (info: TasabanInfo) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tasaban: null,
  isLoggedIn: false,
  setUser: (user) => set({ user, isLoggedIn: user !== null }),
  setTasaban: (tasaban) => set({ tasaban }),
  logout: () => set({ user: null, isLoggedIn: false }),
}))

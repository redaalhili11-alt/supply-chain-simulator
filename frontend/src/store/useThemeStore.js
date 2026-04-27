import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'light',
      toggleTheme: () =>
        set((state) => {
          const next = state.theme === 'light' ? 'dark' : 'light'
          document.documentElement.classList.toggle('dark', next === 'dark')
          return { theme: next }
        }),
      initTheme: () =>
        set((state) => {
          document.documentElement.classList.toggle('dark', state.theme === 'dark')
          return state
        }),
    }),
    { name: 'sc-theme' }
  )
)

import { createContext, useContext, useState, useEffect } from 'react'
import { useSimStore } from '../store/useSimStore'
import { syncStateDown } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token')
      const savedUser  = localStorage.getItem('user')
      if (savedToken && savedUser) {
        setUser(JSON.parse(savedUser))
        await syncStateDown()
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  const login = async (token, userData) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    useSimStore.getState().reset()
    await syncStateDown()
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    useSimStore.getState().reset()
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

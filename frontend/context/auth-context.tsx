"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { authService, User } from "@/lib/api"

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, fullName?: string, phoneNumber?: string) => Promise<any>
  logout: () => void
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token')
    }
    return null
  }

  const setAuthToken = (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token)
    }
  }

  const removeAuthToken = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
    }
  }

  const checkAuth = async () => {
    const token = getAuthToken()
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      // Token is invalid, remove it
      removeAuthToken()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password })
      setAuthToken(response.access_token)
      setUser(response.user)
    } catch (error) {
      throw error
    }
  }

  const signup = async (email: string, password: string, fullName?: string, phoneNumber?: string) => {
    try {
      const response = await authService.signup({ 
        email, 
        password, 
        full_name: fullName,
        phone_number: phoneNumber
      })
      // Only set token and user if we have a session (email confirmed)
      if (response.access_token) {
        setAuthToken(response.access_token)
        setUser(response.user)
      }
      // Return the full response so the component can check for messages
      return response
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    removeAuthToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

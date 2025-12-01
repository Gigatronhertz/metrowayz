import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, authService, tokenManager } from '../services/authService'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string, userData?: User) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  loginWithGoogle: () => Promise<void>
  loginWithEmail: (email: string, password: string, name?: string, isSignUp?: boolean) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user && tokenManager.isAuthenticated()

  const login = async (token: string, userData?: User) => {
    setIsLoading(true)
    try {
      tokenManager.setToken(token)

      if (userData) {
        setUser(userData)
      } else {
        await fetchUser()
      }
    } catch (error) {
      console.error('Login failed:', error)
      tokenManager.removeToken()
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await authService.logout()
      setUser(null)
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUser = async () => {
    try {
      const response = await authService.getProfile()
      if (response.success && response.user) {
        setUser(response.user)
      } else {
        throw new Error(response.message || 'Failed to fetch user')
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      if (error instanceof Error && error.message.includes('401')) {
        tokenManager.removeToken()
        setUser(null)
      }
      throw error
    }
  }

  const refreshUser = async () => {
    if (!tokenManager.isAuthenticated()) {
      return
    }

    setIsLoading(true)
    try {
      await fetchUser()
    } catch (error) {
      console.error('Failed to refresh user:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    setIsLoading(true)
    try {
      // Initiate Google OAuth flow
      const token = await authService.initiateGoogleAuth()
      
      // Store token and fetch user data
      tokenManager.setToken(token)
      
      // Fetch user data from dashboard endpoint
      const response = await authService.getProfile()
      if (response.success && response.user) {
        setUser(response.user)
      } else {
        throw new Error(response.message || 'Failed to fetch user data')
      }
    } catch (error) {
      console.error('Google login failed:', error)
      tokenManager.removeToken()
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithEmail = async (email: string, password: string, name?: string, isSignUp?: boolean) => {
    setIsLoading(true)
    try {
      let response
      
      if (isSignUp && name) {
        response = await authService.signupWithEmail(email, password, name)
      } else {
        response = await authService.loginWithEmail(email, password)
      }

      if (response.success && response.user) {
        setUser(response.user)
      } else {
        throw new Error(response.message || 'Authentication failed')
      }
    } catch (error) {
      console.error('Email authentication failed:', error)
      tokenManager.removeToken()
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      if (tokenManager.isAuthenticated()) {
        try {
          await fetchUser()
        } catch (error) {
          console.error('Failed to initialize auth:', error)
          // Token might be expired, clear it
          tokenManager.removeToken()
        }
      }
      setIsLoading(false)
    }

    initializeAuth()
  }, [])

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
    loginWithGoogle,
    loginWithEmail
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
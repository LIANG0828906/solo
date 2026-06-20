import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, getToken, getUser, login as authLogin, register as authRegister, removeToken, getCurrentUser } from './AuthService'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isTeacher: boolean
  isParent: boolean
  login: (username: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken()
      if (token) {
        try {
          const currentUser = await getCurrentUser()
          setUser(currentUser)
        } catch (error) {
          removeToken()
          setUser(null)
        }
      } else {
        const savedUser = getUser()
        if (savedUser) {
          setUser(savedUser)
        }
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  const login = async (username: string, password: string) => {
    const { user: loggedInUser } = await authLogin({ username, password })
    setUser(loggedInUser)
  }

  const register = async (data: any) => {
    const { user: registeredUser } = await authRegister(data)
    setUser(registeredUser)
  }

  const logout = () => {
    removeToken()
    setUser(null)
  }

  const isAuthenticated = !!user
  const isTeacher = user?.role === 'teacher'
  const isParent = user?.role === 'parent'

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isTeacher, isParent, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

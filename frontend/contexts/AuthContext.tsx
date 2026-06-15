'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User, UserRole } from '@/types'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => { success: boolean; error?: string }
  register: (name: string, email: string, password: string, role: UserRole) => { success: boolean; error?: string }
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const DEFAULT_USERS: User[] = [
  { id: 'admin-1', name: 'Admin RS Misal', email: 'admin@rsmisal.id', password: 'admin123', role: 'admin' },
  { id: 'dokter-1', name: 'dr. Ahmad Fauzi, Sp.PD', email: 'dokter@rsmisal.id', password: 'dokter123', role: 'dokter' },
  { id: 'farmasi-1', name: 'Apt. Siti Rahayu', email: 'farmasi@rsmisal.id', password: 'farmasi123', role: 'farmasi' },
]

function getStoredUsers(): User[] {
  try {
    const stored = localStorage.getItem('rs_misal_users')
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  localStorage.setItem('rs_misal_users', JSON.stringify(DEFAULT_USERS))
  return [...DEFAULT_USERS]
}

function getStoredCurrentUser(): User | null {
  try {
    const stored = localStorage.getItem('rs_misal_current_user')
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = getStoredCurrentUser()
    setUser(stored)
    setIsLoading(false)
  }, [])

  const login = (email: string, password: string) => {
    const users = getStoredUsers()
    const found = users.find(u => u.email === email && u.password === password)
    if (!found) {
      return { success: false, error: 'Email atau password salah' }
    }
    setUser(found)
    localStorage.setItem('rs_misal_current_user', JSON.stringify(found))
    return { success: true }
  }

  const register = (name: string, email: string, password: string, role: UserRole) => {
    const users = getStoredUsers()
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'Email sudah terdaftar' }
    }
    const newUser: User = {
      id: `${role}-${Date.now().toString(36)}`,
      name,
      email,
      password,
      role,
    }
    users.push(newUser)
    localStorage.setItem('rs_misal_users', JSON.stringify(users))
    return { success: true }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('rs_misal_current_user')
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function getRoleDashboardPath(role: UserRole): string {
  switch (role) {
    case 'admin': return '/admin'
    case 'dokter': return '/dokter'
    case 'farmasi': return '/farmasi'
  }
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'admin': return 'Admin'
    case 'dokter': return 'Dokter'
    case 'farmasi': return 'Farmasi'
  }
}

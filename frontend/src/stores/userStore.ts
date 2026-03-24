import { create } from 'zustand'
import { apiClient } from '../api'

interface User {
  id: string
  phone: string
  nickname?: string
  avatar?: string
}

interface UserState {
  isLoggedIn: boolean
  user: User | null
  balance: number
  dailyQuota: number
  login: (phone: string, password: string) => Promise<void>
  register: (phone: string, password: string) => Promise<void>
  logout: () => void
  refreshQuota: () => Promise<void>
}

export const useUserStore = create<UserState>((set, get) => ({
  isLoggedIn: false,
  user: null,
  balance: 0,
  dailyQuota: 5,

  login: async (phone: string, password: string) => {
    const res = await apiClient.post('/api/v1/auth/login', { phone, password })
    const { token, user, balance, daily_quota } = res.data
    localStorage.setItem('token', token)
    set({ isLoggedIn: true, user, balance, dailyQuota: daily_quota })
  },

  register: async (phone: string, password: string) => {
    const res = await apiClient.post('/api/v1/auth/register', { phone, password })
    const { token, user, balance, daily_quota } = res.data
    localStorage.setItem('token', token)
    set({ isLoggedIn: true, user, balance, dailyQuota: daily_quota })
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ isLoggedIn: false, user: null, balance: 0, dailyQuota: 5 })
  },

  refreshQuota: async () => {
    const res = await apiClient.get('/api/v1/user/quota')
    set({ balance: res.data.balance, dailyQuota: res.data.daily_quota })
  },
}))

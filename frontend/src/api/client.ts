import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

export default apiClient

// ============ Prompt APIs ============

export interface Prompt {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  usageCount: number
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}

export interface PromptsResponse {
  items: Prompt[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getPrompts(params: { category?: string; page?: number; pageSize?: number }): Promise<PromptsResponse> {
  const { data } = await apiClient.get<PromptsResponse>('/v1/prompts', { params })
  return data
}

export async function searchPrompts(params: { q: string; category?: string; page?: number; pageSize?: number }): Promise<PromptsResponse> {
  const { data } = await apiClient.get<PromptsResponse>('/v1/prompts/search', { params })
  return data
}

export async function getPromptById(id: string): Promise<Prompt> {
  const { data } = await apiClient.get<Prompt>(`/v1/prompts/${id}`)
  return data
}

export async function toggleFavorite(id: string): Promise<Prompt> {
  const { data } = await apiClient.post<Prompt>(`/v1/prompts/${id}/favorite`)
  return data
}

// ============ User APIs ============

export interface UserInfo {
  id: string
  name: string
  avatar: string
  phone: string
  membership: 'FREE' | 'MONTHLY' | 'YEARLY'
  balance: number
  quota: number
  usedQuota: number
  createdAt: string
}

export async function getUserInfo(): Promise<UserInfo> {
  const { data } = await apiClient.get<UserInfo>('/v1/user/info')
  return data
}

export interface QuotaInfo {
  total: number
  used: number
  remaining: number
  resetDate: string
}

export async function getQuota(): Promise<QuotaInfo> {
  const { data } = await apiClient.get<QuotaInfo>('/v1/user/quota')
  return data
}

// ============ Image APIs ============

export interface ImageRecord {
  id: string
  prompt: string
  platform: string
  sizeType: string
  imageUrl: string
  thumbnailUrl: string
  createdAt: string
}

export interface ImagesResponse {
  items: ImageRecord[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getImages(params: { page?: number; pageSize?: number }): Promise<ImagesResponse> {
  const { data } = await apiClient.get<ImagesResponse>('/v1/images', { params })
  return data
}

// ============ Transaction APIs ============

export interface Transaction {
  id: string
  type: 'CHARGE' | 'MEMBERSHIP' | 'GENERATE'
  amount: number
  description: string
  createdAt: string
}

export interface TransactionsResponse {
  items: Transaction[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getTransactions(params: { page?: number; pageSize?: number }): Promise<TransactionsResponse> {
  const { data } = await apiClient.get<TransactionsResponse>('/v1/user/transactions', { params })
  return data
}

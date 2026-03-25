import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

const getHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Auth API
export const authAPI = {
  register: (data: { email: string; password: string; name?: string }) =>
    axios.post(`${API_BASE}/auth/register`, data),

  login: (data: { email: string; password: string }) =>
    axios.post(`${API_BASE}/auth/login`, data),

  refresh: (data: { refreshToken: string }) =>
    axios.post(`${API_BASE}/auth/refresh`, data),

  logout: (refreshToken?: string) =>
    axios.post(`${API_BASE}/auth/logout`, { refreshToken }),
}

// User API
export const userAPI = {
  getMe: () =>
    axios.get(`${API_BASE}/users/me`, { headers: getHeaders() }),

  updateMe: (data: { name?: string; avatar?: string }) =>
    axios.put(`${API_BASE}/users/me`, data, { headers: getHeaders() }),

  getBalance: () =>
    axios.get(`${API_BASE}/users/balance`, { headers: getHeaders() }),
}

// Prompts API
export const promptsAPI = {
  list: (params?: { keyword?: string; category?: string; page?: number; pageSize?: number }) =>
    axios.get(`${API_BASE}/prompts`, { params }),

  search: (keyword: string, limit?: number) =>
    axios.get(`${API_BASE}/prompts/search`, { params: { keyword, limit } }),

  getCategories: () =>
    axios.get(`${API_BASE}/prompts/categories`),

  getById: (id: string) =>
    axios.get(`${API_BASE}/prompts/${id}`),

  create: (data: { title: string; content: string; description?: string; category?: string; tags?: string[]; isPublic?: boolean }) =>
    axios.post(`${API_BASE}/prompts`, data, { headers: getHeaders() }),
}

// Images API
export const imagesAPI = {
  generate: (data: { platform: string; prompt?: string; promptId?: string; imageUrl?: string; negativePrompt?: string }) =>
    axios.post(`${API_BASE}/images/generate`, data, { headers: getHeaders() }),

  list: (params?: { page?: number; pageSize?: number }) =>
    axios.get(`${API_BASE}/images`, { params, headers: getHeaders() }),

  getById: (id: string) =>
    axios.get(`${API_BASE}/images/${id}`, { headers: getHeaders() }),

  delete: (id: string) =>
    axios.delete(`${API_BASE}/images/${id}`, { headers: getHeaders() }),

  getPlatformSizes: () =>
    axios.get(`${API_BASE}/images/platforms/sizes`),
}

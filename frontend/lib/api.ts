import axios from 'axios'

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      // You can add redirect logic here
    }
    return Promise.reject(error)
  }
)

// Types
export interface User {
  id: string
  email: string
  full_name?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials {
  email: string
  password: string
  full_name?: string
}

export interface Report {
  id: string
  user_id: string
  title: string
  description: string
  location: string
  category: string
  status: 'open' | 'in-progress' | 'resolved'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  ward?: string
  images: string[]
  upvotes: number
  created_at: string
  updated_at: string
}

export interface CreateReportData {
  title: string
  description: string
  location: string
  category: string
  priority?: string
  ward?: string
  images?: string[]
}

export interface ChatMessage {
  id: string
  user_id: string
  message: string
  response?: string
  type: 'user' | 'bot'
  created_at: string
}

export interface AQIData {
  value: number
  status: string
  pm25: number
  pm10: number
  co?: number
  so2?: number
  no2?: number
  temperature: number
  humidity: number
  windSpeed: number
  uvIndex: number
  location: string
  timestamp: string
}

// API Services
export const authService = {
  async login(credentials: LoginCredentials) {
    const response = await api.post('/api/auth/login', credentials)
    return response.data
  },

  async signup(credentials: SignupCredentials) {
    const response = await api.post('/api/auth/signup', credentials)
    return response.data
  },

  async getCurrentUser() {
    const response = await api.get('/api/auth/me')
    return response.data
  },

  logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
  }
}

export const reportsService = {
  async getReports(params?: { category?: string; status?: string; limit?: number; offset?: number }) {
    const response = await api.get('/api/reports', { params })
    return response.data
  },

  async createReport(data: CreateReportData) {
    const response = await api.post('/api/reports', data)
    return response.data
  },

  async getReport(id: string) {
    const response = await api.get(`/api/reports/${id}`)
    return response.data
  },

  async updateReport(id: string, data: CreateReportData) {
    const response = await api.put(`/api/reports/${id}`, data)
    return response.data
  },

  async upvote(id: string) {
    const response = await api.post(`/api/reports/${id}/upvote`)
    return response.data
  }
}

// Chat API - use this in your components
export const chatAPI = {
  async getMessages(params?: { limit?: number; offset?: number }) {
    const response = await api.get('/api/chat/messages', { params })
    return response.data
  },

  async sendMessage(message: string) {
    const response = await api.post('/api/chat/messages', { message })
    return response.data
  }
}

// Alias for backward compatibility
export const chatService = chatAPI

// Mock AQI service (replace with real API integration)
export const aqiService = {
  async getCurrentAQI(location: string = 'Central Delhi'): Promise<AQIData> {
    // This would be replaced with real API calls
    return {
      value: 206,
      status: 'Severe',
      pm25: 130,
      pm10: 180,
      co: 2.5,
      so2: 15,
      no2: 45,
      temperature: 13,
      humidity: 77,
      windSpeed: 7,
      uvIndex: 0,
      location,
      timestamp: new Date().toISOString()
    }
  },

  async getHistoricalData(location: string, days: number = 7) {
    // Mock historical data - replace with real API
    const data = []
    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      data.push({
        date: date.toISOString().split('T')[0],
        aqi: Math.floor(Math.random() * 100) + 150,
        pm25: Math.floor(Math.random() * 50) + 80,
        pm10: Math.floor(Math.random() * 80) + 120
      })
    }
    return data
  },

  async getForecast(location: string, hours: number = 24) {
    // Mock forecast data - replace with real API
    const data = []
    for (let i = 0; i < hours; i++) {
      const date = new Date()
      date.setHours(date.getHours() + i)
      data.push({
        time: date.toISOString(),
        aqi: Math.floor(Math.random() * 100) + 150,
        pm25: Math.floor(Math.random() * 50) + 80,
        pm10: Math.floor(Math.random() * 80) + 120,
        confidence: Math.floor(Math.random() * 20) + 80
      })
    }
    return data
  }
}

export default api
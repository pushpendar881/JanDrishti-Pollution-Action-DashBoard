// API utility functions for communicating with FastAPI backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export interface User {
  id: string;
  email: string;
  full_name?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
  message?: string;
}

export interface Report {
  id: string;
  user_id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  status: 'open' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  ward?: string;
  images: string[];
  upvotes: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  response?: string;
  type: 'user' | 'bot';
  created_at: string;
}

// Get auth token from localStorage
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

// Set auth token in localStorage
export const setAuthToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_token', token);
};

// Remove auth token from localStorage
export const removeAuthToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
};

// API request helper
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Authentication API
export const authAPI = {
  signup: async (email: string, password: string, fullName?: string): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getCurrentUser: async (): Promise<User> => {
    return apiRequest<User>('/api/auth/me');
  },
};

// Reports API
export const reportsAPI = {
  getAll: async (category?: string, status?: string): Promise<Report[]> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (status) params.append('status', status);
    const query = params.toString();
    return apiRequest<Report[]>(`/api/reports${query ? `?${query}` : ''}`);
  },

  getById: async (id: string): Promise<Report> => {
    return apiRequest<Report>(`/api/reports/${id}`);
  },

  create: async (report: {
    title: string;
    description: string;
    location: string;
    category: string;
    priority?: string;
    ward?: string;
    images?: string[];
  }): Promise<Report> => {
    return apiRequest<Report>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(report),
    });
  },

  update: async (id: string, report: {
    title: string;
    description: string;
    location: string;
    category: string;
    priority?: string;
    ward?: string;
    images?: string[];
  }): Promise<Report> => {
    return apiRequest<Report>(`/api/reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(report),
    });
  },

  upvote: async (id: string): Promise<{ upvotes: number }> => {
    return apiRequest<{ upvotes: number }>(`/api/reports/${id}/upvote`, {
      method: 'POST',
    });
  },
};

// Chat API
export const chatAPI = {
  getMessages: async (): Promise<ChatMessage[]> => {
    return apiRequest<ChatMessage[]>('/api/chat/messages');
  },

  sendMessage: async (message: string): Promise<ChatMessage> => {
    return apiRequest<ChatMessage>('/api/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },
};

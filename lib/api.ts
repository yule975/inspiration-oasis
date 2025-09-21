import axios from 'axios';

// API基础配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token过期，清除本地存储并跳转到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API接口定义
export const api = {
  // 认证相关
  auth: {
    login: (credentials: { email: string; password: string }) =>
      apiClient.post('/api/auth/login', credentials),
    register: (userData: { username: string; email: string; password: string }) =>
      apiClient.post('/api/auth/register', { name: userData.username, email: userData.email, password: userData.password }),
    logout: () => apiClient.post('/api/auth/logout'),
    refreshToken: () => apiClient.post('/api/auth/refresh'),
    getProfile: () => apiClient.get('/api/auth/profile'),
  },

  // 灵感相关
  ideas: {
    getAll: (params?: { page?: number; limit?: number; search?: string; tags?: string[] }) =>
      apiClient.get('/api/ideas', { params }),
    getById: (id: string) => apiClient.get(`/api/ideas/${id}`),
    create: (ideaData: { title: string; content: string; tags?: string[] }) =>
      apiClient.post('/api/ideas', ideaData),
    update: (id: string, ideaData: Partial<{ title: string; content: string; tags: string[] }>) =>
      apiClient.put(`/api/ideas/${id}`, ideaData),
    delete: (id: string) => apiClient.delete(`/api/ideas/${id}`),
    like: (id: string) => apiClient.post(`/api/ideas/${id}/like`),
    unlike: (id: string) => apiClient.delete(`/api/ideas/${id}/like`),
  },

  // 评论相关
  comments: {
    getByIdeaId: (ideaId: string) => apiClient.get(`/api/ideas/${ideaId}/comments`),
    create: (ideaId: string, content: string) =>
      apiClient.post(`/api/ideas/${ideaId}/comments`, { content }),
    update: (id: string, content: string) =>
      apiClient.put(`/api/comments/${id}`, { content }),
    delete: (id: string) => apiClient.delete(`/api/comments/${id}`),
  },

  // 标签相关
  tags: {
    getAll: () => apiClient.get('/api/tags'),
    getPopular: () => apiClient.get('/api/tags/popular'),
  },

  // 统计相关
  stats: {
    getDashboard: () => apiClient.get('/api/stats/dashboard'),
    getUserStats: () => apiClient.get('/api/stats/user'),
  },

  // 用户相关
  users: {
    getProfile: (id: string) => apiClient.get(`/api/users/${id}`),
    updateProfile: (userData: Partial<{ username: string; email: string; bio?: string }>) =>
      apiClient.put('/api/users/profile', userData),
  },
};

export default apiClient;

// 类型定义
export interface User {
  id: string;
  username: string;
  email: string;
  bio?: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface Idea {
  id: string;
  title: string;
  content: string;
  authorId: string;
  author: User;
  tags: Tag[];
  likes: Like[];
  comments: Comment[];
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
}

export interface Like {
  id: string;
  userId: string;
  ideaId: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  ideaId: string;
  user: User;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
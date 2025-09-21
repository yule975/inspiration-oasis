'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, User } from '@/lib/api';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // 初始化时检查本地存储的token
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          // 验证token是否仍然有效
          await refreshUser();
        } catch (error) {
          console.error('Token validation failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await api.auth.login({ email, password });
      
      if (response.data.success) {
        const { token, user: userData } = response.data.data;
        
        // 保存token和用户信息
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        toast.success('登录成功！');
        return true;
      } else {
        toast.error(response.data.message || '登录失败');
        return false;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || '登录失败，请检查网络连接';
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await api.auth.register({ username, email, password });
      
      if (response.data.success) {
        toast.success('注册成功！请登录');
        return true;
      } else {
        toast.error(response.data.message || '注册失败');
        return false;
      }
    } catch (error: any) {
      console.error('Register error:', error);
      const message = error.response?.data?.message || '注册失败，请检查网络连接';
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      // 调用后端登出接口（可选）
      api.auth.logout().catch(console.error);
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // 清除本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      toast.success('已退出登录');
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.auth.getProfile();
      if (response.data.success) {
        const userData = response.data.data;
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      // Token可能已过期，清除本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
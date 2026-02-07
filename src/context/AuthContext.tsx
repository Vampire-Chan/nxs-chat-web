import { createContext, useContext, useState, ReactNode } from 'react';
import axios from 'axios';
import type { IUser } from '../services/api';

interface AuthContextType {
  user: IUser | null;
  token: string | null;
  login: (token: string, user: IUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // 1. Initialize State DIRECTLY from LocalStorage (Lazy Initialization)
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });

  const [user, setUser] = useState<IUser | null>(() => {
    const storedUser = localStorage.getItem('user');
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error("Failed to parse user from local storage", e);
      return null;
    }
  });

  // 2. Set Axios Header immediately if token exists
  if (token) {
    axios.defaults.headers.common['x-auth-token'] = token;
  }

  const login = (newToken: string, newUser: IUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    axios.defaults.headers.common['x-auth-token'] = newToken;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['x-auth-token'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
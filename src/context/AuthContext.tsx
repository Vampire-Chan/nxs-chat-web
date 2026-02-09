import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import type { IUser } from '../services/api';

interface AccountSession {
  token: string;
  user: IUser;
}

interface AuthContextType {
  user: IUser | null;
  token: string | null;
  accounts: AccountSession[];
  login: (token: string, user: IUser) => void;
  logout: (all?: boolean) => void;
  switchAccount: (userId: string) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<IUser | null>(JSON.parse(localStorage.getItem('user') || 'null'));
  const [accounts, setAccounts] = useState<AccountSession[]>(JSON.parse(localStorage.getItem('nexus_accounts') || '[]'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
    }
  }, [token]);

  const login = (newToken: string, newUser: IUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));

    // Update Multi-Account Matrix
    const newAccounts = [...accounts.filter(acc => (acc.user._id || acc.user.id) !== (newUser._id || newUser.id)), { token: newToken, user: newUser }];
    setAccounts(newAccounts);
    localStorage.setItem('nexus_accounts', JSON.stringify(newAccounts));
  };

  const switchAccount = (userId: string) => {
    const target = accounts.find(acc => (acc.user._id || acc.user.id) === userId);
    if (target) {
      setToken(target.token);
      setUser(target.user);
      localStorage.setItem('token', target.token);
      localStorage.setItem('user', JSON.stringify(target.user));
    }
  };

  const logout = (all = false) => {
    if (all) {
      setToken(null);
      setUser(null);
      setAccounts([]);
      localStorage.clear();
    } else if (user) {
      const remaining = accounts.filter(acc => (acc.user._id || acc.user.id) !== (user._id || user.id));
      setAccounts(remaining);
      localStorage.setItem('nexus_accounts', JSON.stringify(remaining));
      
      if (remaining.length > 0) {
        switchAccount(remaining[0].user._id || remaining[0].user.id);
      } else {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, accounts, login, logout, switchAccount, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
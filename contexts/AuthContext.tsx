import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCurrentUser, getCurrentSession, isAdmin } from '../services/authService';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  session: any;
  loading: boolean;
  isAdminUser: boolean;
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);

  const refreshAuth = async () => {
    try {
      const [currentUser, currentSession] = await Promise.all([
        getCurrentUser(),
        getCurrentSession()
      ]);

      setUser(currentUser);
      setSession(currentSession);

      if (currentUser) {
        setIsAdminUser(currentUser.is_admin === true);
      } else {
        setIsAdminUser(false);
      }
    } catch (error) {
      console.error('Error refreshing auth:', error);
      setUser(null);
      setSession(null);
      setIsAdminUser(false);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Use direct import if possible, or keep require if circular dependency is real.
      // Assuming require was valid, we'll keep it but wrap properly.
      const { logout: serviceLogout } = require('../services/authService');
      await serviceLogout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // ALWAYS clear local state
      setUser(null);
      setSession(null);
      setIsAdminUser(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdminUser, refreshAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

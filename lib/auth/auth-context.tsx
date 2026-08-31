'use client';

/* eslint-disable react-hooks/set-state-in-effect */
import { createContext, useContext, useEffect, useState } from 'react';

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  role: string;
  branch_id?: string;
  branch_name?: string;
  is_active: boolean;
}

interface AuthContextType {
  session: AuthSession | null;
  user: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth_session');
      if (stored) {
        const parsedSession = JSON.parse(stored);
        setSession(parsedSession);
      }
    } catch (e) {
      console.error('Failed to parse session:', e);
      localStorage.removeItem('auth_session');
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_session');
      setSession(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

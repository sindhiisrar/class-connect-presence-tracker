
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { User, UserRole, MOCK_USERS } from '@/lib/types';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  userRole: UserRole | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const login = async (email: string, password: string): Promise<boolean> => {
    // In a real app, we would validate credentials against a backend
    // For this demo, we'll just check if the email exists in our mock data
    const user = MOCK_USERS.find(user => user.email === email);
    
    if (user) {
      setCurrentUser(user);
      // Store user info in localStorage for persistent login
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    
    return false;
  };
  
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };
  
  // Check if user is already logged in (from localStorage)
  React.useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);
  
  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    login,
    logout,
    userRole: currentUser?.role || null
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

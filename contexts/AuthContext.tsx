import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { geminiService } from '../services/geminiService';

interface AuthContextType {
  hasApiKey: boolean;
  isModalOpen: boolean;
  requestAuth: () => void;
  saveKey: (key: string) => void;
  checkAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Check for API Key on mount
    const storedKey = localStorage.getItem('GEMINI_API_KEY');
    const envKey = process.env.API_KEY;
    
    if (storedKey || envKey) {
        setHasApiKey(true);
        // Initialize service silently if key exists
        if (storedKey && !geminiService.isConfigured()) {
            geminiService.initialize(storedKey);
        }
    }
  }, []);

  const requestAuth = useCallback(() => {
      setIsModalOpen(true);
  }, []);

  const saveKey = useCallback((key: string) => {
    localStorage.setItem('GEMINI_API_KEY', key);
    geminiService.initialize(key);
    setHasApiKey(true);
    setIsModalOpen(false);
  }, []);

  const checkAuth = useCallback(() => {
      if (!hasApiKey) {
          requestAuth();
          return false;
      }
      return true;
  }, [hasApiKey, requestAuth]);

  return (
    <AuthContext.Provider value={{ hasApiKey, isModalOpen, requestAuth, saveKey, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

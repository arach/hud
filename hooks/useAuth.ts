import { useState, useEffect, useCallback } from 'react';
import { geminiService } from '../services/geminiService';

export const useAuth = () => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  useEffect(() => {
    // Check for API Key on mount
    const storedKey = localStorage.getItem('GEMINI_API_KEY');
    const envKey = process.env.API_KEY;
    
    if (storedKey || envKey) {
        setHasApiKey(true);
        // Ensure service is initialized if using stored key
        if (storedKey && !geminiService.isConfigured()) {
            geminiService.initialize(storedKey);
        }
    }
  }, []);

  const handleSaveKey = (key: string) => {
    localStorage.setItem('GEMINI_API_KEY', key);
    geminiService.initialize(key);
    setHasApiKey(true);
    setIsApiKeyModalOpen(false);
  };
  
  const checkApiKey = useCallback(() => {
      if (!hasApiKey) {
          setIsApiKeyModalOpen(true);
          return false;
      }
      return true;
  }, [hasApiKey]);

  return {
    hasApiKey,
    isApiKeyModalOpen,
    setIsApiKeyModalOpen,
    handleSaveKey,
    checkApiKey
  };
};

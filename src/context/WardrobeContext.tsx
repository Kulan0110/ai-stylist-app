import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { loadWardrobe, addItem as dbAdd, removeItem as dbRemove } from '../services/wardrobeService';
import { MOCK_WARDROBE } from '../services/aiService';
import { useAuth } from './AuthContext';
import type { WardrobeItem, WardrobeContextValue } from '../types';

const WardrobeContext = createContext<WardrobeContextValue | null>(null);

interface WardrobeProviderProps {
  children: ReactNode;
}

export function WardrobeProvider({ children }: WardrobeProviderProps) {
  const { user } = useAuth();
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>(MOCK_WARDROBE);
  const [loading,  setLoading]  = useState<boolean>(true);

  // Reload wardrobe whenever the logged-in user changes
  useEffect(() => {
    setLoading(true);
    loadWardrobe(user?.id)
      .then((items: WardrobeItem[]) => setWardrobe(items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const addItem = useCallback(async (item: WardrobeItem): Promise<void> => {
    setWardrobe(prev => [item, ...prev]);          // optimistic update
    if (user?.id) await dbAdd(item, user.id);
  }, [user?.id]);

  const removeItem = useCallback(async (id: string): Promise<void> => {
    setWardrobe(prev => prev.filter(i => i.id !== id));  // optimistic update
    if (user?.id) await dbRemove(id);
  }, [user?.id]);

  return (
    <WardrobeContext.Provider value={{ wardrobe, loading, addItem, removeItem }}>
      {children}
    </WardrobeContext.Provider>
  );
}

export function useWardrobe(): WardrobeContextValue {
  const ctx = useContext(WardrobeContext);
  if (!ctx) throw new Error('useWardrobe must be inside WardrobeProvider');
  return ctx;
}

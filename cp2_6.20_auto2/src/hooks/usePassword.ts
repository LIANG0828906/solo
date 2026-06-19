import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  generatePassword,
  calculateStrength,
  PasswordConfig,
  StrengthResult,
  HistoryItem
} from '../utils/passwordGenerator';

const STORAGE_KEY = 'password_generator_history';
const MAX_HISTORY = 20;

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

export function usePassword() {
  const [config, setConfig] = useState<PasswordConfig>({
    mode: 'random',
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: true,
    keywordFilter: '',
    phraseWords: 4,
    phraseSeparator: '-',
    readableWords: 3
  });

  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [displayedPassword, setDisplayedPassword] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [strength, setStrength] = useState<StrengthResult>(calculateStrength(''));
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history:', e);
    }
  }, [history]);

  useEffect(() => {
    const t0 = performance.now();
    const newStrength = calculateStrength(currentPassword);
    const t1 = performance.now();
    if (t1 - t0 > 50) {
      console.warn(`Strength calculation took ${(t1 - t0).toFixed(2)}ms`);
    }
    setStrength(newStrength);
  }, [currentPassword]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = uuidv4();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2000);
  }, []);

  const animateTypewriter = useCallback((password: string) => {
    setIsAnimating(true);
    setDisplayedPassword('');
    let index = 0;
    const chars = password.split('');
    
    const animate = () => {
      if (index <= chars.length) {
        setDisplayedPassword(password.slice(0, index));
        index++;
        if (index <= chars.length) {
          setTimeout(animate, 30);
        } else {
          setIsAnimating(false);
        }
      }
    };
    setTimeout(animate, 0);
  }, []);

  const handleGenerate = useCallback(() => {
    const t0 = performance.now();
    const newPassword = generatePassword(config);
    const t1 = performance.now();
    if (t1 - t0 > 100) {
      console.warn(`Password generation took ${(t1 - t0).toFixed(2)}ms`);
    }
    
    setCurrentPassword(newPassword);
    animateTypewriter(newPassword);

    const historyItem: HistoryItem = {
      id: uuidv4(),
      password: newPassword,
      mode: config.mode,
      createdAt: Date.now(),
      isFavorite: false
    };

    setHistory(prev => {
      const updated = [historyItem, ...prev];
      return updated.slice(0, MAX_HISTORY);
    });
  }, [config, animateTypewriter]);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('密码已复制到剪贴板', 'success');
      return true;
    } catch (e) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('密码已复制到剪贴板', 'success');
        return true;
      } catch (err) {
        document.body.removeChild(textarea);
        showToast('复制失败，请手动复制', 'error');
        return false;
      }
    }
  }, [showToast]);

  const toggleFavorite = useCallback((id: string) => {
    setHistory(prev => {
      const updated = prev.map(item =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      );
      const favorites = updated.filter(i => i.isFavorite);
      const nonFavorites = updated
        .filter(i => !i.isFavorite)
        .sort((a, b) => b.createdAt - a.createdAt);
      return [...favorites, ...nonFavorites];
    });
  }, []);

  const deleteHistoryItem = useCallback((id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    showToast('历史记录已清空', 'success');
  }, [showToast]);

  const reorderHistory = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return;
    
    setHistory(prev => {
      const fromIndex = prev.findIndex(i => i.id === fromId);
      const toIndex = prev.findIndex(i => i.id === toId);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const updated = [...prev];
      const [movedItem] = updated.splice(fromIndex, 1);
      
      const fromIsFav = movedItem.isFavorite;
      const toIsFav = updated[toIndex > fromIndex ? toIndex - 1 : toIndex]?.isFavorite;
      
      if (fromIsFav !== toIsFav) {
        movedItem.isFavorite = toIsFav;
      }
      
      updated.splice(toIndex > fromIndex ? toIndex - 1 : toIndex, 0, movedItem);
      
      const favorites = updated.filter(i => i.isFavorite);
      const nonFavorites = updated
        .filter(i => !i.isFavorite)
        .sort((a, b) => b.createdAt - a.createdAt);
      
      return [...favorites, ...nonFavorites];
    });
  }, []);

  const updateConfig = useCallback((updates: Partial<PasswordConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const sortedHistory = [...history].sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) {
      return a.isFavorite ? -1 : 1;
    }
    return b.createdAt - a.createdAt;
  });

  return {
    config,
    updateConfig,
    currentPassword,
    displayedPassword,
    isAnimating,
    strength,
    history: sortedHistory,
    toasts,
    draggedItemId,
    setDraggedItemId,
    handleGenerate,
    copyToClipboard,
    toggleFavorite,
    deleteHistoryItem,
    clearHistory,
    reorderHistory,
    showToast
  };
}

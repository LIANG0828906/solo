
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Card, CardContextType } from '../types/card';
import { cardApi } from '../utils/api';

const CardContext = createContext<CardContextType | undefined>(undefined);

export const CardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [timeLineStamp, setTimeLineStamp] = useState<number>(Date.now());
  const [timeLineMode, setTimeLineMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCards = useCallback(async () => {
    try {
      setLoading(true);
      const data = await cardApi.getAll();
      setCards(data);
      if (data.length > 0) {
        const earliestTime = Math.min(...data.map(c => new Date(c.createdAt).getTime()));
        setTimeLineStamp(earliestTime);
      }
    } catch (error) {
      console.error('获取卡片失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const addCard = useCallback(async (cardData: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newCard = await cardApi.create(cardData);
      setCards(prev => [...prev, newCard]);
    } catch (error) {
      console.error('创建卡片失败:', error);
      throw error;
    }
  }, []);

  const updateCardPosition = useCallback((id: string, x: number, y: number) => {
    setCards(prev => prev.map(card => 
      card.id === id ? { ...card, x, y } : card
    ));
  }, []);

  const updateCardContent = useCallback(async (
    id: string, 
    data: Partial<Pick<Card, 'title' | 'content' | 'color'>>
  ) => {
    try {
      const updatedCard = await cardApi.update(id, data);
      setCards(prev => prev.map(card => 
        card.id === id ? updatedCard : card
      ));
      setSelectedCard(prev => prev?.id === id ? updatedCard : prev);
    } catch (error) {
      console.error('更新卡片失败:', error);
      throw error;
    }
  }, []);

  const deleteCard = useCallback(async (id: string) => {
    try {
      await cardApi.delete(id);
      setCards(prev => prev.filter(card => card.id !== id));
      if (selectedCard?.id === id) {
        setSelectedCard(null);
      }
    } catch (error) {
      console.error('删除卡片失败:', error);
      throw error;
    }
  }, [selectedCard]);

  const value: CardContextType = {
    cards,
    selectedCard,
    timeLineStamp,
    timeLineMode,
    loading,
    addCard,
    updateCardPosition,
    updateCardContent,
    deleteCard,
    setSelectedCard,
    setTimeLineStamp,
    setTimeLineMode,
    fetchCards,
  };

  return (
    <CardContext.Provider value={value}>
      {children}
    </CardContext.Provider>
  );
};

export const useCardContext = (): CardContextType => {
  const context = useContext(CardContext);
  if (context === undefined) {
    throw new Error('useCardContext must be used within a CardProvider');
  }
  return context;
};

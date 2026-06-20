import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import type { Deck, Card } from '../types';

const STORAGE_KEY = 'flashcardforge_decks';

const getInitialDecks = (): Deck[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load decks:', e);
  }
  return [];
};

export function useFlashCards() {
  const [decks, setDecks] = useState<Deck[]>(getInitialDecks);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
  }, [decks]);

  const addDeck = useCallback((name: string) => {
    const newDeck: Deck = {
      id: uuidv4(),
      name,
      cards: [],
      createdAt: new Date().toISOString(),
    };
    setDecks(prev => [...prev, newDeck]);
    return newDeck;
  }, []);

  const deleteDeck = useCallback((deckId: string) => {
    setDecks(prev => prev.filter(d => d.id !== deckId));
  }, []);

  const addCard = useCallback((deckId: string, front: string, back: string) => {
    const newCard: Card = {
      id: uuidv4(),
      front,
      back,
      correctCount: 0,
      nextReviewDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setDecks(prev =>
      prev.map(d =>
        d.id === deckId ? { ...d, cards: [...d.cards, newCard] } : d
      )
    );
    return newCard;
  }, []);

  const updateCard = useCallback((deckId: string, cardId: string, front: string, back: string) => {
    setDecks(prev =>
      prev.map(d =>
        d.id === deckId
          ? {
              ...d,
              cards: d.cards.map(c =>
                c.id === cardId ? { ...c, front, back } : c
              ),
            }
          : d
      )
    );
  }, []);

  const deleteCard = useCallback((deckId: string, cardId: string) => {
    setDecks(prev =>
      prev.map(d =>
        d.id === deckId
          ? { ...d, cards: d.cards.filter(c => c.id !== cardId) }
          : d
      )
    );
  }, []);

  const importCardsFromFile = useCallback((deckId: string, file: File): Promise<{ front: string; back: string }[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          let jsonData: { front: string; back: string }[] = [];

          if (file.name.endsWith('.csv')) {
            const workbook = XLSX.read(data, { type: 'string' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
            jsonData = rows
              .filter(row => row[0] && row[1])
              .map(row => ({
                front: String(row[0]),
                back: String(row[1]),
              }));
          } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
            jsonData = rows
              .filter(row => row[0] && row[1])
              .map(row => ({
                front: String(row[0]),
                back: String(row[1]),
              }));
          }

          const cardsToAdd: Card[] = jsonData.map(item => ({
            id: uuidv4(),
            front: item.front,
            back: item.back,
            correctCount: 0,
            nextReviewDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          }));

          setDecks(prev =>
            prev.map(d =>
              d.id === deckId
                ? { ...d, cards: [...d.cards, ...cardsToAdd] }
                : d
            )
          );

          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;

      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    });
  }, []);

  const updateCardReview = useCallback((deckId: string, cardId: string, isCorrect: boolean) => {
    const intervals = [1, 3, 7, 14, 30, 60, 90];

    setDecks(prev =>
      prev.map(d =>
        d.id === deckId
          ? {
              ...d,
              cards: d.cards.map(c => {
                if (c.id !== cardId) return c;
                const newCorrectCount = isCorrect
                  ? Math.min(c.correctCount + 1, intervals.length - 1)
                  : 0;
                const daysToAdd = intervals[newCorrectCount];
                const nextDate = new Date();
                nextDate.setDate(nextDate.getDate() + daysToAdd);
                return {
                  ...c,
                  correctCount: newCorrectCount,
                  nextReviewDate: nextDate.toISOString(),
                };
              }),
            }
          : d
      )
    );
  }, []);

  const getTodayReviewCount = useCallback((deck: Deck) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return deck.cards.filter(card => {
      const reviewDate = new Date(card.nextReviewDate);
      reviewDate.setHours(0, 0, 0, 0);
      return reviewDate <= today;
    }).length;
  }, []);

  const getDeckById = useCallback((deckId: string) => {
    return decks.find(d => d.id === deckId);
  }, [decks]);

  return {
    decks,
    addDeck,
    deleteDeck,
    addCard,
    updateCard,
    deleteCard,
    importCardsFromFile,
    updateCardReview,
    getTodayReviewCount,
    getDeckById,
  };
}

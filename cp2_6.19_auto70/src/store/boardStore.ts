import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import type { Card, Tag, Note } from '@/types';
import { getTagColor, getNoteBackground } from '@/utils/colorUtils';

interface BoardState {
  cards: Card[];
  tags: Tag[];
  notes: Note[];
  selectedTagId: string | null;
  selectedCardIds: string[];
  isLoading: boolean;
  
  loadFromIndexedDB: () => Promise<void>;
  saveToIndexedDB: () => Promise<void>;
  
  addCard: (card: Omit<Card, 'id' | 'createdAt' | 'order' | 'selected'>) => void;
  updateCard: (id: string, updates: Partial<Card>) => void;
  deleteCard: (id: string) => void;
  reorderCards: (startIndex: number, endIndex: number) => void;
  
  addTag: (name: string) => void;
  addTagToCard: (cardId: string, tagName: string) => void;
  removeTagFromCard: (cardId: string, tagId: string) => void;
  deleteTag: (tagId: string) => void;
  
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addNoteFromCard: (cardId: string, content: string) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  
  toggleCardSelection: (id: string, isMultiSelect: boolean) => void;
  clearSelection: () => void;
  setSelectedTag: (tagId: string | null) => void;
}

const STORAGE_KEY = 'inspiration-board-data';

const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      cards: [],
      tags: [],
      notes: [],
      selectedTagId: null,
      selectedCardIds: [],
      isLoading: false,

      loadFromIndexedDB: async () => {
        set({ isLoading: true });
        try {
          const data = await idbGet(STORAGE_KEY);
          if (data) {
            const raw = typeof data === 'string' ? data : JSON.stringify(data);
            const parsed = JSON.parse(raw);
            set({
              cards: parsed.cards?.map((c: Card) => ({ ...c, createdAt: new Date(c.createdAt) })) || [],
              tags: parsed.tags || [],
              notes: parsed.notes?.map((n: Note) => ({
                ...n,
                createdAt: new Date(n.createdAt),
                updatedAt: new Date(n.updatedAt)
              })) || [],
            });
          }
        } catch (error) {
          console.error('Failed to load from IndexedDB:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      saveToIndexedDB: async () => {
        try {
          const { cards, tags, notes } = get();
          const data = JSON.stringify({ cards, tags, notes });
          await idbSet(STORAGE_KEY, data);
        } catch (error) {
          console.error('Failed to save to IndexedDB:', error);
        }
      },

      addCard: (cardData) => {
        const { cards, saveToIndexedDB } = get();
        const newCard: Card = {
          ...cardData,
          id: uuidv4(),
          createdAt: new Date(),
          order: cards.length,
          selected: false,
        };
        set({ cards: [...cards, newCard] });
        saveToIndexedDB();
      },

      updateCard: (id, updates) => {
        const { cards, saveToIndexedDB } = get();
        set({
          cards: cards.map(card =>
            card.id === id ? { ...card, ...updates } : card
          )
        });
        saveToIndexedDB();
      },

      deleteCard: (id) => {
        const { cards, tags, saveToIndexedDB } = get();
        const cardToDelete = cards.find(c => c.id === id);
        
        if (cardToDelete) {
          const updatedTags = tags.map(tag => {
            const isCardTagged = cardToDelete.tags.includes(tag.name);
            return isCardTagged
              ? { ...tag, cardCount: Math.max(0, tag.cardCount - 1) }
              : tag;
          }).filter(tag => tag.cardCount > 0);

          set({
            cards: cards.filter(card => card.id !== id),
            tags: updatedTags,
            selectedCardIds: get().selectedCardIds.filter(cid => cid !== id)
          });
          saveToIndexedDB();
        }
      },

      reorderCards: (startIndex, endIndex) => {
        const { cards, saveToIndexedDB } = get();
        const result = Array.from(cards);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        
        const reordered = result.map((card, index) => ({ ...card, order: index }));
        set({ cards: reordered });
        saveToIndexedDB();
      },

      addTag: (name) => {
        const { tags, saveToIndexedDB } = get();
        const existingTag = tags.find(t => t.name.toLowerCase() === name.toLowerCase());
        
        if (!existingTag) {
          const newTag: Tag = {
            id: uuidv4(),
            name,
            color: getTagColor(name),
            cardCount: 0,
          };
          set({ tags: [...tags, newTag] });
          saveToIndexedDB();
        }
      },

      addTagToCard: (cardId, tagName) => {
        const { cards, tags, saveToIndexedDB } = get();
        let tag = tags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
        
        if (!tag) {
          tag = {
            id: uuidv4(),
            name: tagName,
            color: getTagColor(tagName),
            cardCount: 0,
          };
          set({ tags: [...tags, tag] });
        }

        const updatedCards = cards.map(card => {
          if (card.id === cardId && !card.tags.includes(tag!.name) && card.tags.length < 3) {
            return { ...card, tags: [...card.tags, tag!.name] };
          }
          return card;
        });

        const cardToUpdate = cards.find(c => c.id === cardId);
        if (cardToUpdate && !cardToUpdate.tags.includes(tag.name)) {
          const updatedTags = get().tags.map(t =>
            t.id === tag!.id ? { ...t, cardCount: t.cardCount + 1 } : t
          );
          set({ cards: updatedCards, tags: updatedTags });
          saveToIndexedDB();
        }
      },

      removeTagFromCard: (cardId, tagId) => {
        const { cards, tags, saveToIndexedDB } = get();
        const tag = tags.find(t => t.id === tagId);
        
        if (!tag) return;

        const updatedCards = cards.map(card => {
          if (card.id === cardId) {
            return { ...card, tags: card.tags.filter(t => t !== tag.name) };
          }
          return card;
        });

        const cardToUpdate = cards.find(c => c.id === cardId);
        if (cardToUpdate && cardToUpdate.tags.includes(tag.name)) {
          const newCount = Math.max(0, tag.cardCount - 1);
          const updatedTags = newCount === 0
            ? tags.filter(t => t.id !== tagId)
            : tags.map(t => t.id === tagId ? { ...t, cardCount: newCount } : t);
          
          set({ cards: updatedCards, tags: updatedTags });
          saveToIndexedDB();
        }
      },

      deleteTag: (tagId) => {
        const { cards, tags, saveToIndexedDB } = get();
        const tag = tags.find(t => t.id === tagId);
        
        if (!tag) return;

        const updatedCards = cards.map(card => ({
          ...card,
          tags: card.tags.filter(t => t !== tag.name)
        }));

        set({
          cards: updatedCards,
          tags: tags.filter(t => t.id !== tagId),
          selectedTagId: get().selectedTagId === tagId ? null : get().selectedTagId
        });
        saveToIndexedDB();
      },

      addNote: (noteData) => {
        const { notes, saveToIndexedDB } = get();
        const newNote: Note = {
          ...noteData,
          id: uuidv4(),
          createdAt: new Date(),
          updatedAt: new Date(),
          backgroundColor: noteData.backgroundColor || getNoteBackground(),
        };
        set({ notes: [...notes, newNote] });
        saveToIndexedDB();
      },

      addNoteFromCard: (cardId, content) => {
        const { cards, notes, saveToIndexedDB } = get();
        const card = cards.find(c => c.id === cardId);
        if (!card) return;

        const newNote: Note = {
          id: uuidv4(),
          content,
          x: 0,
          y: 0,
          width: 200,
          height: 150,
          backgroundColor: getNoteBackground(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set({ notes: [...notes, newNote] });
        saveToIndexedDB();
      },

      updateNote: (id, updates) => {
        const { notes, saveToIndexedDB } = get();
        set({
          notes: notes.map(note =>
            note.id === id ? { ...note, ...updates, updatedAt: new Date() } : note
          )
        });
        saveToIndexedDB();
      },

      deleteNote: (id) => {
        const { notes, saveToIndexedDB } = get();
        set({ notes: notes.filter(note => note.id !== id) });
        saveToIndexedDB();
      },

      toggleCardSelection: (id, isMultiSelect) => {
        const { selectedCardIds, cards } = get();
        
        if (isMultiSelect) {
          const newSelectedIds = selectedCardIds.includes(id)
            ? selectedCardIds.filter(cid => cid !== id)
            : [...selectedCardIds, id];
          
          set({
            selectedCardIds: newSelectedIds,
            cards: cards.map(card => ({
              ...card,
              selected: newSelectedIds.includes(card.id)
            }))
          });
        } else {
          const newSelectedIds = selectedCardIds.includes(id) && selectedCardIds.length === 1
            ? []
            : [id];
          
          set({
            selectedCardIds: newSelectedIds,
            cards: cards.map(card => ({
              ...card,
              selected: newSelectedIds.includes(card.id)
            }))
          });
        }
      },

      clearSelection: () => {
        const { cards } = get();
        set({
          selectedCardIds: [],
          cards: cards.map(card => ({ ...card, selected: false }))
        });
      },

      setSelectedTag: (tagId) => {
        set({ selectedTagId: tagId });
      },
    }),
    {
      name: 'inspiration-board-storage',
      partialize: (state) => ({
        cards: state.cards,
        tags: state.tags,
        notes: state.notes,
      }),
    }
  )
);

export default useBoardStore;

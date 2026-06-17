import { create } from 'zustand';
import type { Note } from '../types';
import {
  getAllNotes,
  getNoteById,
  createNote as createNoteStorage,
  updateNote as updateNoteStorage,
  deleteNote as deleteNoteStorage,
  getAllTags
} from '../NoteStorageModule/storage';
import { searchNotes } from '../SearchModule/searchEngine';

interface NoteState {
  notes: Note[];
  allTags: string[];
  selectedNoteId: string | null;
  searchKeyword: string;
  selectedTag: string | null;
  currentView: 'editor' | 'statistics';

  loadNotes: () => void;
  selectNote: (id: string | null) => void;
  createNote: () => Note;
  saveNote: (id: string, data: Partial<Omit<Note, 'id' | 'createdAt'>>) => void;
  removeNote: (id: string) => void;
  setSearchKeyword: (keyword: string) => void;
  setSelectedTag: (tag: string | null) => void;
  setCurrentView: (view: 'editor' | 'statistics') => void;
  getFilteredNotes: () => Note[];
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  allTags: [],
  selectedNoteId: null,
  searchKeyword: '',
  selectedTag: null,
  currentView: 'editor',

  loadNotes: () => {
    const notes = getAllNotes();
    const allTags = getAllTags();
    set({ notes, allTags });
  },

  selectNote: (id) => {
    set({ selectedNoteId: id, currentView: 'editor' });
  },

  createNote: () => {
    const newNote = createNoteStorage({
      title: '无标题笔记',
      content: '',
      tags: []
    });
    const notes = getAllNotes();
    const allTags = getAllTags();
    set({ notes, allTags, selectedNoteId: newNote.id, currentView: 'editor' });
    return newNote;
  },

  saveNote: (id, data) => {
    updateNoteStorage(id, data);
    const notes = getAllNotes();
    const allTags = getAllTags();
    set({ notes, allTags });
  },

  removeNote: (id) => {
    deleteNoteStorage(id);
    const notes = getAllNotes();
    const allTags = getAllTags();
    const { selectedNoteId } = get();
    set({
      notes,
      allTags,
      selectedNoteId: selectedNoteId === id ? null : selectedNoteId
    });
  },

  setSearchKeyword: (keyword) => {
    set({ searchKeyword: keyword });
  },

  setSelectedTag: (tag) => {
    set({ selectedTag: tag });
  },

  setCurrentView: (view) => {
    set({ currentView: view });
  },

  getFilteredNotes: () => {
    const { notes, searchKeyword, selectedTag } = get();
    let result = notes;

    if (selectedTag) {
      result = result.filter(note => note.tags.includes(selectedTag));
    }

    if (searchKeyword.trim()) {
      const matchedIds = searchNotes(searchKeyword, result);
      result = result.filter(note => matchedIds.includes(note.id));
    }

    return result;
  }
}));

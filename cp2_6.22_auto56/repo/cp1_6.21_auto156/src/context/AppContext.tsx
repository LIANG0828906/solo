import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Material, Draft } from '../types';
import { materialApi, draftApi } from '../api';

interface AppState {
  materials: Material[];
  currentDraft: Draft;
  addMaterial: (material: Omit<Material, 'id' | 'createdAt'>, imageFile?: File) => Promise<void>;
  updateMaterial: (id: string, data: Partial<Material>, imageFile?: File) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  pasteMaterial: (material: Material) => void;
  saveDraft: (content: string) => Promise<void>;
  insertCallback: ((material: Material) => void) | null;
  setInsertCallback: (cb: ((material: Material) => void) | null) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [currentDraft, setCurrentDraft] = useState<Draft>({ id: 'current', content: '', updatedAt: '' });
  const insertCallbackRef = useRef<((material: Material) => void) | null>(null);

  useEffect(() => {
    materialApi.getAll().then((res) => setMaterials(res.data)).catch(() => {});
    draftApi.get().then((res) => setCurrentDraft(res.data)).catch(() => {});
  }, []);

  const addMaterial = useCallback(async (data: Omit<Material, 'id' | 'createdAt'>, imageFile?: File) => {
    if (imageFile) {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('content', data.content);
      formData.append('type', data.type);
      formData.append('image', imageFile);
      const res = await materialApi.createWithImage(formData);
      setMaterials((prev) => [res.data, ...prev]);
    } else {
      const res = await materialApi.create(data);
      setMaterials((prev) => [res.data, ...prev]);
    }
  }, []);

  const updateMaterial = useCallback(async (id: string, data: Partial<Material>, imageFile?: File) => {
    if (imageFile) {
      const formData = new FormData();
      if (data.title) formData.append('title', data.title);
      if (data.content) formData.append('content', data.content);
      if (data.type) formData.append('type', data.type);
      formData.append('image', imageFile);
      const res = await materialApi.createWithImage(formData);
      setMaterials((prev) => prev.map((m) => (m.id === id ? res.data : m)));
    } else {
      const res = await materialApi.update(id, data);
      setMaterials((prev) => prev.map((m) => (m.id === id ? res.data : m)));
    }
  }, []);

  const deleteMaterial = useCallback(async (id: string) => {
    await materialApi.delete(id);
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const pasteMaterial = useCallback((_material: Material) => {
    // insertion handled via insertCallback from DraftEditor
  }, []);

  const saveDraft = useCallback(async (content: string) => {
    const res = await draftApi.save(content);
    setCurrentDraft(res.data);
  }, []);

  const setInsertCallback = useCallback((cb: ((material: Material) => void) | null) => {
    insertCallbackRef.current = cb;
  }, []);

  const value: AppState = {
    materials,
    currentDraft,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    pasteMaterial: (material: Material) => {
      if (insertCallbackRef.current) {
        insertCallbackRef.current(material);
      }
    },
    saveDraft,
    insertCallback: insertCallbackRef.current,
    setInsertCallback,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

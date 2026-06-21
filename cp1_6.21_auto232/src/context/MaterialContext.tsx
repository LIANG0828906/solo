import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { Material, Category } from './types';

interface MaterialContextType {
  materials: Material[];
  categories: Category[];
  selectedCategory: string;
  searchQuery: string;
  loading: boolean;
  setSelectedCategory: (id: string) => void;
  setSearchQuery: (query: string) => void;
  fetchMaterials: () => Promise<void>;
  getMaterialById: (id: string) => Material | undefined;
  updateMaterial: (id: string, data: Partial<Material>) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  addMaterial: (data: Partial<Material>) => Promise<void>;
}

const MaterialContext = createContext<MaterialContextType | undefined>(undefined);

export function MaterialProvider({ children }: { children: ReactNode }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      
      const res = await fetch(`/api/materials?${params.toString()}`);
      const data = await res.json();
      setMaterials(data);
    } catch (error) {
      console.error('获取材料列表失败:', error);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMaterials();
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery, fetchMaterials]);

  useEffect(() => {
    fetch('/api/materials/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error('获取分类失败:', err));
  }, []);

  const getMaterialById = useCallback((id: string) => {
    return materials.find(m => m.id === id);
  }, [materials]);

  const updateMaterial = useCallback(async (id: string, data: Partial<Material>) => {
    const res = await fetch(`/api/materials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      fetchMaterials();
    }
  }, [fetchMaterials]);

  const deleteMaterial = useCallback(async (id: string) => {
    const res = await fetch(`/api/materials/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      fetchMaterials();
    }
  }, [fetchMaterials]);

  const addMaterial = useCallback(async (data: Partial<Material>) => {
    const res = await fetch('/api/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      fetchMaterials();
    }
  }, [fetchMaterials]);

  return (
    <MaterialContext.Provider value={{
      materials,
      categories,
      selectedCategory,
      searchQuery,
      loading,
      setSelectedCategory,
      setSearchQuery,
      fetchMaterials,
      getMaterialById,
      updateMaterial,
      deleteMaterial,
      addMaterial,
    }}>
      {children}
    </MaterialContext.Provider>
  );
}

export function useMaterials() {
  const context = useContext(MaterialContext);
  if (!context) {
    throw new Error('useMaterials must be used within a MaterialProvider');
  }
  return context;
}

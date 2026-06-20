import { create } from 'zustand';
import type { Collection } from '@/types';
import { collectionStore } from '@/data/collectionStore';

interface CollectionState {
  collections: Collection[];
  loading: boolean;
  loadAll: () => Promise<void>;
  addCollection: (data: Omit<Collection, 'id' | 'sortOrder' | 'createdAt'>) => Promise<Collection>;
  updateCollection: (id: string, data: Partial<Collection>) => Promise<Collection | null>;
  deleteCollection: (id: string) => Promise<boolean>;
  reorder: (orderedIds: string[]) => Promise<void>;
  toggleTea: (collectionId: string, teaId: string) => Promise<Collection | null>;
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  collections: [],
  loading: false,

  async loadAll() {
    set({ loading: true });
    const collections = await collectionStore.getAll();
    set({ collections, loading: false });
  },

  async addCollection(data) {
    const c = await collectionStore.add(data);
    await get().loadAll();
    return c;
  },

  async updateCollection(id, data) {
    const result = await collectionStore.update(id, data);
    await get().loadAll();
    return result;
  },

  async deleteCollection(id) {
    const ok = await collectionStore.delete(id);
    if (ok) await get().loadAll();
    return ok;
  },

  async reorder(orderedIds) {
    await collectionStore.reorder(orderedIds);
    await get().loadAll();
  },

  async toggleTea(collectionId, teaId) {
    const c = await collectionStore.getById(collectionId);
    if (!c) return null;
    const exists = c.teaIds.includes(teaId);
    const teaIds = exists
      ? c.teaIds.filter((id) => id !== teaId)
      : [...c.teaIds, teaId];
    return await get().updateCollection(collectionId, { teaIds });
  },
}));

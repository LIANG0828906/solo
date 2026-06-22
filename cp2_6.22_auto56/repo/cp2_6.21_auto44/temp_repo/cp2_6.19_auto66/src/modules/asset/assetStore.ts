import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Asset, AssetFormData } from '@/types';
import { saveAssetsToStorage, loadAssetsFromStorage } from '@/utils/storage';

interface AssetStore {
  assets: Asset[];
  addAsset: (assetData: AssetFormData) => void;
  updateAsset: (id: string, updates: Partial<AssetFormData>) => void;
  deleteAsset: (id: string) => void;
  loadFromStorage: () => void;
  getAssetById: (id: string) => Asset | undefined;
}

export const useAssetStore = create<AssetStore>((set, get) => ({
  assets: [],

  addAsset: (assetData) => {
    const newAsset: Asset = {
      ...assetData,
      id: uuidv4(),
      createdAt: Date.now(),
    };
    set((state) => {
      const updatedAssets = [newAsset, ...state.assets];
      saveAssetsToStorage(updatedAssets);
      return { assets: updatedAssets };
    });
  },

  updateAsset: (id, updates) => {
    set((state) => {
      const updatedAssets = state.assets.map((asset) =>
        asset.id === id ? { ...asset, ...updates } : asset
      );
      saveAssetsToStorage(updatedAssets);
      return { assets: updatedAssets };
    });
  },

  deleteAsset: (id) => {
    set((state) => {
      const updatedAssets = state.assets.filter((asset) => asset.id !== id);
      saveAssetsToStorage(updatedAssets);
      return { assets: updatedAssets };
    });
  },

  loadFromStorage: () => {
    const storedAssets = loadAssetsFromStorage();
    set({ assets: storedAssets });
  },

  getAssetById: (id) => {
    return get().assets.find((asset) => asset.id === id);
  },
}));

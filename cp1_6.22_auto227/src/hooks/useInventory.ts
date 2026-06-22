import { useState, useEffect, useCallback } from 'react';
import type { InventoryItem } from '../utils/types';
import { getInventory, addInventory, deleteInventory } from '../utils/api';

export function useInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInventory();
      setInventory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取库存失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshInventory();
  }, [refreshInventory]);

  const addItem = useCallback(async (item: Omit<InventoryItem, 'id' | 'createdAt'>) => {
    setLoading(true);
    setError(null);
    try {
      await addInventory(item);
      await refreshInventory();
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加食材失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshInventory]);

  const deleteItem = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteInventory(id);
      await refreshInventory();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除食材失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshInventory]);

  const searchInventory = useCallback((keyword: string) => {
    if (!keyword.trim()) {
      return inventory;
    }
    return inventory.filter((item) =>
      item.name.toLowerCase().includes(keyword.toLowerCase())
    );
  }, [inventory]);

  const sortByQuantity = useCallback(() => {
    return [...inventory].sort((a, b) => b.quantity - a.quantity);
  }, [inventory]);

  return {
    inventory,
    loading,
    error,
    addItem,
    deleteItem,
    refreshInventory,
    searchInventory,
    sortByQuantity,
  };
}

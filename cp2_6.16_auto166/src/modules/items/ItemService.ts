import { get, set, DB_KEYS } from '@/shared/utils/db';
import type { Item, ItemCategory } from '@/types';

export async function getAllItems(): Promise<Item[]> {
  const items = await get<Item[]>(DB_KEYS.items);
  return items ?? [];
}

export async function addItem(item: Item): Promise<void> {
  const items = await getAllItems();
  items.push(item);
  await set(DB_KEYS.items, items);
}

export async function updateItem(updated: Item): Promise<void> {
  const items = await getAllItems();
  const index = items.findIndex((i) => i.id === updated.id);
  if (index !== -1) {
    items[index] = updated;
    await set(DB_KEYS.items, items);
  }
}

export async function deleteItem(id: string): Promise<void> {
  const items = await getAllItems();
  const filtered = items.filter((i) => i.id !== id);
  await set(DB_KEYS.items, filtered);
}

export async function getItemsByCategory(category: ItemCategory): Promise<Item[]> {
  const items = await getAllItems();
  return items.filter((i) => i.category === category);
}

export async function getPublishedItems(): Promise<Item[]> {
  const items = await getAllItems();
  return items.filter((i) => i.isPublished && i.status === 'available');
}

export async function publishItem(id: string): Promise<void> {
  const items = await getAllItems();
  const index = items.findIndex((i) => i.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], isPublished: true, status: 'available' };
    await set(DB_KEYS.items, items);
  }
}

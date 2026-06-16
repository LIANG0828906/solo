import { get, set, del, keys } from 'idb-keyval';

export interface StickerData {
  id: string;
  name: string;
  imageData: string;
  createdAt: number;
  likes: number;
  isFavorited: boolean;
}

const STICKER_PREFIX = 'sticker_';
const FAVORITES_KEY = 'sticker_favorites';

function stickerKey(id: string): string {
  return STICKER_PREFIX + id;
}

export class GalleryManager {
  async saveSticker(sticker: StickerData): Promise<void> {
    await set(stickerKey(sticker.id), sticker);
  }

  async loadSticker(id: string): Promise<StickerData | undefined> {
    return await get<StickerData>(stickerKey(id));
  }

  async loadAllStickers(): Promise<StickerData[]> {
    const allKeys = await keys();
    const stickerKeys = allKeys.filter(k => String(k).startsWith(STICKER_PREFIX));
    const stickers: StickerData[] = [];
    for (const k of stickerKeys) {
      const s = await get<StickerData>(k);
      if (s) stickers.push(s);
    }
    return stickers;
  }

  async deleteSticker(id: string): Promise<void> {
    await del(stickerKey(id));
  }

  async toggleFavorite(id: string): Promise<StickerData | undefined> {
    const sticker = await this.loadSticker(id);
    if (!sticker) return undefined;
    sticker.isFavorited = !sticker.isFavorited;
    sticker.likes += sticker.isFavorited ? 1 : -1;
    if (sticker.likes < 0) sticker.likes = 0;
    await this.saveSticker(sticker);
    return sticker;
  }

  async searchStickers(query: string): Promise<StickerData[]> {
    const all = await this.loadAllStickers();
    const q = query.toLowerCase();
    return all.filter(s => s.name.toLowerCase().includes(q));
  }

  async getStickersSorted(sortBy: 'name' | 'createdAt', order: 'asc' | 'desc' = 'desc'): Promise<StickerData[]> {
    const all = await this.loadAllStickers();
    return all.sort((a, b) => {
      if (sortBy === 'name') {
        return order === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      return order === 'asc'
        ? a.createdAt - b.createdAt
        : b.createdAt - a.createdAt;
    });
  }
}

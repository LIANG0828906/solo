import { useStore } from '@/store';
import { BookShelf, Comment } from '@/types';

export interface CreateShelfData {
  name: string;
  description?: string;
  theme?: string;
  bookIds: string[];
  isPublic: boolean;
}

export const ShelfManager = {
  async createShelf(data: CreateShelfData): Promise<BookShelf> {
    if (!data.name.trim()) {
      throw new Error('请输入书单名称');
    }
    const store = useStore.getState();
    const finalData = {
      ...data,
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      theme: data.theme?.trim() || undefined,
    };
    return store.createShelf(finalData);
  },

  async updateShelf(id: string, data: CreateShelfData): Promise<BookShelf> {
    if (!data.name.trim()) {
      throw new Error('请输入书单名称');
    }
    const store = useStore.getState();
    return store.updateShelf(id, data);
  },

  async deleteShelf(id: string): Promise<void> {
    const store = useStore.getState();
    await store.deleteShelf(id);
  },

  generateMosaicCovers(coverUrls: string[]): string[] {
    const covers = coverUrls.filter(Boolean);
    const result: string[] = [];
    const defaults = [
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&h=600&fit=crop',
    ];
    const all = [...covers, ...defaults];
    const seen = new Set<string>();
    for (const url of all) {
      if (!seen.has(url)) {
        seen.add(url);
        result.push(url);
        if (result.length >= 4) break;
      }
    }
    return result;
  },

  shuffleMosaicCovers(covers: string[], iterations: number = 1): string[] {
    const arr = [...covers];
    for (let n = 0; n < iterations; n++) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }
    return arr;
  },

  generateShareLink(shelfId: string): string {
    const store = useStore.getState();
    return store.generateShareLink(shelfId);
  },

  getShareEncodedId(shelfId: string): string {
    const encoder = new TextEncoder();
    const data = encoder.encode(shelfId);
    let binary = '';
    data.forEach((b) => { binary += String.fromCharCode(b); });
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },

  decodeShareId(encoded: string): string {
    try {
      const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
      const padLen = (4 - (padded.length % 4)) % 4;
      const binary = atob(padded + '='.repeat(padLen));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    } catch {
      return encoded;
    }
  },

  async likeShelf(shelfId: string, fromShare: boolean = false): Promise<void> {
    const store = useStore.getState();
    await store.likeShelf(shelfId, fromShare);
  },

  async addComment(
    shelfId: string,
    username: string,
    content: string,
    fromShare: boolean = false
  ): Promise<Comment> {
    if (!username.trim()) {
      throw new Error('请输入您的昵称');
    }
    if (!content.trim()) {
      throw new Error('请输入留言内容');
    }
    const store = useStore.getState();
    return store.addComment(shelfId, username.trim(), content.trim(), fromShare);
  },

  async fetchSharedShelf(encodedId: string): Promise<void> {
    const store = useStore.getState();
    await store.fetchSharedShelf(encodedId);
  },

  exportShelfAsText(shelf: BookShelf & { books?: any[] }): string {
    const lines: string[] = [];
    lines.push(`📚 书单：${shelf.name}`);
    if (shelf.description) lines.push(shelf.description);
    lines.push(`创建者：${(shelf as any).owner || '匿名用户'}`);
    lines.push(`共 ${shelf.bookIds.length} 本书 · ❤️ ${shelf.likes}`);
    lines.push('');
    lines.push('─── 书单内容 ───');
    (shelf.books || []).forEach((b, i) => {
      lines.push(`${i + 1}. 《${b.title}》 - ${b.authors?.join(', ') || '未知作者'}`);
      if (b.description) {
        lines.push(`   ${b.description.slice(0, 50)}${b.description.length > 50 ? '...' : ''}`);
      }
      lines.push('');
    });
    return lines.join('\n');
  },
};

export default ShelfManager;

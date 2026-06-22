import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { interactionService } from './interactionService';

export interface CanvasComponent {
  id: string;
  type: string;
  componentId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  color: string;
  zIndex: number;
}

export interface CanvasText {
  id: string;
  content: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
}

export interface Meme {
  id: string;
  imageUrl: string;
  author: string;
  authorAvatar: string;
  likes: number;
  commentsCount: number;
  tags: string[];
  description: string;
  createdAt: number;
  components: CanvasComponent[];
  text: CanvasText | null;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const avatarColors = ['#FF80AB', '#64B5F6', '#81C784', '#FFB74D', '#BA68C8', '#4DD0E1'];

let memes: Meme[] = [];

function generateMockMemes(): Meme[] {
  const mockData = [
    { author: '小明', desc: '今天也要开心鸭！', tags: ['开心', '日常'] },
    { author: '表情包大师', desc: '无语瞬间', tags: ['无语', '搞笑'] },
    { author: '小可爱', desc: '撒娇专用', tags: ['可爱', '撒娇'] },
    { author: '打工人', desc: '搬砖的一天', tags: ['打工', '奋斗'] },
    { author: '摸鱼王', desc: '下班倒计时', tags: ['摸鱼', '下班'] },
    { author: '吃货', desc: '干饭人', tags: ['干饭', '美食'] },
    { author: '社恐患者', desc: '社交困难', tags: ['社恐', '日常'] },
    { author: '熬夜冠军', desc: '修仙中', tags: ['熬夜', '修仙'] }
  ];

  return mockData.map((item, idx) => {
    const avatarIdx = idx % avatarColors.length;
    const id = uuidv4();
    return {
      id,
      imageUrl: '',
      author: item.author,
      authorAvatar: `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(item.author)}&backgroundColor=${avatarColors[avatarIdx].replace('#', '')}`,
      likes: Math.floor(Math.random() * 100) + 10,
      commentsCount: Math.floor(Math.random() * 20),
      tags: item.tags,
      description: item.desc,
      createdAt: Date.now() - idx * 3600000,
      components: [],
      text: null
    };
  });
}

memes = generateMockMemes();

export const galleryService = {
  getMemes(page: number = 1, limit: number = 10): { memes: Meme[]; hasMore: boolean } {
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = memes.slice(start, end);

    const enriched = paginated.map((meme) => ({
      ...meme,
      likes: interactionService.getLikesCount(meme.id) || meme.likes,
      commentsCount: interactionService.getCommentsCount(meme.id) || meme.commentsCount
    }));

    return {
      memes: enriched.sort((a, b) => b.createdAt - a.createdAt),
      hasMore: end < memes.length
    };
  },

  getMemeById(id: string): Meme | null {
    const meme = memes.find((m) => m.id === id);
    if (meme) {
      return {
        ...meme,
        likes: interactionService.getLikesCount(id) || meme.likes,
        commentsCount: interactionService.getCommentsCount(id) || meme.commentsCount
      };
    }
    return null;
  },

  createMeme(
    imageFilename: string,
    author: string,
    tags: string[],
    description: string,
    components: CanvasComponent[],
    text: CanvasText | null
  ): Meme {
    const meme: Meme = {
      id: uuidv4(),
      imageUrl: imageFilename ? `/uploads/${imageFilename}` : '',
      author,
      authorAvatar: `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(author)}&backgroundColor=FF80AB`,
      likes: 0,
      commentsCount: 0,
      tags,
      description,
      createdAt: Date.now(),
      components,
      text
    };
    memes.unshift(meme);
    return meme;
  },

  deleteMeme(id: string): boolean {
    const idx = memes.findIndex((m) => m.id === id);
    if (idx !== -1) {
      memes.splice(idx, 1);
      return true;
    }
    return false;
  },

  getUploadsDir(): string {
    return uploadsDir;
  }
};

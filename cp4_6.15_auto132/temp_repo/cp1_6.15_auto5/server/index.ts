import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import axios from 'axios';
import type { RecipeCard, User, Annotation } from '../src/types';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(express.json());

interface BoardState {
  cards: RecipeCard[];
  users: Map<string, User>;
}

const boards = new Map<string, BoardState>();

const getBoard = (boardId: string): BoardState => {
  if (!boards.has(boardId)) {
    boards.set(boardId, {
      cards: [],
      users: new Map(),
    });
  }
  return boards.get(boardId)!;
};

const DEMO_RECIPES: RecipeCard[] = [
  {
    id: 'demo-1',
    title: '麻婆豆腐',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('麻婆豆腐 四川美食 摄影') + '&image_size=square_hd',
    cuisine: '川菜',
    url: '#',
    order: 0,
    createdAt: Date.now() - 86400000,
    annotations: [
      {
        id: 'anno-1',
        content: '可以用嫩豆腐代替老豆腐，口感更滑嫩',
        author: '妈妈',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
        createdAt: Date.now() - 3600000,
      },
    ],
  },
  {
    id: 'demo-2',
    title: '白切鸡',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('白切鸡 粤菜 美食摄影') + '&image_size=square_hd',
    cuisine: '粤菜',
    url: '#',
    order: 1,
    createdAt: Date.now() - 72000000,
    annotations: [],
  },
  {
    id: 'demo-3',
    title: '三文鱼刺身',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('三文鱼刺身 日料 美食摄影') + '&image_size=square_hd',
    cuisine: '日料',
    url: '#',
    order: 2,
    createdAt: Date.now() - 36000000,
    annotations: [],
  },
  {
    id: 'demo-4',
    title: '法式焦糖布丁',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('法式焦糖布丁 甜点 美食摄影') + '&image_size=square_hd',
    cuisine: '甜点',
    url: '#',
    order: 3,
    createdAt: Date.now() - 18000000,
    annotations: [],
  },
  {
    id: 'demo-5',
    title: '意大利面',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('意大利番茄肉酱面 美食摄影') + '&image_size=square_hd',
    cuisine: '意餐',
    url: '#',
    order: 4,
    createdAt: Date.now() - 7200000,
    annotations: [],
  },
];

app.post('/api/scrape', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.json({ success: false, error: 'URL 不能为空' });
    }

    try {
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const html = response.data;

      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
      const title = ogTitleMatch?.[1] || titleMatch?.[1] || '未命名食谱';

      const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
      const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
      const coverImage = ogImageMatch?.[1] || twitterImageMatch?.[1] || '';

      if (title && coverImage) {
        return res.json({
          success: true,
          data: {
            title: title.trim(),
            coverImage: coverImage.trim(),
          },
        });
      }

      throw new Error('无法提取足够信息');
    } catch (scrapeError) {
      console.log('Scraping failed, returning random demo recipe');
      const randomRecipe = DEMO_RECIPES[Math.floor(Math.random() * DEMO_RECIPES.length)];
      return res.json({
        success: true,
        data: {
          title: randomRecipe.title,
          coverImage: randomRecipe.coverImage,
        },
      });
    }
  } catch (error) {
    console.error('Scrape error:', error);
    res.json({ success: false, error: '抓取失败，请手动输入' });
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('board:join', ({ boardId, user }: { boardId: string; user: User }) => {
    const board = getBoard(boardId);

    if (board.users.size === 0 && board.cards.length === 0) {
      board.cards = [...DEMO_RECIPES];
    }

    const existingUser = Array.from(board.users.values()).find(u => u.name === user.name);
    if (existingUser) {
      user.id = existingUser.id;
      user.avatar = existingUser.avatar;
    }

    board.users.set(socket.id, { ...user, id: socket.id });

    socket.join(boardId);

    socket.emit('board:state', {
      cards: board.cards,
      onlineCount: board.users.size,
    });

    socket.to(boardId).emit('user:joined', {
      user: { ...user, id: socket.id },
      onlineCount: board.users.size,
    });

    console.log(`User ${user.name} joined board ${boardId}, online: ${board.users.size}`);
  });

  socket.on('card:add', ({ boardId, card, user }: { boardId: string; card: RecipeCard; user: User }) => {
    const board = getBoard(boardId);
    board.cards.push(card);

    socket.to(boardId).emit('card:added', { card, user: { ...user, id: socket.id } });
    console.log(`Card added: ${card.title} by ${user.name}`);
  });

  socket.on('card:reorder', ({ boardId, cards, user }: { boardId: string; cards: RecipeCard[]; user: User }) => {
    const board = getBoard(boardId);
    board.cards = cards;

    socket.to(boardId).emit('card:reordered', { cards, user: { ...user, id: socket.id } });
    console.log(`Cards reordered by ${user.name}`);
  });

  socket.on('annotation:add', ({ boardId, cardId, annotation, user }: { boardId: string; cardId: string; annotation: Annotation; user: User }) => {
    const board = getBoard(boardId);
    const card = board.cards.find(c => c.id === cardId);
    if (card) {
      card.annotations.push(annotation);
    }

    socket.to(boardId).emit('annotation:added', {
      cardId,
      annotation,
      user: { ...user, id: socket.id },
    });
    console.log(`Annotation added to card ${cardId} by ${user.name}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    for (const [boardId, board] of boards.entries()) {
      const user = board.users.get(socket.id);
      if (user) {
        board.users.delete(socket.id);

        socket.to(boardId).emit('user:left', {
          user,
          onlineCount: board.users.size,
        });

        console.log(`User ${user.name} left board ${boardId}, online: ${board.users.size}`);

        if (board.users.size === 0) {
          board.cards = [];
          console.log(`Board ${boardId} is empty, resetting cards`);
        }
      }
    }
  });
});

const PORT = 3002;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🍳 Recipe Board WebSocket Server is ready`);
});

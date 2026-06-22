import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { collections, categories, type Collection } from './data/collections.js';

export interface ExhibitionItem {
  collectionId: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: number;
}

export interface Exhibition {
  id: string;
  name: string;
  description: string;
  items: ExhibitionItem[];
  createdAt: string;
}

export interface CreateExhibitionRequest {
  name: string;
  description: string;
  items: ExhibitionItem[];
}

const app: express.Application = express();
const PORT = process.env.PORT || 3001;

const exhibitions = new Map<string, Exhibition>();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get(
  '/api/collections',
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { category, search } = req.query;

      let filteredCollections: Collection[] = [...collections];

      if (typeof category === 'string' && category !== 'all') {
        filteredCollections = filteredCollections.filter(
          (item) => item.category === category,
        );
      }

      if (typeof search === 'string' && search.trim() !== '') {
        const searchLower = search.toLowerCase();
        filteredCollections = filteredCollections.filter(
          (item) =>
            item.name.toLowerCase().includes(searchLower) ||
            item.era.toLowerCase().includes(searchLower) ||
            item.description.toLowerCase().includes(searchLower) ||
            item.material.toLowerCase().includes(searchLower),
        );
      }

      res.status(200).json({
        success: true,
        data: filteredCollections,
        categories,
        total: filteredCollections.length,
      });
    } catch (error) {
      next(error);
    }
  },
);

app.post(
  '/api/exhibition',
  (req: Request<unknown, unknown, CreateExhibitionRequest>, res: Response, next: NextFunction): void => {
    try {
      const { name, description, items } = req.body;

      if (!name || !items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          success: false,
          error: '展览名称和展品列表不能为空',
        });
        return;
      }

      const validItems = items.filter((item) =>
        collections.some((c) => c.id === item.collectionId),
      );

      if (validItems.length === 0) {
        res.status(400).json({
          success: false,
          error: '请至少选择一个有效的藏品',
        });
        return;
      }

      const id = uuidv4();
      const exhibition: Exhibition = {
        id,
        name,
        description: description || '',
        items: validItems,
        createdAt: new Date().toISOString(),
      };

      exhibitions.set(id, exhibition);

      const shareUrl = `${req.protocol}://${req.get('host')}/exhibition/${id}`;

      res.status(201).json({
        success: true,
        data: {
          id,
          shareUrl,
          exhibition,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

app.get(
  '/api/exhibition/:id',
  (req: Request<{ id: string }>, res: Response, next: NextFunction): void => {
    try {
      const { id } = req.params;
      const exhibition = exhibitions.get(id);

      if (!exhibition) {
        res.status(404).json({
          success: false,
          error: '展览不存在或已过期',
        });
        return;
      }

      const itemsWithDetails = exhibition.items.map((item) => {
        const collection = collections.find((c) => c.id === item.collectionId);
        return {
          ...item,
          collection,
        };
      });

      res.status(200).json({
        success: true,
        data: {
          ...exhibition,
          items: itemsWithDetails,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

app.get(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    });
  },
);

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  });
});

const server = app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;

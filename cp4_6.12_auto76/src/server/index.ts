import express from 'express';
import cors from 'cors';
import type { StoreData, Product, LayoutComponent } from '../types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let storeData: StoreData = {
  id: 'default-store',
  name: '我的店铺',
  components: [],
};

const mockProducts: Product[] = [
  {
    id: 'p1',
    name: '时尚休闲T恤',
    price: 99,
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
  },
  {
    id: 'p2',
    name: '精致手提包',
    price: 299,
    imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop',
  },
  {
    id: 'p3',
    name: '运动跑步鞋',
    price: 399,
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
  },
  {
    id: 'p4',
    name: '简约手表',
    price: 599,
    imageUrl: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop',
  },
  {
    id: 'p5',
    name: '太阳眼镜',
    price: 199,
    imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop',
  },
  {
    id: 'p6',
    name: '时尚牛仔裤',
    price: 259,
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop',
  },
];

app.get('/api/store', (_req, res) => {
  res.json(storeData);
});

app.put('/api/store', (req, res) => {
  const { components, name } = req.body as Partial<StoreData>;
  if (components !== undefined) {
    storeData = {
      ...storeData,
      components: components.map((c, i) => ({ ...c, position: i })) as LayoutComponent[],
    };
  }
  if (name !== undefined) {
    storeData = { ...storeData, name };
  }
  res.json({ success: true, data: storeData });
});

app.get('/api/products', (_req, res) => {
  res.json(mockProducts);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

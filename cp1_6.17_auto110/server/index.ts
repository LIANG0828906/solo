import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

interface Track {
  number: number;
  title: string;
}

interface RecordItem {
  id: string;
  coverUrl: string;
  title: string;
  artist: string;
  year: number;
  genre: string;
  price: number;
  stock: number;
  tracks: Track[];
}

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let records: RecordItem[] = [
  {
    id: '1',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vintage%20jazz%20vinyl%20record%20album%20cover%20warm%20tones&image_size=square_hd',
    title: 'Kind of Blue',
    artist: 'Miles Davis',
    year: 1959,
    genre: '爵士',
    price: 298.00,
    stock: 25,
    tracks: [
      { number: 1, title: 'So What' },
      { number: 2, title: 'Freddie Freeloader' },
      { number: 3, title: 'Blue in Green' },
      { number: 4, title: 'All Blues' },
      { number: 5, title: 'Flamenco Sketches' }
    ]
  },
  {
    id: '2',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=classic%20rock%20album%20cover%20dark%20psychedelic%20art&image_size=square_hd',
    title: 'The Dark Side of the Moon',
    artist: 'Pink Floyd',
    year: 1973,
    genre: '摇滚',
    price: 358.00,
    stock: 18,
    tracks: [
      { number: 1, title: 'Speak to Me' },
      { number: 2, title: 'Breathe' },
      { number: 3, title: 'On the Run' },
      { number: 4, title: 'Time' },
      { number: 5, title: 'Money' },
      { number: 6, title: 'Us and Them' }
    ]
  },
  {
    id: '3',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=electronic%20music%20album%20cover%20neon%20synthwave%20futuristic&image_size=square_hd',
    title: 'Random Access Memories',
    artist: 'Daft Punk',
    year: 2013,
    genre: '电子',
    price: 328.00,
    stock: 30,
    tracks: [
      { number: 1, title: 'Give Life Back to Music' },
      { number: 2, title: 'The Game of Love' },
      { number: 3, title: 'Giorgio by Moroder' },
      { number: 4, title: 'Instant Crush' },
      { number: 5, title: 'Lose Yourself to Dance' },
      { number: 6, title: 'Get Lucky' }
    ]
  },
  {
    id: '4',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=classical%20music%20album%20cover%20elegant%20orchestra%20gold&image_size=square_hd',
    title: 'Symphony No.9',
    artist: 'Beethoven',
    year: 1990,
    genre: '古典',
    price: 188.00,
    stock: 42,
    tracks: [
      { number: 1, title: 'Allegro ma non troppo' },
      { number: 2, title: 'Scherzo: Molto vivace' },
      { number: 3, title: 'Adagio molto e cantabile' },
      { number: 4, title: 'Presto - Ode to Joy' }
    ]
  },
  {
    id: '5',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=hip%20hop%20rap%20album%20cover%20urban%20street%20gritty&image_size=square_hd',
    title: 'Illmatic',
    artist: 'Nas',
    year: 1994,
    genre: '嘻哈',
    price: 268.00,
    stock: 15,
    tracks: [
      { number: 1, title: 'N.Y. State of Mind' },
      { number: 2, title: 'Life\'s a Bitch' },
      { number: 3, title: 'The World Is Yours' },
      { number: 4, title: 'Halftime' },
      { number: 5, title: 'Memory Lane' }
    ]
  },
  {
    id: '6',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=soul%20music%20album%20cover%20vintage%20warm%20motown&image_size=square_hd',
    title: 'What\'s Going On',
    artist: 'Marvin Gaye',
    year: 1971,
    genre: '灵魂乐',
    price: 288.00,
    stock: 20,
    tracks: [
      { number: 1, title: 'What\'s Going On' },
      { number: 2, title: 'What\'s Happening Brother' },
      { number: 3, title: 'Flyin\' High' },
      { number: 4, title: 'Save the Children' },
      { number: 5, title: 'Mercy Mercy Me' }
    ]
  }
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

app.get('/api/records', async (_req, res) => {
  await delay(300);
  res.json(records);
});

app.get('/api/records/:id', async (req, res) => {
  await delay(300);
  const record = records.find(r => r.id === req.params.id);
  if (!record) {
    res.status(404).json({ error: 'Record not found' });
    return;
  }
  res.json(record);
});

app.post('/api/records', async (req, res) => {
  await delay(300);
  try {
    const { coverUrl, title, artist, year, genre, price, stock, tracks } = req.body;
    if (!title || !artist || price === undefined || stock === undefined) {
      res.status(400).json({ error: '缺少必填字段' });
      return;
    }
    const newRecord: RecordItem = {
      id: uuidv4(),
      coverUrl: coverUrl || '',
      title,
      artist,
      year: year || 2024,
      genre: genre || '摇滚',
      price: Number(price),
      stock: Number(stock),
      tracks: tracks || []
    };
    records.push(newRecord);
    res.status(201).json(newRecord);
  } catch {
    res.status(500).json({ error: '创建唱片失败' });
  }
});

app.put('/api/records/:id', async (req, res) => {
  await delay(300);
  try {
    const index = records.findIndex(r => r.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }
    records[index] = { ...records[index], ...req.body, id: records[index].id };
    res.json(records[index]);
  } catch {
    res.status(500).json({ error: '更新唱片失败' });
  }
});

app.delete('/api/records/:id', async (req, res) => {
  await delay(300);
  const index = records.findIndex(r => r.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Record not found' });
    return;
  }
  records.splice(index, 1);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

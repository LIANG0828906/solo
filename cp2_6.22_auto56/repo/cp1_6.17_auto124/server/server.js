import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const initialSamples = [
  {
    id: 'init-1',
    lat: 39.9042,
    lng: 116.4074,
    name: '天安门广场',
    soundType: 'voice',
    recordedAt: '2025-01-15T09:30:00Z',
    volume: 75,
    description: '广场上游人的交谈声与远处车流交织',
  },
  {
    id: 'init-2',
    lat: 39.9163,
    lng: 116.3972,
    name: '北海公园湖畔',
    soundType: 'bird',
    recordedAt: '2025-01-15T07:00:00Z',
    volume: 40,
    description: '清晨湖边水鸟的啼叫与柳枝摇曳声',
  },
  {
    id: 'init-3',
    lat: 39.9289,
    lng: 116.3883,
    name: '什刹海巷道',
    soundType: 'wind',
    recordedAt: '2025-01-14T16:00:00Z',
    volume: 55,
    description: '穿胡同而过的晚风夹杂着树叶沙沙声',
  },
  {
    id: 'init-4',
    lat: 39.9343,
    lng: 116.4235,
    name: '东直门立交桥',
    soundType: 'traffic',
    recordedAt: '2025-01-14T08:15:00Z',
    volume: 85,
    description: '早高峰车流喇叭声与引擎轰鸣',
  },
  {
    id: 'init-5',
    lat: 39.8963,
    lng: 116.3912,
    name: '前门大街雨夜',
    soundType: 'rain',
    recordedAt: '2025-01-13T22:30:00Z',
    volume: 60,
    description: '细雨打在青砖路上的清脆声响',
  },
];

const soundIcons = {
  rain: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0984E3"><path d="M12 2C9.24 2 7 4.24 7 7h1.5C8.5 5.07 10.07 3.5 12 3.5s3.5 1.57 3.5 3.5H17c0-2.76-2.24-5-5-5zm0 4c-1.1 0-2 .9-2 2h4c0-1.1-.9-2-2-2zm-4 8h1v5H8v-5zm3 0h1v5h-1v-5zm3 0h1v5h-1v-5zm3 0h1v5h-1v-5zM6 9h12v2H6z"/></svg>',
  traffic: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FDCB6E"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>',
  bird: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#00B894"><path d="M16.5 6c-1.74 0-3.41.81-4.5 2.09C10.91 6.81 9.24 6 7.5 6 4.42 6 2 8.42 2 11.5c0 3.78 3.4 6.86 8.55 11.54L12 24.26l1.45-1.32C18.6 18.22 22 15.14 22 11.5 22 8.42 19.58 6 16.5 6zm-4.4 15.55l-.1.1-.1-.1C7.14 16.24 4 13.39 4 11.5 4 9.5 5.5 8 7.5 8c1.54 0 3.04.99 3.57 2.36h1.87C13.46 8.99 14.96 8 16.5 8c2 0 3.5 1.5 3.5 3.5 0 1.89-3.14 4.74-7.9 10.05z"/></svg>',
  wind: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#6C5CE7"><path d="M14.5 17c0 1.65-1.35 3-3 3s-3-1.35-3-3h2c0 .55.45 1 1 1s1-.45 1-1-.45-1-1-1H2v-2h9.5c1.65 0 3 1.35 3 3zM19 6.5C19 4.57 17.43 3 15.5 3S12 4.57 12 6.5h2c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S16.33 8 15.5 8H2v2h13.5c1.93 0 3.5-1.57 3.5-3.5zm-.5 4.5H2v2h16.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5H15c0 1.93 1.57 3.5 3.5 3.5s3.5-1.57 3.5-3.5-1.57-3.5-3.5-3.5z"/></svg>',
  voice: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#E17055"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 3-2.54 5.1-5 5.1S7 14 7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-2z"/></svg>',
};

app.get('/api/initData', (_req, res) => {
  res.json({ samples: initialSamples });
});

app.get('/api/soundIcons', (_req, res) => {
  res.json(soundIcons);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Sound Map API server running on http://localhost:${PORT}`);
});

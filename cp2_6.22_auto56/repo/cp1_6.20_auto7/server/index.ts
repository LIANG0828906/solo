import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import type { Demo, Feedback, CrashReport, HeatmapPoint, WebSocketMessage } from '../src/client/types';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json({ limit: '50mb' }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

interface DataStore {
  demos: Map<string, Demo>;
  feedbacks: Map<string, Feedback[]>;
  crashReports: Map<string, CrashReport[]>;
  heatmapData: Map<string, HeatmapPoint[]>;
  connections: Map<string, Set<WebSocket>>;
}

const store: DataStore = {
  demos: new Map(),
  feedbacks: new Map(),
  crashReports: new Map(),
  heatmapData: new Map(),
  connections: new Map()
};

const sampleCoverImage = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pixel%20art%20game%20cover%20dark%20fantasy%20style&image_size=square_hd';
const sampleVideo = 'https://www.w3schools.com/html/mov_bbb.mp4';

const sampleDemo1: Demo = {
  id: uuidv4(),
  title: '暗影王国',
  description: '一款像素风格的动作冒险游戏，探索被黑暗笼罩的神秘王国，解开古老的诅咒。游戏融合了魂系战斗与银河恶魔城的探索元素。',
  coverImage: sampleCoverImage,
  videoUrl: sampleVideo,
  createdAt: Date.now() - 86400000 * 3,
  likes: 156,
  dislikes: 12,
  feedbackCount: 45,
  crashCount: 3
};

const sampleDemo2: Demo = {
  id: uuidv4(),
  title: '星际旅人',
  description: '科幻题材的 Roguelike 太空探索游戏。每一次冒险都是独特的，随机生成的星系、行星和事件等待着你去发现。',
  coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=space%20exploration%20game%20cover%20sci%20fi%20nebula&image_size=square_hd',
  videoUrl: sampleVideo,
  createdAt: Date.now() - 86400000 * 7,
  likes: 289,
  dislikes: 23,
  feedbackCount: 78,
  crashCount: 5
};

const sampleDemo3: Demo = {
  id: uuidv4(),
  title: '幻境守护者',
  description: '塔防与卡牌策略的完美结合。收集强大的卡牌，建造防御工事，守护你的梦境世界不被噩梦侵蚀。',
  coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fantasy%20tower%20defense%20game%20cover%20magical%20forest&image_size=square_hd',
  videoUrl: sampleVideo,
  createdAt: Date.now() - 86400000 * 14,
  likes: 412,
  dislikes: 18,
  feedbackCount: 105,
  crashCount: 2
};

store.demos.set(sampleDemo1.id, sampleDemo1);
store.demos.set(sampleDemo2.id, sampleDemo2);
store.demos.set(sampleDemo3.id, sampleDemo3);

store.feedbacks.set(sampleDemo1.id, []);
store.feedbacks.set(sampleDemo2.id, []);
store.feedbacks.set(sampleDemo3.id, []);

store.crashReports.set(sampleDemo1.id, []);
store.crashReports.set(sampleDemo2.id, []);
store.crashReports.set(sampleDemo3.id, []);

store.heatmapData.set(sampleDemo1.id, []);
store.heatmapData.set(sampleDemo2.id, []);
store.heatmapData.set(sampleDemo3.id, []);

const broadcast = (demoId: string, message: WebSocketMessage) => {
  const connections = store.connections.get(demoId);
  if (connections) {
    const messageStr = JSON.stringify(message);
    connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }

  const allConnections = wss.clients;
  allConnections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN && ws !== undefined) {
      const messageStr = JSON.stringify(message);
      ws.send(messageStr);
    }
  });
};

app.get('/api/demos', (_req, res) => {
  const demos = Array.from(store.demos.values()).sort((a, b) => b.createdAt - a.createdAt);
  res.json(demos);
});

app.get('/api/demos/:id', (req, res) => {
  const demo = store.demos.get(req.params.id);
  if (!demo) {
    return res.status(404).json({ error: 'Demo not found' });
  }

  res.json({
    demo,
    feedbacks: store.feedbacks.get(req.params.id) || [],
    crashReports: store.crashReports.get(req.params.id) || [],
    heatmapData: store.heatmapData.get(req.params.id) || []
  });
});

app.post('/api/upload', (req, res) => {
  const { title, description, coverImage, videoUrl } = req.body;

  if (!title || !description || !coverImage || !videoUrl) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const id = uuidv4();
  const demo: Demo = {
    id,
    title,
    description,
    coverImage,
    videoUrl,
    createdAt: Date.now(),
    likes: 0,
    dislikes: 0,
    feedbackCount: 0,
    crashCount: 0
  };

  store.demos.set(id, demo);
  store.feedbacks.set(id, []);
  store.crashReports.set(id, []);
  store.heatmapData.set(id, []);

  res.json({
    demoId: id,
    url: `/demo/${id}`
  });
});

app.post('/api/feedback', (req, res) => {
  const { demoId, type, content } = req.body;

  if (!demoId || !type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const demo = store.demos.get(demoId);
  if (!demo) {
    return res.status(404).json({ error: 'Demo not found' });
  }

  const feedback: Feedback = {
    id: uuidv4(),
    demoId,
    type,
    content,
    timestamp: Date.now()
  };

  const feedbacks = store.feedbacks.get(demoId) || [];
  feedbacks.unshift(feedback);
  store.feedbacks.set(demoId, feedbacks);

  if (type === 'like') {
    demo.likes++;
  } else if (type === 'dislike') {
    demo.dislikes++;
  }
  if (type === 'text') {
    demo.feedbackCount++;
  }

  const heatmapPoints = store.heatmapData.get(demoId) || [];
  const heatmapPoint: HeatmapPoint = {
    x: Math.random() * 800,
    y: Math.random() * 300,
    value: type === 'like' ? 30 : type === 'dislike' ? 20 : 10,
    timestamp: Date.now()
  };
  heatmapPoints.push(heatmapPoint);
  store.heatmapData.set(demoId, heatmapPoints);

  broadcast(demoId, {
    type: 'feedback',
    payload: feedback
  });

  broadcast(demoId, {
    type: 'heatmap',
    payload: [heatmapPoint]
  });

  res.json({ success: true });
});

app.post('/api/crash', (req, res) => {
  const { demoId, message, stack } = req.body;

  if (!demoId || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const demo = store.demos.get(demoId);
  if (!demo) {
    return res.status(404).json({ error: 'Demo not found' });
  }

  const crashReport: CrashReport = {
    id: uuidv4(),
    demoId,
    message,
    stack,
    timestamp: Date.now()
  };

  const crashReports = store.crashReports.get(demoId) || [];
  crashReports.unshift(crashReport);
  store.crashReports.set(demoId, crashReports);

  demo.crashCount++;

  broadcast(demoId, {
    type: 'crash',
    payload: crashReport
  });

  res.json({ success: true });
});

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (data) => {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());

      if (message.type === 'subscribe') {
        const demoId = message.payload.demoId;
        if (!store.connections.has(demoId)) {
          store.connections.set(demoId, new Set());
        }
        store.connections.get(demoId)!.add(ws);
        console.log(`Subscribed to demo: ${demoId}`);

        const demo = store.demos.get(demoId);
        if (demo) {
          ws.send(JSON.stringify({
            type: 'init',
            payload: {
              demo,
              feedbacks: store.feedbacks.get(demoId) || [],
              crashReports: store.crashReports.get(demoId) || [],
              heatmapData: store.heatmapData.get(demoId) || []
            }
          }));
        }
      } else if (message.type === 'unsubscribe') {
        const demoId = message.payload.demoId;
        const connections = store.connections.get(demoId);
        if (connections) {
          connections.delete(ws);
          console.log(`Unsubscribed from demo: ${demoId}`);
        }
      }
    } catch (e) {
      console.error('Failed to parse WebSocket message:', e);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    store.connections.forEach((connections) => {
      connections.delete(ws);
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready on ws://localhost:${PORT}/ws`);
  console.log('Sample demo IDs:');
  console.log(`  - ${sampleDemo1.title}: /demo/${sampleDemo1.id}`);
  console.log(`  - ${sampleDemo2.title}: /demo/${sampleDemo2.id}`);
  console.log(`  - ${sampleDemo3.title}: /demo/${sampleDemo3.id}`);
});

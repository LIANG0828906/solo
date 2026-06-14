import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import net from 'net';

const app = express();
const START_PORT = 3001;

function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(startPort);
    });
    
    server.listen(startPort);
  });
}

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const specialties = [
  '油画', '水彩', '素描', '数字艺术', '雕塑',
  '版画', '陶艺', '摄影', '插画', '水墨'
];

const artistNames = [
  '李明远', '张雨晴', '王博文', '陈思涵', '刘子墨',
  '杨雅婷', '赵天宇', '黄诗琪', '周俊杰', '吴梦琪',
  '郑浩然', '孙婉清', '朱泽远', '徐若萱', '何晨光',
  '马晓薇', '林宇轩', '高梦瑶', '罗天翔', '谢梓涵'
];

const artistIntros = [
  '十年油画创作经验，擅长古典写实风格，作品多次入选国家级展览。',
  '当代水彩艺术家，以清新明快的色彩表现自然之美，教学耐心细致。',
  '中央美术学院毕业，专注于素描基础教学，帮助学生快速提升造型能力。',
  '数字艺术先锋，精通Procreate和Photoshop，带你进入数字绘画世界。',
  '青年雕塑家，作品融合传统与现代，注重形体感知与空间表达。',
  '版画艺术家，擅长木刻和铜版画，探索纸张与印痕的无限可能。',
  '陶艺匠人，热爱泥土的温度，专注于手工拉坯和釉料实验。',
  '艺术摄影师，擅长光影叙事，教你用镜头捕捉生活中的诗意瞬间。',
  '商业插画师，与多家知名品牌合作，分享插画创作的实战技巧。',
  '新水墨创作者，在传统笔墨中寻找当代表达，作品充满哲思。'
];

const avatarColors = [
  '#2C3E50', '#34495E', '#1ABC9C', '#16A085', '#27AE60',
  '#2980B9', '#8E44AD', '#E74C3C', '#D35400', '#F39C12'
];

const generateArtists = () => {
  return artistNames.map((name, i) => ({
    id: `artist-${i + 1}`,
    name,
    specialty: specialties[i % specialties.length],
    intro: artistIntros[i % artistIntros.length],
    avatarColor: avatarColors[i % avatarColors.length],
    avatar: name.charAt(0)
  }));
};

export const artists = generateArtists();

const generateSlots = () => {
  const slots = [];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  for (let artistIdx = 0; artistIdx < 20; artistIdx++) {
    const artistId = `artist-${artistIdx + 1}`;
    
    for (let dayOffset = -3; dayOffset < 60; dayOffset++) {
      const date = new Date(year, month, now.getDate() + dayOffset);
      const dayOfWeek = date.getDay();
      
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        const hours = [10, 11, 14, 15, 16];
        hours.forEach(hour => {
          if (Math.random() > 0.2) {
            slots.push({
              id: `slot-${uuidv4()}`,
              artistId,
              date: formatDate(date),
              startHour: hour,
              duration: 60,
              booked: Math.random() < 0.3
            });
          }
        });
      } else {
        const hours = [9, 10, 14, 15, 19];
        hours.forEach(hour => {
          if (Math.random() > 0.3) {
            slots.push({
              id: `slot-${uuidv4()}`,
              artistId,
              date: formatDate(date),
              startHour: hour,
              duration: 60,
              booked: Math.random() < 0.25
            });
          }
        });
      }
    }
  }
  return slots;
};

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export let slots = generateSlots();
export let bookings = [];

app.get('/api/artists', (req, res) => {
  setTimeout(() => {
    res.json(artists);
  }, 50);
});

app.get('/api/slots', (req, res) => {
  setTimeout(() => {
    const { artistId, date } = req.query;
    let filtered = slots;
    
    if (artistId) {
      filtered = filtered.filter(s => s.artistId === artistId);
    }
    if (date) {
      filtered = filtered.filter(s => s.date === date);
    }
    
    res.json(filtered);
  }, 80);
});

app.post('/api/booking', (req, res) => {
  setTimeout(() => {
    const { artistId, date, startHour, userName, userPhone } = req.body;
    
    const slotIndex = slots.findIndex(
      s => s.artistId === artistId && s.date === date && s.startHour === Number(startHour)
    );
    
    if (slotIndex === -1) {
      return res.status(404).json({ error: '该时段不存在，请重新选择' });
    }
    
    if (slots[slotIndex].booked) {
      const conflictSlot = slots[slotIndex];
      const suggestionHours = [
        conflictSlot.startHour - 1,
        conflictSlot.startHour + 1
      ].filter(h => {
        return slots.some(
          s => s.artistId === artistId && 
               s.date === date && 
               s.startHour === h && 
               !s.booked
        );
      });
      
      return res.status(409).json({
        error: '该时段已被预约，建议选择相邻时段',
        suggestion: suggestionHours.length > 0 
          ? `建议选择 ${suggestionHours.map(h => `${h}:00`).join(' 或 ')}`
          : '请选择其他日期或时段'
      });
    }
    
    slots[slotIndex].booked = true;
    
    const booking = {
      id: `booking-${uuidv4()}`,
      slotId: slots[slotIndex].id,
      artistId,
      date,
      startHour: Number(startHour),
      duration: slots[slotIndex].duration,
      userName,
      userPhone: userPhone || '',
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };
    
    bookings.push(booking);
    
    res.status(201).json(booking);
  }, 120);
});

app.get('/api/bookings', (req, res) => {
  setTimeout(() => {
    const sorted = [...bookings].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json(sorted);
  }, 50);
});

app.put('/api/bookings/:id/cancel', (req, res) => {
  setTimeout(() => {
    const { id } = req.params;
    const bookingIndex = bookings.findIndex(b => b.id === id);
    
    if (bookingIndex === -1) {
      return res.status(404).json({ error: '预约不存在' });
    }
    
    bookings[bookingIndex].status = 'cancelled';
    
    const slotIndex = slots.findIndex(s => s.id === bookings[bookingIndex].slotId);
    if (slotIndex !== -1) {
      slots[slotIndex].booked = false;
    }
    
    res.json(bookings[bookingIndex]);
  }, 80);
});

findAvailablePort(START_PORT).then((port) => {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`使用端口: ${port}${port !== START_PORT ? ` (${START_PORT} 端口被占用，已自动递增)` : ''}`);
    console.log(`预置 ${artists.length} 位艺术家，约 ${slots.length} 个时段`);
  });
}).catch((err) => {
  console.error('无法找到可用端口:', err);
  process.exit(1);
});

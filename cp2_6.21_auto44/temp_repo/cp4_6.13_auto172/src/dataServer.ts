import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const GRID_SIZE = 8;

const blockPhases: number[][] = [];
for (let i = 0; i < GRID_SIZE; i++) {
  blockPhases[i] = [];
  for (let j = 0; j < GRID_SIZE; j++) {
    blockPhases[i][j] = Math.random() * Math.PI * 2;
  }
}

function generateTrafficData(timeStr: string): number[][] {
  const blocks: number[][] = [];
  
  const timeParts = timeStr.split(':');
  const hour = parseInt(timeParts[0], 10);
  const minute = parseInt(timeParts[1], 10);
  const timeValue = hour + minute / 60;
  
  const morningPeak = Math.exp(-Math.pow((timeValue - 8.5) / 1.2, 2));
  const eveningPeak = Math.exp(-Math.pow((timeValue - 18.5) / 1.8, 2));
  const middayDip = Math.exp(-Math.pow((timeValue - 13) / 1.5, 2)) * 0.3;
  
  const baseFlow = 25 + morningPeak * 55 + eveningPeak * 50 - middayDip * 15;
  
  for (let i = 0; i < GRID_SIZE; i++) {
    blocks[i] = [];
    for (let j = 0; j < GRID_SIZE; j++) {
      const phase = blockPhases[i][j];
      
      const dailyCycle = Math.sin((timeValue - 6) * Math.PI / 12 + phase) * 12;
      
      const noise1 = Math.sin(timeValue * 0.8 + phase * 2) * 8;
      const noise2 = Math.sin(timeValue * 2.1 + phase * 0.7) * 4;
      
      const positionBias = (i + j) * 1.5 - GRID_SIZE * 1.5;
      
      const centerBias = -Math.abs(i - 3.5) * 3 - Math.abs(j - 3.5) * 3;
      
      let flow = baseFlow + dailyCycle + noise1 + noise2 + positionBias + centerBias;
      
      flow += (Math.random() - 0.5) * 6;
      
      flow = Math.max(5, Math.min(100, Math.round(flow)));
      
      blocks[i][j] = flow;
    }
  }
  
  return blocks;
}

app.get('/api/traffic', (req, res) => {
  let timeStr: string;
  
  if (req.query.time && typeof req.query.time === 'string') {
    timeStr = req.query.time;
  } else {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  const timeParts = timeStr.split(':');
  if (timeParts.length !== 2) {
    return res.status(400).json({ error: 'Invalid time format. Use HH:mm' });
  }
  
  const hours = parseInt(timeParts[0], 10);
  const minutes = parseInt(timeParts[1], 10);
  
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return res.status(400).json({ error: 'Invalid time value' });
  }
  
  const blocks = generateTrafficData(timeStr);
  
  res.json({
    time: timeStr,
    blocks
  });
});

app.get('/api/traffic/history', (req, res) => {
  const timeStr = typeof req.query.time === 'string' ? req.query.time : '08:00';
  const count = typeof req.query.count === 'string' ? parseInt(req.query.count, 10) : 12;
  
  const timeParts = timeStr.split(':');
  let hours = parseInt(timeParts[0], 10);
  let minutes = parseInt(timeParts[1], 10);
  
  const history: { time: string; blocks: number[][] }[] = [];
  
  for (let i = count - 1; i >= 0; i--) {
    let h = hours;
    let m = minutes - i * 15;
    
    while (m < 0) {
      m += 60;
      h--;
    }
    while (m >= 60) {
      m -= 60;
      h++;
    }
    
    if (h < 0) h = 23 + h + 1;
    if (h > 23) h = h - 24;
    
    const t = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    history.push({
      time: t,
      blocks: generateTrafficData(t)
    });
  }
  
  res.json(history);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`Traffic data server running on http://localhost:${PORT}`);
  console.log(`API endpoint: GET http://localhost:${PORT}/api/traffic?time=HH:mm`);
});

export default app;

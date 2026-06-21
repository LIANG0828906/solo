import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 8080;
const NUM_PORTS = 6;

const portColors = [
  '#00BCD4',
  '#FF9800',
  '#4CAF50',
  '#E91E63',
  '#FFEB3B',
  '#9C27B0',
];

const portNames = [
  '青岛港',
  '上海港',
  '深圳港',
  '宁波港',
  '广州港',
  '天津港',
];

const tideConfigs = [];
for (let i = 0; i < NUM_PORTS; i++) {
  tideConfigs.push({
    amplitude: 1 + Math.random() * 2,
    phase: Math.random() * Math.PI * 2,
    period: 12 + Math.random() * 2,
  });
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r, g, b) {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function adjustColorSaturation(hex, tideHeight, maxAmplitude) {
  const rgb = hexToRgb(hex);
  const normalizedHeight = Math.max(0, Math.min(1, (tideHeight + maxAmplitude) / (maxAmplitude * 2)));
  
  const grayValue = Math.round(rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114);
  const saturationFactor = 0.3 + normalizedHeight * 0.7;
  
  const r = Math.round(grayValue + (rgb.r - grayValue) * saturationFactor);
  const g = Math.round(grayValue + (rgb.g - grayValue) * saturationFactor);
  const b = Math.round(grayValue + (rgb.b - grayValue) * saturationFactor);
  
  return rgbToHex(Math.min(255, r), Math.min(255, g), Math.min(255, b));
}

function generateTideData(timeHours) {
  const data = [];
  
  for (let i = 0; i < NUM_PORTS; i++) {
    const config = tideConfigs[i];
    const tideHeight = config.amplitude * Math.sin((timeHours / config.period) * Math.PI * 2 + config.phase);
    const adjustedColor = adjustColorSaturation(portColors[i], tideHeight, 3);
    
    data.push({
      id: uuidv4(),
      portIndex: i,
      portName: portNames[i],
      tideHeight: parseFloat(tideHeight.toFixed(3)),
      color: adjustedColor,
      baseColor: portColors[i],
      timestamp: Date.now(),
    });
  }
  
  return data;
}

app.get('/api/ports', (req, res) => {
  const timeHours = (Date.now() / 1000 / 60 / 60) % 24;
  res.json({
    ports: portNames.map((name, i) => ({
      index: i,
      name,
      color: portColors[i],
      config: tideConfigs[i],
    })),
    currentTime: timeHours,
  });
});

const server = app.listen(PORT, () => {
  console.log(`Tide Memory Server running on port ${PORT}`);
  console.log(`WebSocket server ready for connections`);
});

const wss = new WebSocketServer({ server });

let currentSimulatedTime = 0;
const TIME_SPEED = 10;

setInterval(() => {
  currentSimulatedTime += (TIME_SPEED / 3600);
  if (currentSimulatedTime >= 24) {
    currentSimulatedTime = 0;
  }
  
  const tideData = generateTideData(currentSimulatedTime);
  
  const message = JSON.stringify({
    type: 'tideUpdate',
    time: currentSimulatedTime,
    data: tideData,
  });
  
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}, 1000);

wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  
  const initialData = generateTideData(currentSimulatedTime);
  ws.send(
    JSON.stringify({
      type: 'init',
      time: currentSimulatedTime,
      data: initialData,
      portNames,
      portColors,
    })
  );
  
  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message.toString());
      
      if (parsed.type === 'reset') {
        currentSimulatedTime = 0;
        for (let i = 0; i < NUM_PORTS; i++) {
          tideConfigs[i] = {
            amplitude: 1 + Math.random() * 2,
            phase: Math.random() * Math.PI * 2,
            period: 12 + Math.random() * 2,
          };
        }
        
        const resetData = generateTideData(0);
        wss.clients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(
              JSON.stringify({
                type: 'reset',
                time: 0,
                data: resetData,
                configs: tideConfigs,
              })
            );
          }
        });
      }
      
      if (parsed.type === 'setSpeed' && parsed.speed) {
        console.log(`Speed updated to: ${parsed.speed}x`);
      }
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

console.log(`HTTP server running at http://localhost:${PORT}`);

import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

interface SensorReading {
  id: string;
  lat: number;
  lng: number;
  vehicleCount: number;
  timestamp: number;
  roadName: string;
}

interface TrafficDataResponse {
  data: SensorReading[];
  timeRange: string;
  generatedAt: number;
}

const roadNames = [
  '中山路', '人民路', '解放路', '建设路', '文化路',
  '和平路', '友谊路', '幸福路', '光明路', '朝阳路',
  '长江路', '黄河路', '珠江路', '松花江路', '淮河路',
  '长安街', '王府井大街', '南京路', '外滩大街', '中央大街'
];

function generateRandomCoord(): { lat: number; lng: number } {
  return {
    lat: 39.8 + Math.random() * 0.4,
    lng: 116.2 + Math.random() * 0.4
  };
}

function getTimeRangeMilliseconds(range: string): number {
  switch (range) {
    case '1h': return 60 * 60 * 1000;
    case '24h': return 24 * 60 * 60 * 1000;
    case '7d': return 7 * 24 * 60 * 60 * 1000;
    default: return 60 * 60 * 1000;
  }
}

function generateTrafficData(timeRange: string): SensorReading[] {
  const rangeMs = getTimeRangeMilliseconds(timeRange);
  const now = Date.now();
  const sensorCount = 200;
  const readingsPerSensor = timeRange === '1h' ? 12 : timeRange === '24h' ? 48 : 24;
  const totalReadings = Math.min(sensorCount * readingsPerSensor, 3000);
  
  const sensors: { lat: number; lng: number; roadName: string }[] = [];
  for (let i = 0; i < sensorCount; i++) {
    sensors.push({
      ...generateRandomCoord(),
      roadName: roadNames[Math.floor(Math.random() * roadNames.length)]
    });
  }

  const data: SensorReading[] = [];
  for (let i = 0; i < totalReadings; i++) {
    const sensor = sensors[i % sensors.length];
    const baseCount = 50 + Math.floor(Math.random() * 450);
    const timeFactor = Math.sin((i / totalReadings) * Math.PI * 2) * 0.3 + 0.7;
    const vehicleCount = Math.floor(baseCount * timeFactor);
    
    data.push({
      id: uuidv4(),
      lat: sensor.lat,
      lng: sensor.lng,
      vehicleCount,
      timestamp: now - Math.floor((i / totalReadings) * rangeMs),
      roadName: sensor.roadName
    });
  }

  return data.sort((a, b) => a.timestamp - b.timestamp);
}

app.get('/api/traffic-data', (req: Request, res: Response) => {
  const timeRange = (req.query.timeRange as string) || '1h';
  const data = generateTrafficData(timeRange);
  
  const response: TrafficDataResponse = {
    data,
    timeRange,
    generatedAt: Date.now()
  };
  
  setTimeout(() => {
    res.json(response);
  }, 100 + Math.random() * 100);
});

app.get('/api/traffic-data/historical', (req: Request, res: Response) => {
  const timeRange = (req.query.timeRange as string) || '1h';
  const data = generateTrafficData(timeRange).map(d => ({
    ...d,
    vehicleCount: Math.floor(d.vehicleCount * (0.8 + Math.random() * 0.4))
  }));
  
  const response: TrafficDataResponse = {
    data,
    timeRange,
    generatedAt: Date.now()
  };
  
  setTimeout(() => {
    res.json(response);
  }, 100 + Math.random() * 100);
});

app.listen(PORT, () => {
  console.log(`Traffic data API server running on port ${PORT}`);
});

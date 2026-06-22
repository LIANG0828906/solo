import { WebSocketServer, WebSocket } from 'ws';

export interface StationData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  aqi: number;
  pm25: number;
  pm10: number;
  o3: number;
  timestamp: number;
}

interface StationConfig {
  id: string;
  name: string;
  lat: number;
  lng: number;
  baseAqi: number;
  basePm25: number;
  basePm10: number;
  baseO3: number;
}

const STATIONS: StationConfig[] = [
  { id: 'station_01', name: '朝阳监测站', lat: 39.9219, lng: 116.4436, baseAqi: 85, basePm25: 52, basePm10: 98, baseO3: 110 },
  { id: 'station_02', name: '海淀监测站', lat: 39.9593, lng: 116.2985, baseAqi: 72, basePm25: 42, basePm10: 82, baseO3: 95 },
  { id: 'station_03', name: '丰台监测站', lat: 39.8585, lng: 116.2871, baseAqi: 95, basePm25: 60, basePm10: 115, baseO3: 125 },
  { id: 'station_04', name: '东城监测站', lat: 39.9284, lng: 116.4164, baseAqi: 105, basePm25: 68, basePm10: 128, baseO3: 135 },
  { id: 'station_05', name: '西城监测站', lat: 39.9152, lng: 116.3659, baseAqi: 98, basePm25: 63, basePm10: 120, baseO3: 130 },
  { id: 'station_06', name: '通州监测站', lat: 39.9085, lng: 116.6579, baseAqi: 115, basePm25: 75, basePm10: 140, baseO3: 145 },
  { id: 'station_07', name: '昌平监测站', lat: 40.2205, lng: 116.2312, baseAqi: 65, basePm25: 38, basePm10: 72, baseO3: 85 },
  { id: 'station_08', name: '大兴监测站', lat: 39.7285, lng: 116.3391, baseAqi: 125, basePm25: 82, basePm10: 155, baseO3: 155 },
  { id: 'station_09', name: '顺义监测站', lat: 40.1290, lng: 116.6545, baseAqi: 88, basePm25: 55, basePm10: 105, baseO3: 115 },
  { id: 'station_10', name: '房山监测站', lat: 39.7356, lng: 116.1439, baseAqi: 78, basePm25: 48, basePm10: 92, baseO3: 100 },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function randomVariation(base: number, range: number): number {
  return Math.round(base + (Math.random() - 0.5) * range * 2);
}

function generateStationData(config: StationConfig): StationData {
  const aqi = clamp(randomVariation(config.baseAqi, 40), 10, 300);
  const pm25Ratio = aqi / config.baseAqi;
  return {
    id: config.id,
    name: config.name,
    lat: config.lat,
    lng: config.lng,
    aqi,
    pm25: clamp(Math.round(config.basePm25 * pm25Ratio + (Math.random() - 0.5) * 20), 5, 250),
    pm10: clamp(Math.round(config.basePm10 * pm25Ratio + (Math.random() - 0.5) * 30), 10, 400),
    o3: clamp(randomVariation(config.baseO3, 50), 20, 300),
    timestamp: Date.now(),
  };
}

function generateAllStationsData(): StationData[] {
  return STATIONS.map(generateStationData);
}

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });

console.log(`[DataSimulator] WebSocket server starting on ws://localhost:${PORT}`);

wss.on('connection', (ws: WebSocket) => {
  console.log('[DataSimulator] Client connected');

  const initialData = generateAllStationsData();
  ws.send(JSON.stringify({
    type: 'stationsUpdate',
    data: initialData,
  }));

  const intervalId = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      const data = generateAllStationsData();
      ws.send(JSON.stringify({
        type: 'stationsUpdate',
        data,
      }));
    }
  }, 2000);

  ws.on('close', () => {
    console.log('[DataSimulator] Client disconnected');
    clearInterval(intervalId);
  });

  ws.on('error', (error) => {
    console.error('[DataSimulator] WebSocket error:', error);
    clearInterval(intervalId);
  });
});

wss.on('error', (error) => {
  console.error('[DataSimulator] Server error:', error);
});

console.log(`[DataSimulator] Server ready, serving ${STATIONS.length} monitoring stations`);

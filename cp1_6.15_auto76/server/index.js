import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const baseCurrents = [
  { id: '1', name: '墨西哥湾流', nameEn: 'Gulf Stream', start: { lat: 25, lng: -80 }, end: { lat: 50, lng: -20 }, baseSpeed: 2.5, baseTemp: 25, isWarm: true, waypoints: [{ lat: 35, lng: -65 }, { lat: 45, lng: -40 }] },
  { id: '2', name: '黑潮', nameEn: 'Kuroshio', start: { lat: 15, lng: 125 }, end: { lat: 45, lng: 165 }, baseSpeed: 2.2, baseTemp: 24, isWarm: true, waypoints: [{ lat: 28, lng: 135 }, { lat: 38, lng: 150 }] },
  { id: '3', name: '北大西洋漂流', nameEn: 'North Atlantic Drift', start: { lat: 45, lng: -40 }, end: { lat: 65, lng: 0 }, baseSpeed: 1.2, baseTemp: 15, isWarm: true },
  { id: '4', name: '秘鲁寒流', nameEn: 'Humboldt Current', start: { lat: -5, lng: -80 }, end: { lat: -35, lng: -75 }, baseSpeed: 1.8, baseTemp: 14, isWarm: false },
  { id: '5', name: '加利福尼亚寒流', nameEn: 'California Current', start: { lat: 45, lng: -130 }, end: { lat: 20, lng: -115 }, baseSpeed: 1.5, baseTemp: 13, isWarm: false },
  { id: '6', name: '东澳暖流', nameEn: 'East Australian Current', start: { lat: -15, lng: 155 }, end: { lat: -40, lng: 155 }, baseSpeed: 1.6, baseTemp: 22, isWarm: true },
  { id: '7', name: '巴西暖流', nameEn: 'Brazil Current', start: { lat: -10, lng: -35 }, end: { lat: -40, lng: -55 }, baseSpeed: 1.4, baseTemp: 23, isWarm: true },
  { id: '8', name: '本格拉寒流', nameEn: 'Benguela Current', start: { lat: -5, lng: 10 }, end: { lat: -30, lng: 5 }, baseSpeed: 1.3, baseTemp: 12, isWarm: false },
  { id: '9', name: '索马里洋流', nameEn: 'Somali Current', start: { lat: -5, lng: 45 }, end: { lat: 15, lng: 55 }, baseSpeed: 2.0, baseTemp: 20, isWarm: true },
  { id: '10', name: '阿拉斯加暖流', nameEn: 'Alaska Current', start: { lat: 45, lng: -135 }, end: { lat: 60, lng: -150 }, baseSpeed: 1.1, baseTemp: 10, isWarm: true },
  { id: '11', name: '亲潮', nameEn: 'Oyashio', start: { lat: 60, lng: 160 }, end: { lat: 38, lng: 145 }, baseSpeed: 1.7, baseTemp: 5, isWarm: false },
  { id: '12', name: '拉布拉多寒流', nameEn: 'Labrador Current', start: { lat: 70, lng: -60 }, end: { lat: 42, lng: -55 }, baseSpeed: 1.6, baseTemp: 3, isWarm: false },
  { id: '13', name: '西澳寒流', nameEn: 'West Australian Current', start: { lat: -10, lng: 105 }, end: { lat: -35, lng: 110 }, baseSpeed: 1.2, baseTemp: 15, isWarm: false },
  { id: '14', name: '莫桑比克暖流', nameEn: 'Mozambique Current', start: { lat: -10, lng: 35 }, end: { lat: -30, lng: 33 }, baseSpeed: 1.5, baseTemp: 24, isWarm: true },
  { id: '15', name: '马达加斯加暖流', nameEn: 'Madagascar Current', start: { lat: -10, lng: 50 }, end: { lat: -30, lng: 45 }, baseSpeed: 1.4, baseTemp: 23, isWarm: true },
  { id: '16', name: '厄加勒斯暖流', nameEn: 'Agulhas Current', start: { lat: -25, lng: 35 }, end: { lat: -40, lng: 25 }, baseSpeed: 2.0, baseTemp: 22, isWarm: true },
  { id: '17', name: '南赤道暖流', nameEn: 'South Equatorial Current', start: { lat: -5, lng: -30 }, end: { lat: -10, lng: 170 }, baseSpeed: 0.8, baseTemp: 26, isWarm: true },
  { id: '18', name: '北赤道暖流', nameEn: 'North Equatorial Current', start: { lat: 10, lng: -30 }, end: { lat: 15, lng: 170 }, baseSpeed: 0.7, baseTemp: 27, isWarm: true },
  { id: '19', name: '赤道逆流', nameEn: 'Equatorial Counter Current', start: { lat: 3, lng: -180 }, end: { lat: 5, lng: 0 }, baseSpeed: 0.9, baseTemp: 27, isWarm: true },
  { id: '20', name: '南极绕极流', nameEn: 'Antarctic Circumpolar', start: { lat: -55, lng: -180 }, end: { lat: -60, lng: 180 }, baseSpeed: 1.0, baseTemp: 2, isWarm: false },
  { id: '21', name: '北大西洋暖流', nameEn: 'North Atlantic Current', start: { lat: 40, lng: -40 }, end: { lat: 60, lng: -10 }, baseSpeed: 1.3, baseTemp: 16, isWarm: true },
  { id: '22', name: '北太平洋暖流', nameEn: 'North Pacific Current', start: { lat: 35, lng: 160 }, end: { lat: 50, lng: -140 }, baseSpeed: 0.9, baseTemp: 14, isWarm: true },
  { id: '23', name: '湾流', nameEn: 'Florida Current', start: { lat: 23, lng: -82 }, end: { lat: 30, lng: -70 }, baseSpeed: 2.8, baseTemp: 26, isWarm: true },
  { id: '24', name: '对马暖流', nameEn: 'Tsushima Current', start: { lat: 30, lng: 130 }, end: { lat: 42, lng: 135 }, baseSpeed: 1.2, baseTemp: 20, isWarm: true },
  { id: '25', name: '黄海暖流', nameEn: 'Yellow Sea Warm Current', start: { lat: 32, lng: 125 }, end: { lat: 38, lng: 122 }, baseSpeed: 0.8, baseTemp: 16, isWarm: true },
  { id: '26', name: '南海暖流', nameEn: 'South China Sea Warm Current', start: { lat: 10, lng: 110 }, end: { lat: 22, lng: 118 }, baseSpeed: 0.7, baseTemp: 27, isWarm: true },
  { id: '27', name: '挪威海流', nameEn: 'Norwegian Current', start: { lat: 60, lng: 0 }, end: { lat: 72, lng: 15 }, baseSpeed: 0.8, baseTemp: 8, isWarm: true },
  { id: '28', name: '斯瓦尔巴德暖流', nameEn: 'Spitsbergen Current', start: { lat: 65, lng: 10 }, end: { lat: 80, lng: 20 }, baseSpeed: 0.6, baseTemp: 4, isWarm: true },
  { id: '29', name: '东格陵兰寒流', nameEn: 'East Greenland Current', start: { lat: 80, lng: -10 }, end: { lat: 60, lng: -40 }, baseSpeed: 0.9, baseTemp: -1, isWarm: false },
  { id: '30', name: '西格陵兰暖流', nameEn: 'West Greenland Current', start: { lat: 60, lng: -50 }, end: { lat: 78, lng: -60 }, baseSpeed: 0.7, baseTemp: 3, isWarm: true }
];

let cachedOceanCurrents = null;
let cachedTemperatureGrid = null;
let lastUpdateTime = 0;
const UPDATE_INTERVAL = 10000;

function generateCurrents(monthOffset = 0) {
  const now = new Date();
  now.setMonth(now.getMonth() - monthOffset);
  const month = now.getMonth();
  
  const seasonalFactor = Math.sin((month / 12) * Math.PI * 2 - Math.PI / 2) * 0.3;
  
  return baseCurrents.map(c => {
    const speedVariation = (Math.random() - 0.5) * 0.3;
    const tempVariation = (Math.random() - 0.5) * 2;
    const seasonalTemp = c.isWarm ? seasonalFactor * 4 : -seasonalFactor * 3;
    
    return {
      id: c.id,
      name: c.name,
      nameEn: c.nameEn,
      start: c.start,
      end: c.end,
      waypoints: c.waypoints,
      speed: Math.max(0.3, c.baseSpeed * (1 + speedVariation + seasonalFactor * 0.2)),
      temperature: Math.max(-2, Math.min(32, c.baseTemp + tempVariation + seasonalTemp)),
      isWarm: c.isWarm
    };
  });
}

function generateTemperatureGrid(monthOffset = 0) {
  const now = new Date();
  now.setMonth(now.getMonth() - monthOffset);
  const month = now.getMonth();
  
  const data = [];
  const timestamp = Date.now();
  
  const seasonalShift = Math.sin((month / 12) * Math.PI * 2 - Math.PI / 2) * 3;
  const northernHemisphereFactor = month >= 4 && month <= 9 ? 1 : -1;
  
  for (let lat = -88; lat <= 88; lat += 2) {
    for (let lng = -178; lng <= 178; lng += 2) {
      const latAbs = Math.abs(lat);
      const hemisphereFactor = lat >= 0 ? northernHemisphereFactor : -northernHemisphereFactor;
      
      let baseTemp = 32 - latAbs * 0.55;
      
      baseTemp += seasonalShift * hemisphereFactor * (1 - latAbs / 90);
      
      baseTemp += Math.sin(lng * Math.PI / 90) * 2.5;
      baseTemp += Math.cos(lat * Math.PI / 45) * 2;
      
      const gulfStreamEffect = Math.exp(-Math.pow((lng + 60) / 25, 2) - Math.pow((lat - 40) / 20, 2)) * 5;
      const kuroshioEffect = Math.exp(-Math.pow((lng - 145) / 25, 2) - Math.pow((lat - 35) / 18, 2)) * 4.5;
      const equatorEffect = Math.exp(-Math.pow(lat / 8, 2)) * 2;
      const antarcticEffect = lat < -50 ? (lat + 50) * 0.3 : 0;
      const arcticEffect = lat > 50 ? (50 - lat) * 0.3 : 0;
      
      baseTemp += gulfStreamEffect + kuroshioEffect + equatorEffect + antarcticEffect + arcticEffect;
      
      const elNino = (lng > 120 && lng < 280 && lat > -10 && lat < 10) ? Math.sin(Date.now() / (1000 * 60 * 60 * 24 * 30)) * 1.5 : 0;
      baseTemp += elNino;
      
      const randomVariation = (Math.random() - 0.5) * 1.5;
      
      const temperature = Math.max(-2, Math.min(34, baseTemp + randomVariation));
      
      data.push({
        lat,
        lng,
        temperature: Math.round(temperature * 10) / 10,
        timestamp
      });
    }
  }
  
  return {
    data,
    timestamp,
    month: now.getMonth() + 1,
    year: now.getFullYear()
  };
}

function updateCachedData() {
  const now = Date.now();
  if (now - lastUpdateTime >= UPDATE_INTERVAL || !cachedOceanCurrents || !cachedTemperatureGrid) {
    cachedOceanCurrents = {
      currents: generateCurrents(0),
      timestamp: now,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    };
    cachedTemperatureGrid = generateTemperatureGrid(0);
    lastUpdateTime = now;
  }
}

setInterval(updateCachedData, UPDATE_INTERVAL);
updateCachedData();

app.get('/api/ocean-currents', (req, res) => {
  const monthOffset = parseInt(req.query.monthOffset) || 0;
  
  if (monthOffset === 0) {
    updateCachedData();
    res.json(cachedOceanCurrents);
  } else {
    const now = new Date();
    now.setMonth(now.getMonth() - monthOffset);
    res.json({
      currents: generateCurrents(monthOffset),
      timestamp: Date.now(),
      month: now.getMonth() + 1,
      year: now.getFullYear()
    });
  }
});

app.get('/api/temperature-grid', (req, res) => {
  const monthOffset = parseInt(req.query.monthOffset) || 0;
  
  if (monthOffset === 0) {
    updateCachedData();
    res.json(cachedTemperatureGrid);
  } else {
    res.json(generateTemperatureGrid(monthOffset));
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    lastUpdate: new Date(lastUpdateTime).toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🌊 Ocean Visualization Server running on http://localhost:${PORT}`);
  console.log(`   API endpoints:`);
  console.log(`   - GET /api/ocean-currents?monthOffset=0`);
  console.log(`   - GET /api/temperature-grid?monthOffset=0`);
  console.log(`   - GET /api/health`);
  console.log(`   Data updates every ${UPDATE_INTERVAL / 1000} seconds`);
});

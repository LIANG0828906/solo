import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const weatherCache = new Map<string, CacheEntry<WeatherData>>();
const CACHE_TTL = 10 * 60 * 1000;

interface WeatherData {
  city: string;
  temperature: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
  humidity: number;
  precipitation: number;
  windSpeed: number;
  icon: string;
  hourlyForecast: Array<{
    time: string;
    temperature: number;
    condition: string;
    icon: string;
  }>;
}

const cityDatabase = [
  { name: '北京', country: '中国' },
  { name: '上海', country: '中国' },
  { name: '广州', country: '中国' },
  { name: '深圳', country: '中国' },
  { name: '杭州', country: '中国' },
  { name: '南京', country: '中国' },
  { name: '成都', country: '中国' },
  { name: '重庆', country: '中国' },
  { name: '武汉', country: '中国' },
  { name: '西安', country: '中国' },
  { name: '天津', country: '中国' },
  { name: '苏州', country: '中国' },
  { name: '长沙', country: '中国' },
  { name: '青岛', country: '中国' },
  { name: '大连', country: '中国' },
  { name: '厦门', country: '中国' },
  { name: '昆明', country: '中国' },
  { name: '哈尔滨', country: '中国' },
  { name: '长春', country: '中国' },
  { name: '沈阳', country: '中国' },
  { name: '济南', country: '中国' },
  { name: '郑州', country: '中国' },
  { name: '石家庄', country: '中国' },
  { name: '太原', country: '中国' },
  { name: '合肥', country: '中国' },
  { name: '福州', country: '中国' },
  { name: '南昌', country: '中国' },
  { name: '南宁', country: '中国' },
  { name: '海口', country: '中国' },
  { name: '贵阳', country: '中国' },
  { name: '拉萨', country: '中国' },
  { name: '兰州', country: '中国' },
  { name: '西宁', country: '中国' },
  { name: '银川', country: '中国' },
  { name: '乌鲁木齐', country: '中国' },
  { name: '呼和浩特', country: '中国' },
  { name: 'Tokyo', country: 'Japan' },
  { name: 'New York', country: 'USA' },
  { name: 'London', country: 'UK' },
  { name: 'Paris', country: 'France' },
  { name: 'Sydney', country: 'Australia' },
];

function generateMockWeather(city: string): WeatherData {
  const conditions: Array<'sunny' | 'cloudy' | 'rainy' | 'snowy'> = ['sunny', 'cloudy', 'rainy', 'snowy'];
  const icons: Record<string, string> = {
    sunny: '☀️',
    cloudy: '☁️',
    rainy: '🌧️',
    snowy: '❄️',
  };
  
  const seed = city.charCodeAt(0) + (city.length > 1 ? city.charCodeAt(1) : 0);
  const conditionIndex = seed % 4;
  const condition = conditions[conditionIndex];
  
  const baseTemp = 15 + (seed % 20);
  const precipitation = condition === 'rainy' ? 5 + Math.random() * 15 : condition === 'snowy' ? 2 + Math.random() * 8 : 0;
  
  const hourlyForecast = [];
  const now = new Date();
  for (let i = 1; i <= 3; i++) {
    const forecastTime = new Date(now.getTime() + i * 60 * 60 * 1000);
    const hourCondition = conditions[(conditionIndex + i) % 4];
    hourlyForecast.push({
      time: forecastTime.getHours() + ':00',
      temperature: baseTemp + Math.floor(Math.random() * 5) - 2,
      condition: hourCondition,
      icon: icons[hourCondition],
    });
  }
  
  return {
    city,
    temperature: baseTemp,
    condition,
    humidity: 40 + Math.random() * 40,
    precipitation,
    windSpeed: 5 + Math.random() * 20,
    icon: icons[condition],
    hourlyForecast,
  };
}

app.get('/api/weather', async (req: Request, res: Response) => {
  const city = req.query.city as string;
  
  if (!city) {
    return res.status(400).json({ error: 'City parameter is required' });
  }
  
  const cacheKey = city.toLowerCase();
  const cached = weatherCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`Cache hit for ${city}`);
    return res.json(cached.data);
  }
  
  console.log(`Fetching weather for ${city}`);
  
  try {
    const weatherData = generateMockWeather(city);
    
    weatherCache.set(cacheKey, {
      data: weatherData,
      timestamp: Date.now(),
    });
    
    res.json(weatherData);
  } catch (error) {
    console.error('Error fetching weather:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

app.get('/api/cities', (req: Request, res: Response) => {
  const search = (req.query.search as string)?.toLowerCase() || '';
  
  const results = cityDatabase
    .filter(city => city.name.toLowerCase().includes(search))
    .slice(0, 8);
  
  res.json(results);
});

app.listen(PORT, () => {
  console.log(`Weather proxy server running on port ${PORT}`);
});

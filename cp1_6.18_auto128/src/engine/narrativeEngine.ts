import type { WeatherData, WeatherType } from '../data/weatherService';

export interface NarrativeResult {
  paragraphs: string[];
  sentimentScore: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

const weatherDescriptions: Record<WeatherType, string[]> = {
  sunny: [
    '阳光倾洒在城市的每一个角落，金色的光芒温柔地拥抱着大地。',
    '湛蓝的天空没有一丝云彩，太阳毫不吝啬地释放着它的热情。',
    '明媚的阳光穿透玻璃窗，在地板上画出明亮的光斑。'
  ],
  cloudy: [
    '厚重的云层如同灰色的绒毯，缓缓铺展在城市上空。',
    '天空被柔和的灰白色填满，阳光在云层后若隐若现。',
    '云朵像棉花糖一样漂浮着，给大地投下变幻的光影。'
  ],
  rainy: [
    '细雨如丝，淅淅沥沥地敲打着窗户，诉说着绵绵的心事。',
    '雨滴在地面上溅起小小的水花，空气中弥漫着泥土的芬芳。',
    '雨水顺着屋檐滑落，形成一道道透明的珠帘。'
  ],
  snowy: [
    '雪花像白色的羽毛，轻轻盈盈地从天空飘落。',
    '皑皑白雪覆盖了整座城市，世界变得纯净而安静。',
    '每一片雪花都带着独特的纹路，在空中翩翩起舞。'
  ]
};

const temperaturePhrases: Record<'hot' | 'warm' | 'cool' | 'cold', string[]> = {
  hot: [
    '热浪滚滚，空气仿佛都在微微颤动。',
    '炙热的阳光烤着大地，连风都带着温度。'
  ],
  warm: [
    '气温宜人，不冷不热刚刚好。',
    '温暖的空气包裹着身体，让人感到舒适惬意。'
  ],
  cool: [
    '凉爽的空气让人精神一振，头脑也变得清醒。',
    '微风吹过，带来丝丝凉意。'
  ],
  cold: [
    '寒气逼人，呼出的气息在空中化作白雾。',
    '凛冽的寒风像刀子一样划过脸庞。'
  ]
};

const sentimentTemplates = {
  positive: [
    '这样的天气让人心情愉悦，仿佛所有的烦恼都随风而去。',
    '大自然总是以它独特的方式，给我们带来惊喜和感动。',
    '每一个天气都有它独特的美，等待我们去发现和欣赏。',
    '生活中的小确幸，往往就藏在这些平凡的天气里。'
  ],
  neutral: [
    '日子就这样一天天过去，天气也在不断变化着。',
    '这是这座城市里普通的一天，和许多其他日子一样。',
    '天气只是天气，它不带有任何感情色彩。'
  ],
  negative: [
    '这样的天气让人感到有些压抑，心情也跟着沉重起来。',
    '阴郁的天空仿佛在诉说着某种无法言说的忧伤。',
    '灰蒙蒙的天气，让人提不起精神，只想躲在温暖的被窝里。'
  ]
};

function getTemperatureCategory(temp: number): 'hot' | 'warm' | 'cool' | 'cold' {
  if (temp >= 28) return 'hot';
  if (temp >= 18) return 'warm';
  if (temp >= 8) return 'cool';
  return 'cold';
}

function calculateSentiment(data: WeatherData[]): number {
  let score = 0;
  
  data.forEach(day => {
    switch (day.weatherType) {
      case 'sunny':
        score += 0.3;
        break;
      case 'cloudy':
        score += 0.1;
        break;
      case 'rainy':
        score -= 0.2;
        break;
      case 'snowy':
        score -= 0.1;
        break;
    }
    
    if (day.temperature >= 18 && day.temperature <= 25) {
      score += 0.2;
    } else if (day.temperature < 5 || day.temperature > 32) {
      score -= 0.1;
    }
    
    if (day.humidity >= 40 && day.humidity <= 60) {
      score += 0.1;
    }
  });
  
  score = score / data.length;
  
  return Math.max(-1, Math.min(1, score));
}

function getSentimentLabel(score: number): 'positive' | 'neutral' | 'negative' {
  if (score > 0.2) return 'positive';
  if (score < -0.1) return 'negative';
  return 'neutral';
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateNarrative(weatherData: WeatherData[]): NarrativeResult {
  const paragraphs: string[] = [];
  
  const sentimentScore = calculateSentiment(weatherData);
  const sentiment = getSentimentLabel(sentimentScore);
  
  const avgTemp = weatherData.reduce((sum, d) => sum + d.temperature, 0) / weatherData.length;
  const tempCategory = getTemperatureCategory(avgTemp);
  
  const intro = `在过去的${weatherData.length}天里，这座城市经历了多变的天气。每一天都有它独特的故事，每一种天气都在诉说着不同的情绪。`;
  paragraphs.push(intro);
  
  let dayDescriptions = '';
  weatherData.forEach((day, index) => {
    const weatherDesc = pickRandom(weatherDescriptions[day.weatherType]);
    if (index === 0) {
      dayDescriptions += `${day.date}，${weatherDesc} `;
    } else if (index === weatherData.length - 1) {
      dayDescriptions += `到了${day.date}，${weatherDesc.toLowerCase()}`;
    } else {
      dayDescriptions += `${day.date}，${weatherDesc.toLowerCase()}`;
    }
    if (index < weatherData.length - 1) {
      dayDescriptions += ' ';
    }
  });
  paragraphs.push(dayDescriptions);
  
  const tempDesc = pickRandom(temperaturePhrases[tempCategory]);
  paragraphs.push(`平均气温大约在${Math.round(avgTemp)}度左右。${tempDesc}`);
  
  const sentimentParagraphs = sentimentTemplates[sentiment];
  paragraphs.push(pickRandom(sentimentParagraphs));
  
  if (weatherData.length > 3) {
    const mostCommonWeather = getMostCommonWeather(weatherData);
    const conclusion = `总体来说，这段时间以${getWeatherTypeName(mostCommonWeather)}为主。天气的变化就像生活的缩影，有阳光灿烂的日子，也有阴雨连绵的时候，但正是这些变化，让每一天都充满了期待。`;
    paragraphs.push(conclusion);
  }
  
  return {
    paragraphs,
    sentimentScore,
    sentiment
  };
}

function getMostCommonWeather(data: WeatherData[]): WeatherType {
  const counts: Record<WeatherType, number> = {
    sunny: 0,
    cloudy: 0,
    rainy: 0,
    snowy: 0
  };
  
  data.forEach(d => counts[d.weatherType]++);
  
  let maxCount = 0;
  let mostCommon: WeatherType = 'sunny';
  
  (Object.keys(counts) as WeatherType[]).forEach(type => {
    if (counts[type] > maxCount) {
      maxCount = counts[type];
      mostCommon = type;
    }
  });
  
  return mostCommon;
}

function getWeatherTypeName(type: WeatherType): string {
  const names: Record<WeatherType, string> = {
    sunny: '晴天',
    cloudy: '阴天',
    rainy: '雨天',
    snowy: '雪天'
  };
  return names[type];
}

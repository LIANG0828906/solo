import { EnvironmentData, PlantType } from '../types';

interface PlantInfo {
  name: string;
  idealTemp: [number, number];
  idealHumidity: [number, number];
  needsLight: 'low' | 'medium' | 'high';
  soilPreference: 'dry' | 'moist' | 'waterlogged';
  waterAmount: string;
}

const plantInfo: Record<PlantType, PlantInfo> = {
  pothos: {
    name: '绿萝',
    idealTemp: [18, 28],
    idealHumidity: [40, 70],
    needsLight: 'low',
    soilPreference: 'moist',
    waterAmount: '200ml'
  },
  succulent: {
    name: '多肉',
    idealTemp: [15, 30],
    idealHumidity: [30, 50],
    needsLight: 'high',
    soilPreference: 'dry',
    waterAmount: '100ml'
  },
  rose: {
    name: '玫瑰',
    idealTemp: [18, 25],
    idealHumidity: [50, 75],
    needsLight: 'high',
    soilPreference: 'moist',
    waterAmount: '350ml'
  },
  mint: {
    name: '薄荷',
    idealTemp: [20, 30],
    idealHumidity: [60, 80],
    needsLight: 'medium',
    soilPreference: 'moist',
    waterAmount: '300ml'
  }
};

export function generateAdvice(data: EnvironmentData, plant: PlantType): string[] {
  const advice: string[] = [];
  const info = plantInfo[plant];
  const { temperature, humidity, light, soilMoisture } = data;

  if (soilMoisture === 'dry') {
    advice.push(`当前土壤偏干，建议浇水${info.waterAmount}`);
  } else if (soilMoisture === 'waterlogged') {
    advice.push('土壤过湿，建议暂停浇水并检查排水');
  } else {
    advice.push('土壤湿度适中，继续保持');
  }

  if (temperature < info.idealTemp[0]) {
    advice.push(`温度偏低（${temperature}℃），建议移至温暖处，${info.name}适宜温度${info.idealTemp[0]}-${info.idealTemp[1]}℃`);
  } else if (temperature > info.idealTemp[1]) {
    advice.push(`温度偏高（${temperature}℃），建议遮阴降温，${info.name}适宜温度${info.idealTemp[0]}-${info.idealTemp[1]}℃`);
  }

  if (humidity < info.idealHumidity[0]) {
    advice.push(`空气湿度偏低（${humidity}%），建议喷雾增湿`);
  } else if (humidity > info.idealHumidity[1]) {
    advice.push(`空气湿度过高（${humidity}%），建议加强通风`);
  }

  if (plant === 'succulent' && light !== 'high') {
    advice.push('多肉需要充足阳光，建议移至光照充足处');
  } else if (plant === 'rose' && light !== 'high') {
    advice.push('玫瑰喜强光，建议增加光照');
  } else if (plant === 'pothos' && light === 'high') {
    advice.push('绿萝耐阴，强光可能灼伤叶片，建议适当遮阴');
  }

  if (temperature > 30 && humidity > 70) {
    advice.push('高温高湿环境易滋生真菌，建议加强通风并减少施肥');
  }

  if (temperature < 10) {
    advice.push('温度过低，注意防冻，减少浇水');
  }

  return advice;
}

export function getPlantName(plant: PlantType): string {
  return plantInfo[plant].name;
}

export function getLightText(light: string): string {
  const map: Record<string, string> = {
    low: '弱光',
    medium: '中等',
    high: '强光'
  };
  return map[light] || light;
}

export function getSoilText(soil: string): string {
  const map: Record<string, string> = {
    dry: '干燥',
    moist: '湿润',
    waterlogged: '水涝'
  };
  return map[soil] || soil;
}

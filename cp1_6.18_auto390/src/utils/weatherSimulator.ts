import type { Weather } from '@/store/useStore';

const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉'];
const weatherIcons = ['☀️', '⛅', '☁️', '🌧️', '❄️', '🌤️', '🌥️'];

export const weatherSimulator = {
  generate(): Weather {
    const city = cities[Math.floor(Math.random() * cities.length)];
    const season = getCurrentSeason();
    const baseTemp = getBaseTemperature(season);
    const temperature = baseTemp + Math.floor(Math.random() * 10) - 5;
    const icon = weatherIcons[Math.floor(Math.random() * weatherIcons.length)];
    const humidity = 30 + Math.floor(Math.random() * 50);

    return { city, temperature, icon, humidity };
  },
};

function getCurrentSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

function getBaseTemperature(season: string): number {
  switch (season) {
    case 'spring': return 18;
    case 'summer': return 30;
    case 'autumn': return 20;
    case 'winter': return 5;
    default: return 22;
  }
}

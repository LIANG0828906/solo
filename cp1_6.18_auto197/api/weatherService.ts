export function getSimulatedWeather(): { emoji: string; description: string } {
  const weathers = [
    { emoji: '☀️', description: '晴天' },
    { emoji: '⛅', description: '多云' },
    { emoji: '🌧️', description: '小雨' },
    { emoji: '🌤️', description: '晴转多云' },
    { emoji: '🌙', description: '夜晚晴朗' },
    { emoji: '❄️', description: '下雪' },
    { emoji: '🌈', description: '雨后彩虹' },
    { emoji: '🌊', description: '海风习习' },
  ];
  const hour = new Date().getHours();
  if (hour >= 20 || hour < 6) {
    return { emoji: '🌙', description: '夜晚晴朗' };
  }
  return weathers[Math.floor(Math.random() * (weathers.length - 1))];
}

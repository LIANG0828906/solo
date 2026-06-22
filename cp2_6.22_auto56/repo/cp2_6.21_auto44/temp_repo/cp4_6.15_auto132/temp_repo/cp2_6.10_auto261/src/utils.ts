let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

export function playSuccessSound() {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(523.25, ctx.currentTime);
    oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
  } catch (e) {
    console.log('Audio not supported');
  }
}

export function playErrorSound() {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
    oscillator.frequency.setValueAtTime(150, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.log('Audio not supported');
  }
}

export function playTickSound() {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);
  } catch (e) {
    console.log('Audio not supported');
  }
}

export function getConstellationById(id: string, constellations: any[]) {
  return constellations.find(c => c.id === id);
}

export function randomWeather() {
  const weathers = [
    { type: 'clear', name: '晴', icon: '☀', modifier: 0 },
    { type: 'rain', name: '雨', icon: '☂', modifier: 0.5 },
    { type: 'thunder', name: '雷', icon: '⚡', modifier: 1 },
  ];
  return weathers[Math.floor(Math.random() * weathers.length)];
}

export function randomEvent(eventType: string) {
  const events: Record<string, { name: string; description: string }[]> = {
    starfall: [
      { name: '星陨之兆', description: '有星陨于东南，火光烛天。此乃大凶之兆，需速速镇压！' },
      { name: '群星黯淡', description: '北斗七星忽明忽暗，似有陨落之危。速选星宿以定乾坤！' },
    ],
    battle: [
      { name: '星官斗法', description: '有邪祟星官欲扰乱天纲，速选正确星宿铭文与其斗法！' },
      { name: '妖气冲天', description: '黑气冲天，有妖星作乱。需以正统星力镇压！' },
    ],
    destruction: [
      { name: '星图受损', description: '星图一角忽现裂痕，部分星宿模糊不清。速以铭文修补！' },
      { name: '天机泄露', description: '有凡人窥见天机，扰乱星轨。速选星宿以正视听！' },
    ],
  };
  const list = events[eventType] || events.starfall;
  return list[Math.floor(Math.random() * list.length)];
}

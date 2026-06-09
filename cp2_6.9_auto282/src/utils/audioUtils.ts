let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

export const playWoodSnap = (): void => {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(300, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.1);
  
  gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.1);
};

export const playBambooClick = (): void => {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(800, ctx.currentTime);
  
  gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.05);
};

interface DrumPattern {
  type: 'smallGong' | 'largeGong' | 'drum';
  time: number;
}

export const playDrumPattern = (duration: number = 60000): { stop: () => void } => {
  const ctx = getAudioContext();
  const startTime = ctx.currentTime;
  const beatDuration = 0.5;
  const pattern: DrumPattern[] = [
    { type: 'drum', time: 0 },
    { type: 'smallGong', time: 0.25 },
    { type: 'drum', time: 0.5 },
    { type: 'largeGong', time: 0.75 },
  ];
  
  const sounds: { stop: () => void }[] = [];
  let isPlaying = true;
  
  const playSound = (type: 'smallGong' | 'largeGong' | 'drum', time: number): void => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    let frequency = 800;
    let soundDuration = 0.2;
    
    switch (type) {
      case 'smallGong':
        frequency = 800;
        oscillator.type = 'triangle';
        break;
      case 'largeGong':
        frequency = 400;
        oscillator.type = 'triangle';
        soundDuration = 0.3;
        break;
      case 'drum':
        frequency = 1500;
        oscillator.type = 'sine';
        soundDuration = 0.1;
        break;
    }
    
    oscillator.frequency.setValueAtTime(frequency, time);
    
    gainNode.gain.setValueAtTime(0.2, time);
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + soundDuration);
    
    oscillator.start(time);
    oscillator.stop(time + soundDuration);
  };
  
  const schedulePattern = (): void => {
    if (!isPlaying) return;
    
    const currentTime = ctx.currentTime;
    const elapsed = currentTime - startTime;
    
    if (elapsed >= duration / 1000) {
      isPlaying = false;
      return;
    }
    
    const barTime = Math.floor(elapsed / (beatDuration * 2)) * (beatDuration * 2);
    
    pattern.forEach(note => {
      const noteTime = startTime + barTime + note.time;
      if (noteTime > currentTime && noteTime < startTime + duration / 1000) {
        playSound(note.type, noteTime);
      }
    });
    
    setTimeout(schedulePattern, 500);
  };
  
  schedulePattern();
  
  return {
    stop: () => {
      isPlaying = false;
    }
  };
};

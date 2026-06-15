let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

export function playGavelSound(): void {
  const ctx = getAudioContext();
  
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(800, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
  
  gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.15);
  
  const oscillator2 = ctx.createOscillator();
  const gainNode2 = ctx.createGain();
  
  oscillator2.connect(gainNode2);
  gainNode2.connect(ctx.destination);
  
  oscillator2.type = 'sine';
  oscillator2.frequency.setValueAtTime(150, ctx.currentTime + 0.05);
  oscillator2.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);
  
  gainNode2.gain.setValueAtTime(0.3, ctx.currentTime + 0.05);
  gainNode2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
  
  oscillator2.start(ctx.currentTime + 0.05);
  oscillator2.stop(ctx.currentTime + 0.25);
}

export function playWinSound(): void {
  const ctx = getAudioContext();
  
  const notes = [523.25, 659.25, 783.99, 1046.50];
  
  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.15);
    
    gain.gain.setValueAtTime(0, ctx.currentTime + index * 0.15);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + index * 0.15 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.15 + 0.4);
    
    osc.start(ctx.currentTime + index * 0.15);
    osc.stop(ctx.currentTime + index * 0.15 + 0.4);
  });
}

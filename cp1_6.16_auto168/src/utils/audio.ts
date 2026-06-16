export function createAudioSystem() {
  const AudioContextClass =
    (window as any).AudioContext || (window as any).webkitAudioContext;

  if (!AudioContextClass) {
    return {
      playSuccess: () => {},
      playFailure: () => {},
      startBackground: () => {},
      stopBackground: () => {},
      updateProgress: (_progress: number) => {},
    };
  }

  const ctx: AudioContext = new AudioContextClass();

  let bgOsc1: OscillatorNode | null = null;
  let bgOsc2: OscillatorNode | null = null;
  let bgGain1: GainNode | null = null;
  let bgGain2: GainNode | null = null;
  let lfo: OscillatorNode | null = null;
  let lfoGain: GainNode | null = null;
  let masterGain: GainNode | null = null;
  let currentProgress = 0;

  const baseFreq1 = 50;
  const baseFreq2 = 75;
  const maxFreq1 = 120;
  const maxFreq2 = 150;

  const playSuccess = () => {
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const duration = 0.3;

    const freqs = [440, 660, 880];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, now + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + duration);
    });

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now);
    osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.3);
  };

  const playFailure = () => {
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const duration = 0.4;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + duration);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(80, now);
    osc2.frequency.exponentialRampToValueAtTime(30, now + duration);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.15, now + 0.03);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + duration);
  };

  const startBackground = () => {
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    if (bgOsc1 || bgOsc2) {
      return;
    }

    const now = ctx.currentTime;

    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.08, now + 0.5);
    masterGain.connect(ctx.destination);

    bgGain1 = ctx.createGain();
    bgGain1.gain.value = 0.5;
    bgGain1.connect(masterGain);

    bgGain2 = ctx.createGain();
    bgGain2.gain.value = 0.3;
    bgGain2.connect(masterGain);

    const f1 = baseFreq1 + (maxFreq1 - baseFreq1) * currentProgress;
    const f2 = baseFreq2 + (maxFreq2 - baseFreq2) * currentProgress;

    bgOsc1 = ctx.createOscillator();
    bgOsc1.type = 'sine';
    bgOsc1.frequency.value = f1;
    bgOsc1.connect(bgGain1);
    bgOsc1.start(now);

    bgOsc2 = ctx.createOscillator();
    bgOsc2.type = 'sine';
    bgOsc2.frequency.value = f2;
    bgOsc2.connect(bgGain2);
    bgOsc2.start(now);

    lfo = ctx.createOscillator();
    lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.3;
    lfoGain.gain.value = 3;
    lfo.connect(lfoGain);
    if (bgOsc1) lfoGain.connect(bgOsc1.frequency);
    lfo.start(now);
  };

  const stopBackground = () => {
    if (!masterGain) return;

    const now = ctx.currentTime;
    const fadeDuration = 0.5;

    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(masterGain.gain.value, now);
    masterGain.gain.linearRampToValueAtTime(0, now + fadeDuration);

    setTimeout(() => {
      if (bgOsc1) {
        try { bgOsc1.stop(); } catch {}
        bgOsc1.disconnect();
        bgOsc1 = null;
      }
      if (bgOsc2) {
        try { bgOsc2.stop(); } catch {}
        bgOsc2.disconnect();
        bgOsc2 = null;
      }
      if (lfo) {
        try { lfo.stop(); } catch {}
        lfo.disconnect();
        lfo = null;
      }
      if (bgGain1) { bgGain1.disconnect(); bgGain1 = null; }
      if (bgGain2) { bgGain2.disconnect(); bgGain2 = null; }
      if (lfoGain) { lfoGain.disconnect(); lfoGain = null; }
      if (masterGain) { masterGain.disconnect(); masterGain = null; }
    }, fadeDuration * 1000 + 50);
  };

  const updateProgress = (progress: number) => {
    currentProgress = Math.max(0, Math.min(1, progress));

    if (bgOsc1 && bgOsc2) {
      const now = ctx.currentTime;
      const f1 = baseFreq1 + (maxFreq1 - baseFreq1) * currentProgress;
      const f2 = baseFreq2 + (maxFreq2 - baseFreq2) * currentProgress;
      bgOsc1.frequency.linearRampToValueAtTime(f1, now + 0.3);
      bgOsc2.frequency.linearRampToValueAtTime(f2, now + 0.3);
    }
  };

  return {
    playSuccess,
    playFailure,
    startBackground,
    stopBackground,
    updateProgress,
  };
}

// 音频上下文实例
let audioContext: AudioContext | null = null;

/**
 * 获取或创建AudioContext实例
 * @returns AudioContext实例
 */
function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * 播放通用音调函数
 * @param frequency 频率（Hz）
 * @param duration 持续时间（秒）
 * @param type 波形类型
 * @param volume 音量（0-1）
 */
function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.3
): void {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (error) {
    console.warn('播放音效失败:', error);
  }
}

/**
 * 播放答对音效（简短清脆的上行提示音）
 */
export function playCorrectSound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // 播放两个上升音调
    const frequencies = [523.25, 659.25, 783.99];

    frequencies.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, now + index * 0.08);

      gainNode.gain.setValueAtTime(0.25, now + index * 0.08);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + index * 0.08 + 0.15);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(now + index * 0.08);
      oscillator.stop(now + index * 0.08 + 0.15);
    });
  } catch (error) {
    console.warn('播放答对音效失败:', error);
  }
}

/**
 * 播放答错音效（低沉的错误提示音）
 */
export function playWrongSound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // 播放两个下行低沉音调
    const frequencies = [220, 196, 164.81];

    frequencies.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(freq, now + index * 0.1);

      gainNode.gain.setValueAtTime(0.2, now + index * 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + index * 0.1 + 0.2);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(now + index * 0.1);
      oscillator.stop(now + index * 0.1 + 0.2);
    });
  } catch (error) {
    console.warn('播放答错音效失败:', error);
  }
}

/**
 * 播放点击音效（短促清脆的点击声）
 */
export function playClickSound(): void {
  playTone(800, 0.05, 'square', 0.15);
}

/**
 * 播放胜利音效（欢快的上升音阶）
 */
export function playVictorySound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // C大调和弦琶音
    const frequencies = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50];

    frequencies.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, now + index * 0.12);

      gainNode.gain.setValueAtTime(0.25, now + index * 0.12);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + index * 0.12 + 0.3);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(now + index * 0.12);
      oscillator.stop(now + index * 0.12 + 0.3);
    });
  } catch (error) {
    console.warn('播放胜利音效失败:', error);
  }
}

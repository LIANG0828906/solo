export interface HandwritingFrame {
  charIndex: number;
  char: string;
  delay: number;
  duration: number;
}

export interface EnvelopeTransform {
  rotateY: number;
  rotateX: number;
  scale: number;
  opacity: number;
  translateZ: number;
}

export type EnvelopeStyleType = 'wax-seal' | 'airmail' | 'kraft-bag' | 'washi' | 'steampunk' | 'glass';

interface EnvelopeStyleConfig {
  background: string;
  borderColor: string;
  flapColor: string;
  accentColor: string;
  label: string;
}

const envelopeStyles: Record<EnvelopeStyleType, EnvelopeStyleConfig> = {
  'wax-seal': {
    background: 'linear-gradient(145deg, #F5E6D3 0%, #E8D4BC 100%)',
    borderColor: '#C4956A',
    flapColor: '#D4A574',
    accentColor: '#8B0000',
    label: '复古蜡封',
  },
  airmail: {
    background: 'linear-gradient(145deg, #FFFFFF 0%, #F0F0F0 100%)',
    borderColor: '#1E3A5F',
    flapColor: '#E74C3C',
    accentColor: '#1E3A5F',
    label: '航空邮简',
  },
  'kraft-bag': {
    background: 'linear-gradient(145deg, #C4956A 0%, #A67C52 100%)',
    borderColor: '#8B5A2B',
    flapColor: '#D4A574',
    accentColor: '#6B4423',
    label: '牛皮纸袋',
  },
  washi: {
    background: 'linear-gradient(145deg, #FFE4E8 0%, #FFC0CB 100%)',
    borderColor: '#FF69B4',
    flapColor: '#FFB6C1',
    accentColor: '#FF1493',
    label: '和风折纸',
  },
  steampunk: {
    background: 'linear-gradient(145deg, #4A4A4A 0%, #2F2F2F 100%)',
    borderColor: '#B87333',
    flapColor: '#696969',
    accentColor: '#DAA520',
    label: '蒸汽朋克',
  },
  glass: {
    background: 'linear-gradient(145deg, rgba(255,255,255,0.3) 0%, rgba(200,220,255,0.2) 100%)',
    borderColor: 'rgba(255,255,255,0.5)',
    flapColor: 'rgba(255,255,255,0.4)',
    accentColor: '#87CEEB',
    label: '透明玻璃',
  },
};

export class EnvelopeAnimator {
  static generateHandwritingFrames(text: string): HandwritingFrame[] {
    const chars = Array.from(text);
    const frames: HandwritingFrame[] = [];
    let cumulativeDelay = 0;

    for (let i = 0; i < chars.length; i++) {
      const randomDelay = 50 + Math.random() * 100;
      const duration = 30 + Math.random() * 50;
      
      frames.push({
        charIndex: i,
        char: chars[i],
        delay: cumulativeDelay,
        duration,
      });

      cumulativeDelay += randomDelay;
    }

    return frames;
  }

  static getTotalAnimationDuration(frames: HandwritingFrame[]): number {
    if (frames.length === 0) return 0;
    const lastFrame = frames[frames.length - 1];
    return lastFrame.delay + lastFrame.duration + 500;
  }

  static getEnvelopeTransform(progress: number): EnvelopeTransform {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const easeOut = 1 - Math.pow(1 - clampedProgress, 3);
    
    return {
      rotateY: 90 * (1 - easeOut),
      rotateX: -20 * (1 - easeOut),
      scale: 0.8 + 0.2 * easeOut,
      opacity: easeOut,
      translateZ: -50 * (1 - easeOut),
    };
  }

  static getEnvelopeStyle(style: EnvelopeStyleType): EnvelopeStyleConfig {
    return envelopeStyles[style];
  }

  static animate(
    onFrame: (progress: number, timestamp: number) => void,
    duration: number,
    easing: (t: number) => number = (t) => t
  ): Promise<void> {
    return new Promise((resolve) => {
      const startTime = performance.now();

      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const rawProgress = Math.min(elapsed / duration, 1);
        const easedProgress = easing(rawProgress);

        onFrame(easedProgress, currentTime);

        if (rawProgress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(step);
    });
  }

  static easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  static easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}

export const envelopeStyleList: EnvelopeStyleType[] = [
  'wax-seal',
  'airmail',
  'kraft-bag',
  'washi',
  'steampunk',
  'glass',
];

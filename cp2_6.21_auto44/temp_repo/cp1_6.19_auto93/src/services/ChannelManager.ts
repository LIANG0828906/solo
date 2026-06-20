import type { Channel, TuningState } from '../types';

const MIN_FREQUENCY = 87.5;
const MAX_FREQUENCY = 108.0;
const FREQUENCY_RANGE = MAX_FREQUENCY - MIN_FREQUENCY;

export class ChannelManager {
  private channels: Channel[];

  constructor() {
    this.channels = [
      {
        id: 'jazz',
        name: '爵士电台',
        genre: 'Jazz',
        frequency: 91.5,
        angle: this.frequencyToAngle(91.5),
        themeColor: '#D4A56A',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        description: '深夜爵士，聆听城市的呼吸',
        currentTrack: 'Moonlight Serenade - Ella Fitzgerald',
      },
      {
        id: 'classical',
        name: '古典音乐厅',
        genre: 'Classical',
        frequency: 94.7,
        angle: this.frequencyToAngle(94.7),
        themeColor: '#8B7355',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        description: '穿越时空的古典之旅',
        currentTrack: 'Symphony No.5 - Beethoven',
      },
      {
        id: 'electronic',
        name: '电子脉冲',
        genre: 'Electronic',
        frequency: 98.3,
        angle: this.frequencyToAngle(98.3),
        themeColor: '#6A0DAD',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        description: '未来电子，脉冲你的神经',
        currentTrack: 'Neon Dreams - Synthwave Master',
      },
      {
        id: 'folk',
        name: '民谣故事',
        genre: 'Folk',
        frequency: 101.9,
        angle: this.frequencyToAngle(101.9),
        themeColor: '#5B8C5A',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
        description: '一把吉他，一个故事',
        currentTrack: 'Country Roads - John Denver',
      },
      {
        id: 'blues',
        name: '蓝调灵魂',
        genre: 'Blues',
        frequency: 105.1,
        angle: this.frequencyToAngle(105.1),
        themeColor: '#4169E1',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
        description: '来自密西西比的灵魂吟唱',
        currentTrack: 'The Thrill Is Gone - B.B. King',
      },
      {
        id: 'world',
        name: '世界音乐',
        genre: 'World',
        frequency: 107.5,
        angle: this.frequencyToAngle(107.5),
        themeColor: '#CD853F',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
        description: '聆听地球每一个角落的声音',
        currentTrack: 'African Rhythms - World Collective',
      },
    ];
  }

  getChannels(): Channel[] {
    return this.channels;
  }

  angleToFrequency(angle: number): number {
    const normalizedAngle = ((angle % 360) + 360) % 360;
    return MIN_FREQUENCY + (normalizedAngle / 360) * FREQUENCY_RANGE;
  }

  frequencyToAngle(frequency: number): number {
    const clampedFreq = Math.max(MIN_FREQUENCY, Math.min(MAX_FREQUENCY, frequency));
    return ((clampedFreq - MIN_FREQUENCY) / FREQUENCY_RANGE) * 360;
  }

  calculateTuningState(currentAngle: number): TuningState {
    const normalizedAngle = ((currentAngle % 360) + 360) % 360;
    const currentFrequency = this.angleToFrequency(normalizedAngle);

    let nearestChannel: Channel | null = null;
    let minDeviation = Infinity;

    for (const channel of this.channels) {
      let deviation = Math.abs(normalizedAngle - channel.angle);
      if (deviation > 180) {
        deviation = 360 - deviation;
      }
      if (deviation < minDeviation) {
        minDeviation = deviation;
        nearestChannel = channel;
      }
    }

    let signalStrength: number;
    if (minDeviation <= 5) {
      signalStrength = 100;
    } else if (minDeviation <= 10) {
      signalStrength = 100 * ((10 - minDeviation) / 5);
    } else {
      signalStrength = 0;
    }

    return {
      currentAngle: normalizedAngle,
      currentFrequency,
      signalStrength,
      nearestChannel,
      frequencyDeviation: minDeviation,
    };
  }

  shouldScanChannels(prevAngle: number, currentAngle: number): boolean {
    const prevScanPoint = Math.floor(prevAngle / 10);
    const currentScanPoint = Math.floor(currentAngle / 10);
    return prevScanPoint !== currentScanPoint;
  }
}

export const channelManager = new ChannelManager();

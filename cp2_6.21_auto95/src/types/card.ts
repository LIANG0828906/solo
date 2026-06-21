export interface TextProperties {
  content: string;
  fontFamily: 'noto-sans' | 'noto-serif' | 'zhanku-kuaile';
  fontSize: number;
  lineHeight: number;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  strokeColor: string;
  strokeWidth: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowBlur: number;
  shadowColor: string;
}

export interface Layer {
  id: string;
  type: 'background' | 'decoration' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  src?: string;
  color?: string;
  text?: TextProperties;
  label?: string;
}

export interface AnimationConfig {
  enterEffect: 'fade-in' | 'slide-up' | 'zoom-in';
  duration: number;
  continuousEffect: 'petals' | 'stars' | 'particles';
}

export interface MusicConfig {
  file: File | null;
  url: string | null;
  volume: number;
  loop: boolean;
  waveformData: number[];
}

export interface Recipient {
  name: string;
  message: string;
}

export interface PreviewItem {
  recipient: Recipient;
  thumbnailUrl: string;
}

export interface CardTemplate {
  id: string;
  name: string;
  emoji: string;
  layers: Layer[];
  animation: AnimationConfig;
  bgColor: string;
}

export interface CardState {
  currentTemplateId: string | null;
  layers: Layer[];
  selectedLayerId: string | null;
  animation: AnimationConfig;
  music: MusicConfig;
  recipients: Recipient[];
  previews: PreviewItem[];
}

export const DEFAULT_TEXT_PROPS: TextProperties = {
  content: '',
  fontFamily: 'noto-sans',
  fontSize: 24,
  lineHeight: 1.5,
  color: '#333333',
  textAlign: 'center',
  strokeColor: '#000000',
  strokeWidth: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  shadowBlur: 0,
  shadowColor: 'rgba(0,0,0,0.5)',
};

export const DEFAULT_ANIMATION: AnimationConfig = {
  enterEffect: 'fade-in',
  duration: 2,
  continuousEffect: 'stars',
};

export const DEFAULT_MUSIC: MusicConfig = {
  file: null,
  url: null,
  volume: 80,
  loop: true,
  waveformData: [],
};

export const SCENE_WIDTH = 800;
export const SCENE_HEIGHT = 600;

export const THEME = {
  beachStart: '#F4D03F',
  beachEnd: '#FFF9E6',
  shellColor: 'rgba(255, 255, 255, 0.3)',
  panelBg: '#151528',
  panelBorder: '#2A2A44',
  panelHover: '#2A2A44',
  modalBg: '#1A1A2E',
  modalBorder: '#3A3A5C',
  modalText: '#E0E0E0',
  editorBg: '#2D2D44',
  editorBorder: '#6C6C8A',
  editorInputBg: '#1E1E2E',
  closeBtn: '#FF6B6B',
  closeBtnHover: '#E55555',
  buryBtn: '#6BCB77',
  buryBtnHover: '#5AB866',
  emojiGlow: '#FFD93D'
} as const;

export const CAPSULE_COLORS = ['#6BCB77', '#4ECDC4', '#FFD93D', '#FF6B6B'] as const;

export const EMOJIS = ['❤️', '🌟', '🎉', '🌈', '🌸', '💫'] as const;

export const CAPSULE = {
  width: 30,
  height: 20,
  opacity: 0.8
} as const;

export const ANIMATION = {
  digDuration: 500,
  openDuration: 800,
  scrollDuration: 600,
  btnScale: 0.95,
  btnShakeDuration: 100
} as const;

export const PARTICLE = {
  minSize: 1,
  maxSize: 3,
  minOpacity: 0.2,
  maxOpacity: 0.5,
  maxCount: 80,
  trailSpeed: 0.8
} as const;

export const EDITOR = {
  width: 320,
  borderRadius: 20,
  inputWidth: 280,
  inputHeight: 100,
  inputRadius: 8,
  btnHeight: 48,
  btnRadius: 12,
  emojiSize: 30
} as const;

export const SIDE_PANEL = {
  width: 200,
  borderRadius: 12,
  itemHeight: 48,
  maxLogs: 5
} as const;

export const STORAGE_KEY = 'time_capsule_data_v1';

export const API_DELAY = 200;

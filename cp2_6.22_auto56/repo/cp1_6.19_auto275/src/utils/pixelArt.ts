export type PixelColor = string;
export type PixelFrame = PixelColor[][];

export const COLORS = {
  TRANSPARENT: 'transparent',
  SPRITE_BODY: '#FFD700',
  SPRITE_BELLY: '#FFFACD',
  SPRITE_OUTLINE: '#2F4F4F',
  EYE_WHITE: '#FFFFFF',
  EYE_PUPIL: '#000000',
  MOUTH_HAPPY: '#FF6347',
  MOUTH_SAD: '#4682B4',
  GRASS_LIGHT: '#7CFC00',
  GRASS_DARK: '#6B8E23',
  SKY: '#87CEEB',
  CLOUD: '#FFFFFF',
  HEART: '#FF6347',
  APPLE: '#FF0000',
  APPLE_LEAF: '#32CD32',
  BATHTUB: '#87CEEB',
  BATHTUB_WATER: '#00BFFF',
  LIGHTNING: '#FFD700',
  HAMBURGER_BUN: '#F4A460',
  HAMBURGER_MEAT: '#8B4513',
  HAMBURGER_LETTUCE: '#32CD32',
  HAMBURGER_CHEESE: '#FFD700',
  WATER_SPLASH: '#00BFFF',
  EXCLAMATION: '#FF0000',
  BAR_GREEN: '#32CD32',
  BAR_YELLOW: '#FFD700',
  BAR_RED: '#FF4500',
  BUBBLE: '#FFFFFF',
  SAD_BUBBLE: '#4682B4',
} as const;

const T = COLORS.TRANSPARENT;
const B = COLORS.SPRITE_BODY;
const L = COLORS.SPRITE_BELLY;
const O = COLORS.SPRITE_OUTLINE;
const W = COLORS.EYE_WHITE;
const P = COLORS.EYE_PUPIL;
const MH = COLORS.MOUTH_HAPPY;
const MS = COLORS.MOUTH_SAD;

export const SPRITE_IDLE_FRAME_1: PixelFrame = [
  [T,T,T,O,O,O,O,O,O,O,T,T,T,T,T,T],
  [T,T,O,B,B,B,B,B,B,B,O,T,T,T,T,T],
  [T,O,B,B,B,B,B,B,B,B,B,O,T,T,T,T],
  [O,B,B,W,P,B,B,W,P,B,B,B,O,T,T,T],
  [O,B,B,B,B,B,B,B,B,B,B,B,O,T,T,T],
  [O,B,B,B,B,MH,MH,B,B,B,B,B,O,T,T],
  [O,B,B,B,B,B,B,B,B,B,B,B,B,O,T,T],
  [O,B,B,L,L,L,L,L,L,L,B,B,B,O,T,T],
  [O,B,L,L,L,L,L,L,L,L,L,B,B,O,T,T],
  [T,O,L,L,L,L,L,L,L,L,L,L,O,T,T,T],
  [T,T,O,B,B,O,O,O,O,B,B,O,T,T,T,T],
  [T,T,T,O,O,T,T,T,T,O,O,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
];

export const SPRITE_IDLE_FRAME_2: PixelFrame = [
  [T,T,T,O,O,O,O,O,O,O,T,T,T,T,T,T],
  [T,T,O,B,B,B,B,B,B,B,O,T,T,T,T,T],
  [T,O,B,B,B,B,B,B,B,B,B,O,T,T,T,T],
  [O,B,B,W,P,B,B,W,P,B,B,B,O,T,T,T],
  [O,B,B,B,B,B,B,B,B,B,B,B,O,T,T,T],
  [O,B,B,B,B,MH,MH,B,B,B,B,B,O,T,T],
  [O,B,B,B,B,B,B,B,B,B,B,B,B,O,T,T],
  [O,B,B,L,L,L,L,L,L,L,B,B,B,O,T,T],
  [O,B,L,L,L,L,L,L,L,L,L,B,B,O,T,T],
  [T,O,L,L,L,L,L,L,L,L,L,L,O,T,T,T],
  [T,T,O,O,B,O,O,O,O,B,O,O,T,T,T,T],
  [T,T,T,O,O,T,T,T,T,O,O,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
];

export const SPRITE_WALK_FRAME_1: PixelFrame = [
  [T,T,T,O,O,O,O,O,O,O,T,T,T,T,T,T],
  [T,T,O,B,B,B,B,B,B,B,O,T,T,T,T,T],
  [T,O,B,B,B,B,B,B,B,B,B,O,T,T,T,T],
  [O,B,B,W,P,B,B,W,P,B,B,B,O,T,T,T],
  [O,B,B,B,B,B,B,B,B,B,B,B,O,T,T,T],
  [O,B,B,B,B,MH,MH,B,B,B,B,B,O,T,T],
  [O,B,B,B,B,B,B,B,B,B,B,B,B,O,T,T],
  [O,B,B,L,L,L,L,L,L,L,B,B,B,O,T,T],
  [O,B,L,L,L,L,L,L,L,L,L,B,B,O,T,T],
  [T,O,L,L,L,L,L,L,L,L,L,L,O,T,T,T],
  [T,T,O,B,B,O,O,O,O,O,O,O,T,T,T,T],
  [T,T,T,O,O,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,O,O,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,O,O,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
];

export const SPRITE_WALK_FRAME_2: PixelFrame = [
  [T,T,T,O,O,O,O,O,O,O,T,T,T,T,T,T],
  [T,T,O,B,B,B,B,B,B,B,O,T,T,T,T,T],
  [T,O,B,B,B,B,B,B,B,B,B,O,T,T,T,T],
  [O,B,B,W,P,B,B,W,P,B,B,B,O,T,T,T],
  [O,B,B,B,B,B,B,B,B,B,B,B,O,T,T,T],
  [O,B,B,B,B,MH,MH,B,B,B,B,B,O,T,T],
  [O,B,B,B,B,B,B,B,B,B,B,B,B,O,T,T],
  [O,B,B,L,L,L,L,L,L,L,B,B,B,O,T,T],
  [O,B,L,L,L,L,L,L,L,L,L,B,B,O,T,T],
  [T,O,L,L,L,L,L,L,L,L,L,L,O,T,T,T],
  [T,T,O,O,O,O,O,O,O,B,B,O,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,O,O,T,T,T,T,T],
  [T,T,O,O,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,O,O,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
];

export const SPRITE_JUMP_FRAME: PixelFrame = [
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,O,O,O,O,O,O,O,T,T,T,T,T,T],
  [T,T,O,B,B,B,B,B,B,B,O,T,T,T,T,T],
  [T,O,B,B,B,B,B,B,B,B,B,O,T,T,T,T],
  [O,B,B,W,P,B,B,W,P,B,B,B,O,T,T,T],
  [O,B,B,B,B,B,B,B,B,B,B,B,O,T,T,T],
  [O,B,B,B,B,MH,MH,B,B,B,B,B,O,T,T],
  [O,B,B,L,L,L,L,L,L,L,B,B,B,O,T,T],
  [O,B,L,L,L,L,L,L,L,L,L,B,B,O,T,T],
  [O,B,L,L,L,L,L,L,L,L,L,L,B,O,T,T],
  [T,O,B,B,O,O,O,O,O,O,B,B,O,T,T,T],
  [T,T,O,O,T,T,T,T,T,T,O,O,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
];

export const SPRITE_SLEEP_FRAME: PixelFrame = [
  [T,T,T,O,O,O,O,O,O,O,T,T,T,T,T,T],
  [T,T,O,B,B,B,B,B,B,B,O,T,T,T,T,T],
  [T,O,B,B,B,B,B,B,B,B,B,O,T,T,T,T],
  [O,B,B,P,P,B,B,P,P,B,B,B,O,T,T,T],
  [O,B,B,B,B,B,B,B,B,B,B,B,O,T,T,T],
  [O,B,B,B,B,MS,MS,B,B,B,B,B,O,T,T],
  [O,B,B,B,B,B,B,B,B,B,B,B,B,O,T,T],
  [O,B,B,L,L,L,L,L,L,L,B,B,B,O,T,T],
  [O,B,L,L,L,L,L,L,L,L,L,B,B,O,T,T],
  [T,O,L,L,L,L,L,L,L,L,L,L,O,T,T,T],
  [T,T,O,B,B,O,O,O,O,B,B,O,T,T,T,T],
  [T,T,T,O,O,T,T,T,T,O,O,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
];

export const SPRITE_SAD_FRAME: PixelFrame = [
  [T,T,T,O,O,O,O,O,O,O,T,T,T,T,T,T],
  [T,T,O,B,B,B,B,B,B,B,O,T,T,T,T,T],
  [T,O,B,B,B,B,B,B,B,B,B,O,T,T,T,T],
  [O,B,B,W,P,B,B,W,P,B,B,B,O,T,T,T],
  [O,B,B,B,B,B,B,B,B,B,B,B,O,T,T,T],
  [O,B,B,B,B,MS,MS,B,B,B,B,B,O,T,T],
  [O,B,B,B,B,B,B,B,B,B,B,B,B,O,T,T],
  [O,B,B,L,L,L,L,L,L,L,B,B,B,O,T,T],
  [O,B,L,L,L,L,L,L,L,L,L,B,B,O,T,T],
  [T,O,L,L,L,L,L,L,L,L,L,L,O,T,T,T],
  [T,T,O,B,B,O,O,O,O,B,B,O,T,T,T,T],
  [T,T,T,O,O,T,T,T,T,O,O,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
];

const X = P;

export const SPRITE_FAINT_FRAME: PixelFrame = [
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,O,O,O,O,O,O,O,T,T,T,T,T,T],
  [T,T,O,B,B,B,B,B,B,B,O,T,T,T,T,T],
  [T,O,B,B,X,X,B,B,X,X,B,B,O,T,T,T],
  [O,B,B,B,B,B,B,B,B,B,B,B,B,O,T,T],
  [O,B,B,B,B,MS,MS,B,B,B,B,B,O,T,T],
  [O,B,B,L,L,L,L,L,L,L,B,B,B,O,T,T],
  [O,B,L,L,L,L,L,L,L,L,L,B,B,O,T,T],
  [T,O,L,L,L,L,L,L,L,L,L,L,O,T,T,T],
  [T,T,O,B,B,O,O,O,O,B,B,O,T,T,T,T],
  [T,T,T,O,O,T,T,T,T,O,O,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
];

const H = COLORS.HAMBURGER_BUN;
const M = COLORS.HAMBURGER_MEAT;
const HL = COLORS.HAMBURGER_LETTUCE;
const HC = COLORS.HAMBURGER_CHEESE;

export const HAMBURGER_ICON: PixelFrame = [
  [T,T,T,T,O,O,O,O,O,O,T,T,T,T,T,T],
  [T,T,T,O,H,H,H,H,H,H,O,T,T,T,T,T],
  [T,T,O,H,H,H,H,H,H,H,H,O,T,T,T,T],
  [T,O,H,H,H,H,H,H,H,H,H,H,O,T,T,T],
  [O,H,H,H,H,H,H,H,H,H,H,H,H,O,T,T],
  [O,H,H,H,H,H,H,H,H,H,H,H,H,O,T,T],
  [T,O,HL,HL,HL,HL,HL,HL,HL,HL,HL,HL,O,T,T,T],
  [T,T,O,HC,HC,HC,HC,HC,HC,HC,HC,HC,O,T,T,T,T],
  [T,T,T,O,M,M,M,M,M,M,M,M,O,T,T,T,T,T],
  [T,T,T,T,O,M,M,M,M,M,M,O,T,T,T,T,T,T],
  [T,T,T,T,T,O,M,M,M,M,O,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,O,O,O,O,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
];

const WA = COLORS.WATER_SPLASH;
const WO = COLORS.SPRITE_OUTLINE;

export const WATER_ICON: PixelFrame = [
  [T,T,T,T,T,T,WA,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,WA,WA,WA,T,T,T,T,T,T,T,T],
  [T,T,T,T,WA,WA,WA,WA,WA,T,T,T,T,T,T,T],
  [T,T,T,WO,WO,WO,WO,WO,WO,WO,T,T,T,T,T,T],
  [T,T,WO,WA,WA,WA,WA,WA,WA,WA,WO,T,T,T,T,T],
  [T,WO,WA,WA,WA,WA,WA,WA,WA,WA,WA,WO,T,T,T,T],
  [T,WO,WA,WA,T,WA,WA,WA,WA,T,WA,WA,WO,T,T,T],
  [T,WO,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WO,T,T,T],
  [T,WO,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WO,T,T,T],
  [T,T,WO,WA,WA,WA,WA,WA,WA,WA,WA,WO,T,T,T,T,T],
  [T,T,T,WO,WO,WO,WO,WO,WO,WO,WO,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
];

const E = COLORS.EXCLAMATION;
const EO = COLORS.SPRITE_OUTLINE;

export const EXCLAMATION_ICON: PixelFrame = [
  [T,T,T,T,T,T,EO,EO,EO,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,EO,E,E,E,EO,T,T,T,T,T,T,T],
  [T,T,T,T,EO,E,E,E,E,E,EO,T,T,T,T,T,T],
  [T,T,T,T,EO,E,E,E,E,E,EO,T,T,T,T,T,T],
  [T,T,T,T,T,EO,E,E,E,EO,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,EO,EO,EO,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,EO,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,EO,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,EO,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,EO,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,EO,EO,EO,EO,EO,T,T,T,T,T,T],
  [T,T,T,T,EO,E,E,E,E,E,EO,T,T,T,T,T,T],
  [T,T,T,T,EO,E,E,E,E,E,EO,T,T,T,T,T,T],
  [T,T,T,T,T,EO,EO,EO,EO,EO,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
];

const R = COLORS.BAR_GREEN;
const RO = COLORS.SPRITE_OUTLINE;

export const RUN_ICON: PixelFrame = [
  [T,T,T,T,T,RO,RO,RO,RO,RO,T,T,T,T,T,T],
  [T,T,T,T,RO,R,R,R,R,R,RO,T,T,T,T,T,T],
  [T,T,T,RO,R,R,R,R,R,R,R,RO,T,T,T,T,T],
  [T,T,RO,R,R,R,P,R,P,R,R,R,RO,T,T,T,T],
  [T,T,RO,R,R,R,R,R,R,R,R,R,RO,T,T,T,T],
  [T,T,RO,R,R,MH,MH,MH,R,R,R,RO,T,T,T,T],
  [T,T,RO,R,R,R,R,R,R,R,R,R,RO,T,T,T,T],
  [T,RO,R,R,R,R,R,R,R,R,R,R,R,RO,T,T,T],
  [T,RO,R,R,R,R,R,R,R,R,R,R,R,RO,T,T,T],
  [T,T,RO,R,R,RO,RO,RO,RO,R,R,RO,T,T,T,T],
  [T,T,T,RO,RO,T,T,T,T,T,RO,RO,T,T,T,T,T],
  [T,T,RO,RO,T,T,T,T,T,T,T,RO,RO,T,T,T,T],
  [T,RO,RO,T,T,T,T,T,T,T,T,T,RO,RO,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
];

const HE = COLORS.HEART;
const HO2 = COLORS.SPRITE_OUTLINE;

export const HEART_ICON: PixelFrame = [
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,HO2,HO2,T,T,T,T,T,T,HO2,HO2,T,T,T,T],
  [T,HO2,HE,HE,HO2,T,T,T,T,HO2,HE,HE,HO2,T,T,T],
  [HO2,HE,HE,HE,HE,HO2,T,T,HO2,HE,HE,HE,HE,HO2,T,T],
  [HO2,HE,HE,HE,HE,HE,HO2,HO2,HE,HE,HE,HE,HE,HO2,T,T],
  [HO2,HE,HE,HE,HE,HE,HE,HE,HE,HE,HE,HE,HE,HO2,T,T],
  [T,HO2,HE,HE,HE,HE,HE,HE,HE,HE,HE,HE,HO2,T,T,T],
  [T,T,HO2,HE,HE,HE,HE,HE,HE,HE,HE,HO2,T,T,T,T],
  [T,T,T,HO2,HE,HE,HE,HE,HE,HE,HO2,T,T,T,T,T,T],
  [T,T,T,T,HO2,HE,HE,HE,HE,HO2,T,T,T,T,T,T,T],
  [T,T,T,T,T,HO2,HE,HE,HO2,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,HO2,HO2,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
];

const A = COLORS.APPLE;
const AL = COLORS.APPLE_LEAF;
const AO = COLORS.SPRITE_OUTLINE;

export const APPLE_ICON: PixelFrame = [
  [T,T,T,T,T,T,T,AO,AL,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,AO,AL,AL,AO,T,T,T,T,T,T],
  [T,T,T,T,T,T,AO,AL,AO,T,T,T,T,T,T,T],
  [T,T,T,T,AO,AO,AO,AO,T,T,T,T,T,T,T,T],
  [T,T,T,AO,A,A,A,A,AO,AO,T,T,T,T,T,T],
  [T,T,AO,A,A,A,A,A,A,A,AO,T,T,T,T,T],
  [T,AO,A,A,A,A,A,A,A,A,A,AO,T,T,T,T],
  [AO,A,A,A,A,A,A,A,A,A,A,A,AO,T,T,T],
  [AO,A,A,A,A,A,A,A,A,A,A,A,AO,T,T,T],
  [T,AO,A,A,A,A,A,A,A,A,A,AO,T,T,T,T],
  [T,T,AO,A,A,A,A,A,A,A,AO,T,T,T,T,T],
  [T,T,T,AO,AO,A,A,A,AO,AO,T,T,T,T,T,T],
  [T,T,T,T,T,AO,AO,AO,AO,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
];

const BA = COLORS.BATHTUB;
const BW = COLORS.BATHTUB_WATER;
const BO = COLORS.SPRITE_OUTLINE;

export const BATHTUB_ICON: PixelFrame = [
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,BO,BO,BO,BO,BO,BO,BO,BO,BO,BO,BO,BO,T,T,T],
  [BO,BA,BA,BA,BA,BA,BA,BA,BA,BA,BA,BA,BA,BO,T,T],
  [BO,BA,BW,BW,BW,BW,BW,BW,BW,BW,BW,BW,BA,BO,T,T],
  [BO,BA,BW,BW,BW,BW,BW,BW,BW,BW,BW,BW,BA,BO,T,T],
  [BO,BA,BW,BW,BW,BW,BW,BW,BW,BW,BW,BW,BA,BO,T,T],
  [BO,BA,BA,BA,BA,BA,BA,BA,BA,BA,BA,BA,BA,BO,T,T],
  [T,BO,BA,BA,BA,BA,BA,BA,BA,BA,BA,BA,BO,T,T,T,T],
  [T,T,BO,BO,BO,BO,BO,BO,BO,BO,BO,BO,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
];

const LI = COLORS.LIGHTNING;
const LO = COLORS.SPRITE_OUTLINE;

export const LIGHTNING_ICON: PixelFrame = [
  [T,T,T,T,T,T,LO,LO,LO,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,LO,LI,LI,LO,T,T,T,T,T,T,T,T],
  [T,T,T,T,LO,LI,LI,LI,LO,T,T,T,T,T,T,T,T],
  [T,T,T,LO,LI,LI,LI,LI,LO,T,T,T,T,T,T,T,T],
  [T,T,LO,LI,LI,LI,LI,LI,LO,LO,T,T,T,T,T,T],
  [T,LO,LI,LI,LI,LI,LI,LI,LI,LI,LO,T,T,T,T,T],
  [LO,LI,LI,LI,LI,LI,LI,LI,LI,LI,LI,LO,T,T,T,T],
  [LO,LI,LI,LI,LI,LI,LI,LI,LI,LO,LO,T,T,T,T,T],
  [T,LO,LI,LI,LI,LI,LI,LI,LO,T,T,T,T,T,T,T,T],
  [T,T,LO,LO,LI,LI,LI,LO,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,LO,LI,LI,LO,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,LO,LI,LO,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,LO,LO,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
];

const BU = COLORS.BUBBLE;
const BUO = COLORS.SPRITE_OUTLINE;

export const BUBBLE_ICON: PixelFrame = [
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,BUO,BUO,BUO,BUO,T,T,T,T,T,T,T],
  [T,T,T,T,BUO,BU,BU,BU,BU,BUO,T,T,T,T,T,T],
  [T,T,T,BUO,BU,BU,BU,BU,BU,BU,BUO,T,T,T,T,T],
  [T,T,T,BUO,BU,BU,BU,BU,BU,BU,BUO,T,T,T,T,T],
  [T,T,T,BUO,BU,BU,BU,BU,BU,BU,BUO,T,T,T,T,T],
  [T,T,T,BUO,BU,BU,BU,BU,BU,BU,BUO,T,T,T,T,T],
  [T,T,T,T,BUO,BU,BU,BU,BU,BUO,T,T,T,T,T,T],
  [T,T,T,T,T,BUO,BUO,BUO,BUO,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,BUO,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,BUO,BU,BUO,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,BUO,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
];

const SBU = COLORS.SAD_BUBBLE;
const SBUO = COLORS.SPRITE_OUTLINE;

export const SAD_BUBBLE_ICON: PixelFrame = [
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,SBUO,SBUO,SBUO,SBUO,T,T,T,T,T,T,T],
  [T,T,T,T,SBUO,SBU,SBU,SBU,SBU,SBUO,T,T,T,T,T,T],
  [T,T,T,SBUO,SBU,SBU,SBU,SBU,SBU,SBU,SBUO,T,T,T,T,T],
  [T,T,T,SBUO,SBU,SBU,SBU,SBU,SBU,SBU,SBUO,T,T,T,T,T],
  [T,T,T,SBUO,SBU,SBU,SBU,SBU,SBU,SBU,SBUO,T,T,T,T,T],
  [T,T,T,SBUO,SBU,SBU,SBU,SBU,SBU,SBU,SBUO,T,T,T,T,T],
  [T,T,T,T,SBUO,SBU,SBU,SBU,SBU,SBUO,T,T,T,T,T,T],
  [T,T,T,T,T,SBUO,SBUO,SBUO,SBUO,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,SBUO,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,SBUO,SBU,SBUO,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,SBUO,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
];

export function drawPixelFrame(
  ctx: CanvasRenderingContext2D,
  frame: PixelFrame,
  x: number,
  y: number,
  pixelSize: number = 1,
  rotation: number = 0
): void {
  ctx.save();
  const centerX = x + (frame[0].length * pixelSize) / 2;
  const centerY = y + (frame.length * pixelSize) / 2;
  ctx.translate(centerX, centerY);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-centerX, -centerY);

  for (let row = 0; row < frame.length; row++) {
    for (let col = 0; col < frame[row].length; col++) {
      const color = frame[row][col];
      if (color !== 'transparent') {
        ctx.fillStyle = color;
        ctx.fillRect(
          x + col * pixelSize,
          y + row * pixelSize,
          pixelSize,
          pixelSize
        );
      }
    }
  }
  ctx.restore();
}

export function drawGrass(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  for (let row = 0; row < height; row += 2) {
    for (let col = 0; col < width; col += 2) {
      const isLight = (Math.floor(row / 2) + Math.floor(col / 2)) % 2 === 0;
      ctx.fillStyle = isLight ? COLORS.GRASS_LIGHT : COLORS.GRASS_DARK;
      ctx.fillRect(col, row, 2, 2);
    }
  }
}

export function drawClouds(
  ctx: CanvasRenderingContext2D,
  _width: number,
  _height: number
): void {
  const cloudPositions = [
    { x: 30, y: 20 },
    { x: 180, y: 40 },
    { x: 250, y: 15 },
  ];

  ctx.fillStyle = COLORS.CLOUD;
  cloudPositions.forEach(({ x, y }) => {
    ctx.fillRect(x, y, 4, 2);
    ctx.fillRect(x + 2, y - 2, 6, 2);
    ctx.fillRect(x - 2, y + 2, 10, 2);
    ctx.fillRect(x, y + 4, 6, 2);
  });
}

export function getStatusBarColor(value: number): string {
  if (value >= 60) return COLORS.BAR_GREEN;
  if (value >= 30) return COLORS.BAR_YELLOW;
  return COLORS.BAR_RED;
}

export function getSpriteFrameByMood(
  mood: number,
  animationType: string,
  frame: number
): PixelFrame {
  if (mood <= 0) return SPRITE_FAINT_FRAME;
  if (mood <= 20) return SPRITE_SAD_FRAME;

  switch (animationType) {
    case 'walk':
      return frame % 2 === 0 ? SPRITE_WALK_FRAME_1 : SPRITE_WALK_FRAME_2;
    case 'jump':
      return SPRITE_JUMP_FRAME;
    case 'sleep':
      return SPRITE_SLEEP_FRAME;
    default:
      return frame % 2 === 0 ? SPRITE_IDLE_FRAME_1 : SPRITE_IDLE_FRAME_2;
  }
}

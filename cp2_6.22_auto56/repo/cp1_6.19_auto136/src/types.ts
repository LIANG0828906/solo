export enum BodyPart {
  SKIN = 'skin',
  HAIR = 'hair',
  TOP = 'top',
  BOTTOM = 'bottom',
  SHOES = 'shoes',
  WEAPON = 'weapon',
  ACCESSORY = 'accessory'
}

export interface WardrobeItem {
  id: string;
  name: string;
  color: string;
  part: BodyPart;
  pattern?: string;
}

export type ActionType = 'idle' | 'walk' | 'jump';

export interface OutfitState {
  [BodyPart.SKIN]: string;
  [BodyPart.HAIR]: string;
  [BodyPart.TOP]: string;
  [BodyPart.BOTTOM]: string;
  [BodyPart.SHOES]: string;
  [BodyPart.WEAPON]: string;
  [BodyPart.ACCESSORY]: string;
}

export interface AnimationFrame {
  yOffset: number;
  leftLegOffset: number;
  rightLegOffset: number;
  leftArmOffset: number;
  rightArmOffset: number;
}

export interface FlashState {
  part: BodyPart;
  startTime: number;
}

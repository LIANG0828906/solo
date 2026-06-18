export type EmotionType = 'joy' | 'sadness' | 'nostalgia' | 'anticipation' | 'calm';

export type CapsuleStatus = 'pending' | 'opened' | 'read';

export interface Capsule {
  id: string;
  text: string;
  imageBase64: string | null;
  emotion: EmotionType;
  openAt: number;
  createdAt: number;
  status: CapsuleStatus;
  emotionTrajectory: number[];
}

export interface CreateCapsuleInput {
  text: string;
  imageBase64: string | null;
  emotion: EmotionType;
  openAt: number;
}

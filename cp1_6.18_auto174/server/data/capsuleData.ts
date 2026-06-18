import { Capsule, CreateCapsuleInput, EmotionType } from '../../shared/types.js';
import { v4 as uuidv4 } from 'uuid';

const capsulesMap = new Map<string, Capsule>();

function generateEmotionTrajectory(emotion: EmotionType, text: string): number[] {
  const baseIntensity = Math.min(1, text.length / 200);
  const points: number[] = [];
  const numPoints = 20;

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const bellCurve = Math.exp(-Math.pow((t - 0.5) * 3, 2));
    const noise = (Math.random() - 0.5) * 0.15;
    let intensity = baseIntensity * bellCurve + noise;

    switch (emotion) {
      case 'joy':
        intensity = Math.max(0.3, intensity * 1.2);
        break;
      case 'sadness':
        intensity = Math.max(0.2, intensity * 0.9);
        break;
      case 'nostalgia':
        intensity = Math.max(0.25, intensity * 1.0);
        break;
      case 'anticipation':
        intensity = Math.max(0.35, intensity * 1.1);
        break;
      case 'calm':
        intensity = Math.max(0.4, intensity * 0.8);
        break;
    }

    points.push(Math.min(1, Math.max(0, intensity)));
  }

  return points;
}

export function createCapsule(input: CreateCapsuleInput): Capsule {
  const id = uuidv4();
  const now = Date.now();
  const capsule: Capsule = {
    id,
    text: input.text,
    imageBase64: input.imageBase64,
    emotion: input.emotion,
    openAt: input.openAt,
    createdAt: now,
    status: 'pending',
    emotionTrajectory: generateEmotionTrajectory(input.emotion, input.text),
  };
  capsulesMap.set(id, capsule);
  return capsule;
}

export function getCapsule(id: string): Capsule | undefined {
  return capsulesMap.get(id);
}

export function getAllCapsules(): Capsule[] {
  return Array.from(capsulesMap.values()).sort((a, b) => a.openAt - b.openAt);
}

export function updateCapsuleStatus(id: string, status: Capsule['status']): Capsule | undefined {
  const capsule = capsulesMap.get(id);
  if (capsule) {
    capsule.status = status;
    return capsule;
  }
  return undefined;
}

export function deleteCapsule(id: string): boolean {
  return capsulesMap.delete(id);
}

export function getPendingCapsules(): Capsule[] {
  return getAllCapsules().filter((c) => c.status === 'pending');
}

export function getOpenedUnreadCapsules(): Capsule[] {
  return getAllCapsules().filter((c) => c.status === 'opened');
}

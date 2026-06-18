import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type EmotionCategory = 'happy' | 'calm' | 'sad' | 'angry';

interface AudioFeatures {
  pitch: number;
  energy: number;
  zeroCrossingRate: number;
  duration: number;
}

interface EmotionMapping {
  valence: number;
  arousal: number;
  category: EmotionCategory;
}

function mapToEmotion(features: AudioFeatures): EmotionMapping {
  const { pitch, energy, zeroCrossingRate } = features;

  const normalizedPitch = Math.min(Math.max(pitch / 100, 0), 1);
  const normalizedEnergy = Math.min(Math.max(energy / 100, 0), 1);
  const normalizedZCR = Math.min(Math.max(zeroCrossingRate / 100, 0), 1);

  const valence = (normalizedPitch * 0.4 + normalizedEnergy * 0.3 + (1 - normalizedZCR * 0.5)) * 2 - 1;
  const arousal = (normalizedEnergy * 0.5 + normalizedZCR * 0.3 + normalizedPitch * 0.2) * 2 - 1;

  const clampedValence = Math.max(-1, Math.min(1, valence));
  const clampedArousal = Math.max(-1, Math.min(1, arousal));

  let category: EmotionCategory;
  if (clampedValence > 0 && clampedArousal > 0) {
    category = 'happy';
  } else if (clampedValence > 0 && clampedArousal <= 0) {
    category = 'calm';
  } else if (clampedValence <= 0 && clampedArousal <= 0) {
    category = 'sad';
  } else {
    category = 'angry';
  }

  return {
    valence: clampedValence,
    arousal: clampedArousal,
    category,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'GET') {
    const { all } = req.query;

    if (all === 'true') {
      try {
        const recordings = await prisma.recording.findMany({
          orderBy: {
            timestamp: 'desc',
          },
        });

        const formatted = recordings.map((r) => ({
          id: r.id,
          timestamp: r.timestamp.toISOString(),
          duration: r.duration,
          pitch: r.pitch,
          energy: r.energy,
          zeroCrossingRate: r.zeroCrossingRate,
          valence: r.valence,
          arousal: r.arousal,
          emotionCategory: r.emotionCategory as EmotionCategory,
        }));

        return res.status(200).json(formatted);
      } catch (error) {
        console.error('Failed to fetch history:', error);
        return res.status(500).json({ error: 'Failed to fetch history' });
      }
    }

    return res.status(400).json({ error: 'Invalid request' });
  }

  if (req.method === 'POST') {
    try {
      const { pitch, energy, zeroCrossingRate, duration }: AudioFeatures = req.body;

      if (
        typeof pitch !== 'number' ||
        typeof energy !== 'number' ||
        typeof zeroCrossingRate !== 'number' ||
        typeof duration !== 'number'
      ) {
        return res.status(400).json({ error: 'Invalid input data' });
      }

      const emotion = mapToEmotion({ pitch, energy, zeroCrossingRate, duration });

      const recording = await prisma.recording.create({
        data: {
          duration,
          pitch,
          energy,
          zeroCrossingRate,
          valence: emotion.valence,
          arousal: emotion.arousal,
          emotionCategory: emotion.category,
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      return res.status(200).json({
        id: recording.id,
        timestamp: recording.timestamp.toISOString(),
        duration: recording.duration,
        pitch: recording.pitch,
        energy: recording.energy,
        zeroCrossingRate: recording.zeroCrossingRate,
        valence: recording.valence,
        arousal: recording.arousal,
        emotionCategory: recording.emotionCategory as EmotionCategory,
      });
    } catch (error) {
      console.error('Failed to analyze emotion:', error);
      return res.status(500).json({ error: 'Failed to analyze emotion' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}

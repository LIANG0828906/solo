import { useCallback } from 'react';
import type { AudioFeatures, EmotionCoords } from '../types';

interface AudioAnalyzerProps {
  onAnalyzed?: (coords: EmotionCoords, features: AudioFeatures) => void;
}

export default function AudioAnalyzer({ onAnalyzed }: AudioAnalyzerProps) {
  const analyzeAudio = useCallback(
    async (audioBlob: Blob): Promise<{ coords: EmotionCoords; features: AudioFeatures }> => {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const channelData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;

      let energySum = 0;
      const energies: number[] = [];
      const frameSize = Math.floor(sampleRate * 0.02);

      for (let i = 0; i < channelData.length; i += frameSize) {
        let frameEnergy = 0;
        const end = Math.min(i + frameSize, channelData.length);
        for (let j = i; j < end; j++) {
          frameEnergy += channelData[j] * channelData[j];
        }
        frameEnergy = Math.sqrt(frameEnergy / (end - i));
        energies.push(frameEnergy);
        energySum += frameEnergy;
      }

      const avgEnergy = energySum / energies.length;
      const energyVariance =
        energies.reduce((sum, e) => sum + Math.pow(e - avgEnergy, 2), 0) / energies.length;

      let zeroCrossings = 0;
      for (let i = 1; i < channelData.length; i++) {
        if (channelData[i - 1] * channelData[i] < 0) {
          zeroCrossings++;
        }
      }
      const pitch = (zeroCrossings / channelData.length) * sampleRate * 0.5;

      let voicedFrames = 0;
      const energyThreshold = avgEnergy * 0.3;
      for (const e of energies) {
        if (e > energyThreshold) voicedFrames++;
      }
      const speechRate = (voicedFrames / energies.length) * 200;

      const normalizedPitch = Math.min(100, (pitch / 400) * 100);
      const normalizedEnergy = Math.min(100, avgEnergy * 5000);
      const normalizedEnergyVar = Math.min(100, energyVariance * 20000);

      const arousal = Math.min(100, Math.max(0, speechRate * 0.5 + normalizedEnergy * 0.5));
      const valence = Math.min(
        100,
        Math.max(0, normalizedPitch * 0.4 + (100 - normalizedEnergyVar) * 0.3 + 30)
      );

      const features: AudioFeatures = {
        speechRate,
        pitch: normalizedPitch,
        energy: normalizedEnergy,
        energyVariance: normalizedEnergyVar,
      };

      const coords: EmotionCoords = {
        arousal,
        valence,
      };

      if (onAnalyzed) {
        onAnalyzed(coords, features);
      }

      return { coords, features };
    },
    [onAnalyzed]
  );

  return { analyzeAudio };
}

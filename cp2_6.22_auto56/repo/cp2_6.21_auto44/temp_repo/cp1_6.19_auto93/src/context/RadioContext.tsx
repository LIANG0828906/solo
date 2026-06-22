import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Channel, TuningState, AudioState, NoiseParams, RadioContextType } from '../types';
import { channelManager } from '../services/ChannelManager';
import { staticSimulator } from '../services/StaticSimulator';
import { audioEngine } from '../engine/AudioEngine';

const RadioContext = createContext<RadioContextType | undefined>(undefined);

export function RadioProvider({ children }: { children: ReactNode }) {
  const [channels] = useState<Channel[]>(channelManager.getChannels());
  const [tuningState, setTuningState] = useState<TuningState>(() =>
    channelManager.calculateTuningState(0)
  );
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    volume: 0.7,
    noiseMix: 0.5,
    spectrumData: new Uint8Array(64),
  });
  const [noiseParams, setNoiseParams] = useState<NoiseParams>(
    staticSimulator.calculateNoiseParams(0, 0.5)
  );

  const setTuningAngle = useCallback((angle: number) => {
    const newTuningState = channelManager.calculateTuningState(angle);
    setTuningState(newTuningState);

    const newNoiseParams = staticSimulator.calculateNoiseParams(
      newTuningState.signalStrength,
      audioState.noiseMix
    );
    setNoiseParams(newNoiseParams);
    audioEngine.setNoiseParams(newNoiseParams);
    audioEngine.setSignalMix(newTuningState.signalStrength);

    if (newTuningState.nearestChannel && newTuningState.signalStrength > 0) {
      audioEngine.playChannel(newTuningState.nearestChannel.audioUrl);
      setAudioState((prev) => ({ ...prev, isPlaying: true }));
    } else {
      audioEngine.stopChannel();
      setAudioState((prev) => ({ ...prev, isPlaying: false }));
    }
  }, [audioState.noiseMix]);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setAudioState((prev) => ({ ...prev, volume: clampedVolume }));
    audioEngine.setVolume(clampedVolume);
  }, []);

  const setNoiseMix = useCallback((mix: number) => {
    const clampedMix = Math.max(0, Math.min(1, mix));
    setAudioState((prev) => ({ ...prev, noiseMix: clampedMix }));

    const newNoiseParams = staticSimulator.calculateNoiseParams(
      tuningState.signalStrength,
      clampedMix
    );
    setNoiseParams(newNoiseParams);
    audioEngine.setNoiseParams(newNoiseParams);
  }, [tuningState.signalStrength]);

  useEffect(() => {
    audioEngine.setOnSpectrumUpdate((data) => {
      setAudioState((prev) => ({ ...prev, spectrumData: data }));
    });

    return () => {
      audioEngine.destroy();
    };
  }, []);

  return (
    <RadioContext.Provider
      value={{
        channels,
        tuningState,
        audioState,
        noiseParams,
        setTuningAngle,
        setVolume,
        setNoiseMix,
      }}
    >
      {children}
    </RadioContext.Provider>
  );
}

export function useRadio() {
  const context = useContext(RadioContext);
  if (context === undefined) {
    throw new Error('useRadio must be used within a RadioProvider');
  }
  return context;
}

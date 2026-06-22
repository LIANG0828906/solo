import { useState, useEffect, useCallback, useRef } from 'react';
import { AudioEngine } from '@audio/AudioEngine';
import { useMixerStore } from '@store/useStore';
import { EffectType, AudioEngineState, PlaybackState } from '@types/index';

export function useAudioEngine() {
  const [initialized, setInitialized] = useState(false);
  const engineRef = useRef<AudioEngine | null>(null);
  const setState = useMixerStore((state) => state.setState);
  const setPlaybackState = useMixerStore((state) => state.setPlaybackState);

  useEffect(() => {
    const engine = AudioEngine.getInstance();
    engineRef.current = engine;

    const initEngine = async () => {
      try {
        await engine.init();
        setInitialized(true);
        setState(engine.getState());
      } catch (e) {
        console.error('Failed to initialize AudioEngine:', e);
      }
    };

    initEngine();

    const unsubscribe = engine.subscribe((state: AudioEngineState) => {
      setState(state);
    });

    return () => {
      unsubscribe();
    };
  }, [setState]);

  const play = useCallback(() => {
    engineRef.current?.resumeContext();
    engineRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    engineRef.current?.pause();
  }, []);

  const stop = useCallback(() => {
    engineRef.current?.stop();
  }, []);

  const seek = useCallback((time: number) => {
    engineRef.current?.seek(time);
  }, []);

  const addTrack = useCallback(() => {
    return engineRef.current?.addTrack();
  }, []);

  const removeTrack = useCallback((trackId: string) => {
    return engineRef.current?.removeTrack(trackId);
  }, []);

  const renameTrack = useCallback((trackId: string, name: string) => {
    return engineRef.current?.renameTrack(trackId, name);
  }, []);

  const setTrackVolume = useCallback((trackId: string, volume: number) => {
    return engineRef.current?.setTrackVolume(trackId, volume);
  }, []);

  const setTrackPan = useCallback((trackId: string, pan: number) => {
    return engineRef.current?.setTrackPan(trackId, pan);
  }, []);

  const toggleTrackMute = useCallback((trackId: string) => {
    return engineRef.current?.toggleTrackMute(trackId);
  }, []);

  const toggleTrackSolo = useCallback((trackId: string) => {
    return engineRef.current?.toggleTrackSolo(trackId);
  }, []);

  const addEffect = useCallback((trackId: string, effectType: EffectType, slotIndex: number) => {
    return engineRef.current?.addEffect(trackId, effectType, slotIndex);
  }, []);

  const removeEffect = useCallback((trackId: string, effectId: string) => {
    return engineRef.current?.removeEffect(trackId, effectId);
  }, []);

  const setEffectParam = useCallback((trackId: string, effectId: string, paramName: string, value: number) => {
    return engineRef.current?.setEffectParam(trackId, effectId, paramName, value);
  }, []);

  const toggleEffectBypass = useCallback((trackId: string, effectId: string) => {
    return engineRef.current?.toggleEffectBypass(trackId, effectId);
  }, []);

  const importAudioFile = useCallback(async (trackId: string, file: File) => {
    return await engineRef.current?.importAudioFile(trackId, file);
  }, []);

  const addTrackWithFile = useCallback(async (file: File) => {
    return await engineRef.current?.addTrackWithFile(file);
  }, []);

  const setMasterVolume = useCallback((volume: number) => {
    engineRef.current?.setMasterVolume(volume);
  }, []);

  const setBPM = useCallback((bpm: number) => {
    engineRef.current?.setBPM(bpm);
  }, []);

  const cutSelection = useCallback((trackId: string, startTime: number, endTime: number) => {
    return engineRef.current?.cutSelection(trackId, startTime, endTime);
  }, []);

  const copySelection = useCallback((trackId: string, startTime: number, endTime: number) => {
    return engineRef.current?.copySelection(trackId, startTime, endTime);
  }, []);

  const pasteToTrack = useCallback((trackId: string, insertTime: number) => {
    return engineRef.current?.pasteToTrack(trackId, insertTime);
  }, []);

  const pasteToNewTrack = useCallback((insertTime: number) => {
    return engineRef.current?.pasteToNewTrack(insertTime);
  }, []);

  const deleteSelection = useCallback((trackId: string, startTime: number, endTime: number) => {
    return engineRef.current?.deleteSelection(trackId, startTime, endTime);
  }, []);

  const getTrack = useCallback((trackId: string) => {
    return engineRef.current?.getTrack(trackId);
  }, []);

  return {
    initialized,
    engine: engineRef.current,
    play,
    pause,
    stop,
    seek,
    addTrack,
    removeTrack,
    renameTrack,
    setTrackVolume,
    setTrackPan,
    toggleTrackMute,
    toggleTrackSolo,
    addEffect,
    removeEffect,
    setEffectParam,
    toggleEffectBypass,
    importAudioFile,
    addTrackWithFile,
    setMasterVolume,
    setBPM,
    cutSelection,
    copySelection,
    pasteToTrack,
    pasteToNewTrack,
    deleteSelection,
    getTrack,
  };
}

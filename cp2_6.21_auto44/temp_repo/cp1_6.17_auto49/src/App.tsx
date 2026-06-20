import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from './store';
import { BeatEngine } from './beatEngine';
import { SoundEngine } from './soundEngine';
import { Visualizer } from './visualizer';
import BpmControl from './components/BpmControl';
import PatternEditor from './components/PatternEditor';
import {
  SoundType,
  BeatType,
  PRIMARY_COLOR,
  PRIMARY_HOVER_COLOR,
  CONTROL_BG,
  APP_BG,
} from './types';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beatEngineRef = useRef<BeatEngine | null>(null);
  const soundEngineRef = useRef<SoundEngine | null>(null);
  const visualizerRef = useRef<Visualizer | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const {
    bpm,
    isPlaying,
    patterns,
    activePatternId,
    soundType,
    volume,
    customPatternLength,
    setBpm,
    setIsPlaying,
    setActivePattern,
    setSoundType,
    setVolume,
    setCustomPatternLength,
    updateBeatInPattern,
    getActivePattern,
  } = useAppStore();

  useEffect(() => {
    beatEngineRef.current = new BeatEngine();
    soundEngineRef.current = new SoundEngine();

    return () => {
      beatEngineRef.current?.destroy();
      soundEngineRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (canvasRef.current && !visualizerRef.current) {
      visualizerRef.current = new Visualizer(canvasRef.current);
      visualizerRef.current.renderStatic();
    }

    const handleResize = () => {
      if (visualizerRef.current) {
        visualizerRef.current.resize();
        if (!isPlaying) {
          visualizerRef.current.renderStatic();
        }
      }
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      visualizerRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (!beatEngineRef.current) return;

    const beatEngine = beatEngineRef.current;
    const soundEngine = soundEngineRef.current;
    const visualizer = visualizerRef.current;

    const unsubscribe = beatEngine.onBeat((signal) => {
      soundEngine?.playBeat(signal);
      visualizer?.onBeat(signal);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (beatEngineRef.current) {
      beatEngineRef.current.setBpm(bpm);
    }
  }, [bpm]);

  useEffect(() => {
    if (beatEngineRef.current) {
      const activePattern = getActivePattern();
      if (activePattern) {
        beatEngineRef.current.setPattern(activePattern.beats);
      }
    }
  }, [activePatternId, patterns, getActivePattern]);

  useEffect(() => {
    if (soundEngineRef.current) {
      soundEngineRef.current.setSoundType(soundType);
    }
  }, [soundType]);

  useEffect(() => {
    if (soundEngineRef.current) {
      soundEngineRef.current.setVolume(volume);
    }
  }, [volume]);

  useEffect(() => {
    if (!beatEngineRef.current || !visualizerRef.current) return;

    if (isPlaying) {
      beatEngineRef.current.start();
      visualizerRef.current.start();
    } else {
      beatEngineRef.current.stop();
    }
  }, [isPlaying]);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying, setIsPlaying]);

  const handlePatternChange = useCallback(
    (patternId: string) =>
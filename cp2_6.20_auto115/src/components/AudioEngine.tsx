import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { Track, MixSettings, EQPreset, EQ_PRESETS, EQFilterConfig } from '../types/audio';
import { generateWaveformData, validateAudioFile } from '../utils/audioUtils';

interface AudioEngineContextType {
  audioContext: AudioContext | null;
  tracks: Track[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  masterVolume: number;
  masterPan: number;
  activePreset: string | null;
  spectrumData: Uint8Array;
  loadAudioFile: (file: File, trackId: string) => Promise<boolean>;
  togglePlay: (trackId?: string) => void;
  stopAll: () => void;
  setTrackVolume: (trackId: string, volume: number) => void;
  setMasterVolume: (volume: number) => void;
  setMasterPan: (pan: number) => void;
  seekTo: (time: number) => void;
  applyPreset: (presetName: string) => void;
  exportSettings: () => void;
  importSettings: (file: File) => Promise<boolean>;
  addEmptyTrack: () => string;
  playTone: (frequency: number) => void;
}

const AudioEngineContext = createContext<AudioEngineContextType | null>(null);

export const useAudioEngine = () => {
  const context = useContext(AudioEngineContext);
  if (!context) {
    throw new Error('useAudioEngine must be used within AudioEngineProvider');
  }
  return context;
};

interface TrackNodes {
  source: AudioBufferSourceNode | null;
  gainNode: GainNode;
  panNode: StereoPannerNode;
  filterNodes: BiquadFilterNode[];
  startOffset: number;
  startTime: number;
}

export const AudioEngineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const masterPanRef = useRef<StereoPannerNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const trackNodesRef = useRef<Map<string, TrackNodes>>(new Map());
  const spectrumDataRef = useRef<Uint8Array<ArrayBuffer>>(new Uint8Array(new ArrayBuffer(256)));
  const rafIdRef = useRef<number>(0);
  const isPlayingRef = useRef(false);

  const [tracks, setTracks] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [masterVolume, setMasterVolumeState] = useState(80);
  const [masterPan, setMasterPanState] = useState(0);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      masterGainRef.current = audioContextRef.current.createGain();
      masterGainRef.current.gain.value = 0.8;
      masterPanRef.current = audioContextRef.current.createStereoPanner();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;

      masterGainRef.current.connect(masterPanRef.current);
      masterPanRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  const createTrackNodes = useCallback((trackId: string, eqFilters: EQFilterConfig[]) => {
    if (!audioContextRef.current) return null;

    const ctx = audioContextRef.current;
    const gainNode = ctx.createGain();
    const panNode = ctx.createStereoPanner();
    const filterNodes: BiquadFilterNode[] = [];

    eqFilters.forEach((filterConfig) => {
      const filter = ctx.createBiquadFilter();
      filter.type = filterConfig.type;
      filter.frequency.value = filterConfig.frequency;
      filter.gain.value = filterConfig.gain;
      filter.Q.value = filterConfig.Q;
      filterNodes.push(filter);
    });

    if (filterNodes.length > 0) {
      for (let i = 0; i < filterNodes.length - 1; i++) {
        filterNodes[i].connect(filterNodes[i + 1]);
      }
      filterNodes[filterNodes.length - 1].connect(gainNode);
    }

    gainNode.connect(panNode);
    panNode.connect(masterGainRef.current!);

    trackNodesRef.current.set(trackId, {
      source: null,
      gainNode,
      panNode,
      filterNodes,
      startOffset: 0,
      startTime: 0,
    });

    return trackNodesRef.current.get(trackId)!;
  }, []);

  const addEmptyTrack = useCallback((): string => {
    const trackId = `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const defaultFilters: EQFilterConfig[] = [
      { type: 'lowshelf', frequency: 100, gain: 0, Q: 1 },
      { type: 'peaking', frequency: 1000, gain: 0, Q: 1 },
      { type: 'highshelf', frequency: 8000, gain: 0, Q: 1 },
    ];

    const newTrack: Track = {
      id: trackId,
      name: '空轨道',
      duration: 0,
      volume: 80,
      pan: 0,
      audioBuffer: null,
      waveformData: [],
      isPlaying: false,
      isLoaded: false,
      eqFilters: defaultFilters,
    };

    createTrackNodes(trackId, defaultFilters);
    setTracks((prev) => [...prev, newTrack]);
    return trackId;
  }, [createTrackNodes]);

  useEffect(() => {
    if (tracks.length === 0) {
      addEmptyTrack();
    }
  }, [addEmptyTrack, tracks.length]);

  const loadAudioFile = useCallback(
    async (file: File, trackId: string): Promise<boolean> => {
      initAudioContext();

      const validation = validateAudioFile(file);
      if (!validation.valid) {
        alert(validation.message);
        return false;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioContextRef.current!.decodeAudioData(arrayBuffer.slice(0));

        if (audioBuffer.duration > 30) {
          alert('音频文件时长不能超过30秒');
          return false;
        }

        const waveformData = generateWaveformData(audioBuffer, 100);

        setTracks((prev) =>
          prev.map((track) =>
            track.id === trackId
              ? {
                  ...track,
                  name: file.name,
                  duration: audioBuffer.duration,
                  audioBuffer,
                  waveformData,
                  isLoaded: true,
                }
              : track
          )
        );

        setDuration((prev) => Math.max(prev, audioBuffer.duration));
        return true;
      } catch (error) {
        console.error('加载音频文件失败:', error);
        alert('加载音频文件失败');
        return false;
      }
    },
    [initAudioContext]
  );

  const startTrackPlayback = useCallback((trackId: string, offset: number = 0) => {
    const track = tracks.find((t) => t.id === trackId);
    const nodes = trackNodesRef.current.get(trackId);
    if (!track || !track.audioBuffer || !nodes || !audioContextRef.current) return;

    if (nodes.source) {
      try {
        nodes.source.stop();
      } catch (e) {}
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = track.audioBuffer;

    if (nodes.filterNodes.length > 0) {
      source.connect(nodes.filterNodes[0]);
    } else {
      source.connect(nodes.gainNode);
    }

    nodes.source = source;
    nodes.startTime = audioContextRef.current.currentTime;
    nodes.startOffset = Math.min(offset, track.duration);

    try {
      source.start(0, nodes.startOffset);
    } catch (e) {
      console.error('启动音频失败:', e);
    }

    source.onended = () => {
      setTracks((prev) =>
        prev.map((t) => (t.id === trackId ? { ...t, isPlaying: false } : t))
      );
    };
  }, [tracks]);

  const stopTrackPlayback = useCallback((trackId: string, recordOffset: boolean = true) => {
    const nodes = trackNodesRef.current.get(trackId);
    if (!nodes || !nodes.source || !audioContextRef.current) return;

    if (recordOffset) {
      const elapsed = audioContextRef.current.currentTime - nodes.startTime;
      nodes.startOffset = (nodes.startOffset + elapsed) % (tracks.find(t => t.id === trackId)?.duration || 1);
    }

    try {
      nodes.source.stop();
    } catch (e) {}
    nodes.source = null;
  }, [tracks]);

  const togglePlay = useCallback(
    (trackId?: string) => {
      initAudioContext();

      if (trackId) {
        setTracks((prev) =>
          prev.map((track) => {
            if (track.id === trackId && track.isLoaded) {
              if (track.isPlaying) {
                stopTrackPlayback(trackId);
                return { ...track, isPlaying: false };
              } else {
                const nodes = trackNodesRef.current.get(trackId);
                startTrackPlayback(trackId, nodes?.startOffset || 0);
                return { ...track, isPlaying: true };
              }
            }
            return track;
          })
        );
      } else {
        const anyPlaying = tracks.some((t) => t.isPlaying);
        if (anyPlaying) {
          tracks.forEach((track) => {
            if (track.isPlaying) {
              stopTrackPlayback(track.id);
            }
          });
          setTracks((prev) => prev.map((t) => ({ ...t, isPlaying: false })));
          setIsPlaying(false);
          isPlayingRef.current = false;
        } else {
          tracks.forEach((track) => {
            if (track.isLoaded) {
              const nodes = trackNodesRef.current.get(track.id);
              startTrackPlayback(track.id, nodes?.startOffset || 0);
            }
          });
          setTracks((prev) => prev.map((t) => (t.isLoaded ? { ...t, isPlaying: true } : t)));
          setIsPlaying(true);
          isPlayingRef.current = true;
        }
      }
    },
    [initAudioContext, tracks, startTrackPlayback, stopTrackPlayback]
  );

  const stopAll = useCallback(() => {
    tracks.forEach((track) => {
      const nodes = trackNodesRef.current.get(track.id);
      if (nodes) {
        nodes.startOffset = 0;
      }
      stopTrackPlayback(track.id, false);
    });
    setTracks((prev) => prev.map((t) => ({ ...t, isPlaying: false })));
    setIsPlaying(false);
    isPlayingRef.current = false;
    setCurrentTime(0);
  }, [tracks, stopTrackPlayback]);

  const setTrackVolume = useCallback((trackId: string, volume: number) => {
    const nodes = trackNodesRef.current.get(trackId);
    if (nodes) {
      nodes.gainNode.gain.value = volume / 100;
    }
    setTracks((prev) =>
      prev.map((track) => (track.id === trackId ? { ...track, volume } : track))
    );
  }, []);

  const setMasterVolume = useCallback((volume: number) => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = volume / 100;
    }
    setMasterVolumeState(volume);
  }, []);

  const setMasterPan = useCallback((pan: number) => {
    if (masterPanRef.current) {
      masterPanRef.current.pan.value = pan / 50;
    }
    setMasterPanState(pan);
  }, []);

  const seekTo = useCallback(
    (time: number) => {
      const clampedTime = Math.max(0, Math.min(time, duration));
      setCurrentTime(clampedTime);

      tracks.forEach((track) => {
        if (!track.isLoaded) return;
        const nodes = trackNodesRef.current.get(track.id);
        if (!nodes) return;

        const wasPlaying = track.isPlaying;
        if (wasPlaying) {
          stopTrackPlayback(track.id, false);
        }
        nodes.startOffset = clampedTime;
        if (wasPlaying) {
          startTrackPlayback(track.id, clampedTime);
        }
      });
    },
    [duration, tracks, startTrackPlayback, stopTrackPlayback]
  );

  const applyPreset = useCallback(
    (presetName: string) => {
      const preset: EQPreset | undefined = EQ_PRESETS[presetName];
      if (!preset) return;

      setActivePreset(presetName);

      setTracks((prev) =>
        prev.map((track) => {
          const nodes = trackNodesRef.current.get(track.id);
          if (nodes) {
            while (nodes.filterNodes.length > 0) {
              const filter = nodes.filterNodes.pop();
              if (filter) {
                try {
                  filter.disconnect();
                } catch (e) {}
              }
            }

            preset.filters.forEach((filterConfig) => {
              if (!audioContextRef.current) return;
              const filter = audioContextRef.current.createBiquadFilter();
              filter.type = filterConfig.type;
              filter.frequency.value = filterConfig.frequency;
              filter.gain.value = filterConfig.gain;
              filter.Q.value = filterConfig.Q;
              nodes.filterNodes.push(filter);
            });

            if (nodes.filterNodes.length > 0) {
              for (let i = 0; i < nodes.filterNodes.length - 1; i++) {
                nodes.filterNodes[i].connect(nodes.filterNodes[i + 1]);
              }
              nodes.filterNodes[nodes.filterNodes.length - 1].connect(nodes.gainNode);
              if (nodes.source !== undefined && nodes.source !== null) {
                try {
                  nodes.source.disconnect();
                } catch (e) {}
                nodes.source.connect(nodes.filterNodes[0]);
              }
            } else if (nodes.source !== undefined && nodes.source !== null) {
              try {
                nodes.source.disconnect();
              } catch (e) {}
              nodes.source.connect(nodes.gainNode);
            }
          }

          return { ...track, eqFilters: [...preset.filters] };
        })
      );

      forceUpdate((n) => n + 1);
    },
    []
  );

  const SETTINGS_VERSION = '1.0.0';

  const exportSettings = useCallback(() => {
    const settings: MixSettings = {
      version: SETTINGS_VERSION,
      timestamp: Date.now(),
      masterVolume,
      masterPan,
      activePreset,
      tracks: tracks.map((track) => ({
        id: track.id,
        volume: track.volume,
        pan: track.pan,
        eqFilters: track.eqFilters,
      })),
    };

    const json = JSON.stringify(settings, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `mix-settings-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [masterVolume, masterPan, activePreset, tracks]);

  const importSettings = useCallback(
    async (file: File): Promise<boolean> => {
      try {
        const text = await file.text();
        const settings: MixSettings = JSON.parse(text);

        setMasterVolume(settings.masterVolume);
        setMasterPan(settings.masterPan);

        if (settings.activePreset && EQ_PRESETS[settings.activePreset]) {
          applyPreset(settings.activePreset);
        }

        settings.tracks.forEach((trackSetting) => {
          const nodes = trackNodesRef.current.get(trackSetting.id);
          if (nodes) {
            nodes.gainNode.gain.value = trackSetting.volume / 100;
            nodes.panNode.pan.value = trackSetting.pan / 50;
          }
        });

        setTracks((prev) =>
          prev.map((track) => {
            const imported = settings.tracks.find((t) => t.id === track.id);
            if (imported) {
              return {
                ...track,
                volume: imported.volume,
                pan: imported.pan,
                eqFilters: imported.eqFilters,
              };
            }
            return track;
          })
        );

        return true;
      } catch (error) {
        console.error('导入设置失败:', error);
        alert('导入设置失败，请检查文件格式');
        return false;
      }
    },
    [setMasterVolume, setMasterPan, applyPreset]
  );

  const playTone = useCallback((frequency: number) => {
    if (!audioContextRef.current) return;
    initAudioContext();

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  }, [initAudioContext]);

  useEffect(() => {
    const updateLoop = () => {
      if (analyserRef.current && isPlayingRef.current) {
        analyserRef.current.getByteFrequencyData(spectrumDataRef.current);
      } else {
        spectrumDataRef.current.fill(0);
      }

      if (audioContextRef.current && isPlayingRef.current && duration > 0) {
        let maxTime = 0;
        trackNodesRef.current.forEach((nodes, trackId) => {
          if (nodes.source) {
            const elapsed = audioContextRef.current!.currentTime - nodes.startTime;
            const current = nodes.startOffset + elapsed;
            maxTime = Math.max(maxTime, current);
          }
        });
        if (maxTime > 0) {
          setCurrentTime(Math.min(maxTime, duration));
        }
      }

      forceUpdate((n) => (n + 1) % 1000000);
      rafIdRef.current = requestAnimationFrame(updateLoop);
    };

    rafIdRef.current = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(rafIdRef.current);
  }, [duration]);

  const value: AudioEngineContextType = {
    audioContext: audioContextRef.current,
    tracks,
    isPlaying,
    currentTime,
    duration,
    masterVolume,
    masterPan,
    activePreset,
    spectrumData: spectrumDataRef.current,
    loadAudioFile,
    togglePlay,
    stopAll,
    setTrackVolume,
    setMasterVolume,
    setMasterPan,
    seekTo,
    applyPreset,
    exportSettings,
    importSettings,
    addEmptyTrack,
    playTone,
  };

  return (
    <AudioEngineContext.Provider value={value}>{children}</AudioEngineContext.Provider>
  );
};

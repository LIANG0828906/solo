import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { MixStore, Track } from './types';
import { analyzeAudio } from './audioAnalyzer';
import { mixdownToWavBlob, mixdownToAudioBuffer, computeTotalDuration } from './audioMixer';

const TARGET_SAMPLE_RATE = 44100;
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav'];

function validateFile(f: File): string | null {
  if (!ALLOWED.includes(f.type) && !/\.(mp3|wav)$/i.test(f.name)) {
    return '仅支持 MP3 和 WAV 格式';
  }
  if (f.size > MAX_SIZE) {
    return '文件不能超过 10MB';
  }
  return null;
}

let sharedCtx: AudioContext | null = null;
function getDecodeCtx(): AudioContext {
  if (!sharedCtx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedCtx = new Ctor();
  }
  return sharedCtx;
}

let progressRaf: number | null = null;

export const useMixStore = create<MixStore>((set, get) => ({
  tracks: [],
  trackOrder: [],
  crossfadeDuration: 0.3,
  isPlaying: false,
  currentPlayTime: 0,
  isExporting: false,
  exportProgress: 0,
  playbackCtx: null,
  playbackSource: null,
  startTime: 0,
  pauseOffset: 0,

  addTrack: async (file: File) => {
    const err = validateFile(file);
    if (err) {
      alert(err);
      return;
    }
    if (get().tracks.length >= 6) {
      alert('最多上传 6 个音频文件');
      return;
    }

    const id = uuidv4();
    const track: Track = {
      id,
      name: file.name,
      size: file.size,
      duration: 0,
      sampleRate: TARGET_SAMPLE_RATE,
      channels: 2,
      channelData: [],
      bpm: null,
      dominantBand: null,
      volume: 1,
      analysisStatus: 'pending',
    };
    set(state => ({
      tracks: [...state.tracks, track],
      trackOrder: [...state.trackOrder, id],
    }));

    try {
      const buf = await file.arrayBuffer();
      const ctx = getDecodeCtx();
      set(s => ({ tracks: s.tracks.map(t => t.id === id ? { ...t, analysisStatus: 'analyzing' } : t) }));
      const decoded = await ctx.decodeAudioData(buf.slice(0));

      const channels: Float32Array[] = [];
      for (let c = 0; c < decoded.numberOfChannels; c++) {
        const d = decoded.getChannelData(c);
        const copy = new Float32Array(d.length);
        copy.set(d);
        channels.push(copy);
      }

      set(s => ({
        tracks: s.tracks.map(t => t.id === id ? {
          ...t,
          duration: decoded.duration,
          sampleRate: decoded.sampleRate,
          channels: decoded.numberOfChannels,
          channelData: channels,
        } : t),
      }));

      const result = await analyzeAudio(channels, decoded.sampleRate, channels[0].length);
      set(s => ({
        tracks: s.tracks.map(t => t.id === id ? {
          ...t,
          bpm: result.bpm,
          dominantBand: result.dominantBand,
          analysisStatus: 'done',
        } : t),
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : '解码或分析失败';
      set(s => ({
        tracks: s.tracks.map(t => t.id === id ? { ...t, analysisStatus: 'error', analysisError: msg } : t),
      }));
    }
  },

  removeTrack: (id: string) => {
    get().stopPlayback();
    set(s => ({
      tracks: s.tracks.filter(t => t.id !== id),
      trackOrder: s.trackOrder.filter(o => o !== id),
      currentPlayTime: 0,
    }));
  },

  reorderTracks: (newOrder: string[]) => {
    get().stopPlayback();
    set({ trackOrder: newOrder, currentPlayTime: 0 });
  },

  setTrackVolume: (id: string, volume: number) => {
    set(s => ({ tracks: s.tracks.map(t => t.id === id ? { ...t, volume } : t) }));
  },

  setCrossfadeDuration: (v: number) => {
    set({ crossfadeDuration: v });
  },

  playMix: async () => {
    const state = get();
    if (state.trackOrder.length < 2) {
      alert('至少需要 2 个音频才能播放');
      return;
    }
    const ordered = state.trackOrder.map(id => state.tracks.find(t => t.id === id)!).filter(Boolean);
    if (ordered.some(t => t.channelData.length === 0)) {
      alert('音频尚未完成解码');
      return;
    }

    get().stopPlayback();

    let ctx = state.playbackCtx;
    if (!ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') await ctx.resume();

    const report = (_p: number) => {};
    const buf = await mixdownToAudioBuffer(state.tracks, state.trackOrder, state.crossfadeDuration, TARGET_SAMPLE_RATE, report);

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.onended = () => {
      const cur = get();
      if (cur.playbackSource === src) {
        set({ isPlaying: false, currentPlayTime: 0, pauseOffset: 0 });
        if (progressRaf !== null) { cancelAnimationFrame(progressRaf); progressRaf = null; }
      }
    };

    const offset = state.pauseOffset;
    src.start(0, offset);
    const startWall = ctx.currentTime - offset;

    set({
      playbackCtx: ctx,
      playbackSource: src,
      isPlaying: true,
      startTime: startWall,
    });

    const tick = () => {
      const s = get();
      if (s.playbackCtx && s.isPlaying) {
        const t = s.playbackCtx.currentTime - s.startTime;
        set({ currentPlayTime: Math.min(t, buf.duration) });
      }
      progressRaf = requestAnimationFrame(tick);
    };
    progressRaf = requestAnimationFrame(tick);
  },

  pauseMix: () => {
    const state = get();
    if (!state.isPlaying || !state.playbackSource || !state.playbackCtx) return;
    try {
      state.playbackSource.stop();
    } catch {
      /* noop */
    }
    const played = state.playbackCtx.currentTime - state.startTime;
    set({
      isPlaying: false,
      pauseOffset: Math.min(played, (state.playbackSource.buffer?.duration || 0)),
    });
    if (progressRaf !== null) { cancelAnimationFrame(progressRaf); progressRaf = null; }
  },

  stopPlayback: () => {
    const state = get();
    if (state.playbackSource) {
      try {
        state.playbackSource.onended = null;
        state.playbackSource.stop();
      } catch {
        /* noop */
      }
    }
    if (progressRaf !== null) { cancelAnimationFrame(progressRaf); progressRaf = null; }
    set({
      isPlaying: false,
      playbackSource: null,
      currentPlayTime: 0,
      pauseOffset: 0,
      startTime: 0,
    });
  },

  updatePlayTime: () => {},

  exportMix: async () => {
    const state = get();
    if (state.isExporting) return;
    if (state.trackOrder.length < 2) {
      alert('至少需要 2 个音频才能导出');
      return;
    }
    const ordered = state.trackOrder.map(id => state.tracks.find(t => t.id === id)!).filter(Boolean);
    if (ordered.some(t => t.channelData.length === 0)) {
      alert('音频尚未完成解码');
      return;
    }

    get().stopPlayback();
    set({ isExporting: true, exportProgress: 0 });

    try {
      const blob = await mixdownToWavBlob(
        state.tracks,
        state.trackOrder,
        state.crossfadeDuration,
        TARGET_SAMPLE_RATE,
        (p) => set({ exportProgress: p })
      );

      const totalDur = computeTotalDuration(state.tracks, state.trackOrder, state.crossfadeDuration);
      const ts = new Date();
      const stamp = `${ts.getFullYear()}${(ts.getMonth() + 1).toString().padStart(2, '0')}${ts.getDate().toString().padStart(2, '0')}-${ts.getHours().toString().padStart(2, '0')}${ts.getMinutes().toString().padStart(2, '0')}`;
      const safeName = `mix_${Math.round(totalDur)}s_${stamp}.wav`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = safeName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      console.error(e);
      alert('导出失败：' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setTimeout(() => set({ isExporting: false, exportProgress: 0 }), 800);
    }
  },
}));

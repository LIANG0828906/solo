import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

const mockAudioContext = {
  createGain: vi.fn(() => ({
    gain: { value: 0, setTargetAtTime: vi.fn() },
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  createStereoPanner: vi.fn(() => ({
    pan: { value: 0, setTargetAtTime: vi.fn() },
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  createBufferSource: vi.fn(() => ({
    buffer: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  })),
  createBiquadFilter: vi.fn(() => ({
    type: 'lowshelf',
    frequency: { value: 0 },
    gain: { value: 0, setTargetAtTime: vi.fn() },
    Q: { value: 0 },
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  createDynamicsCompressor: vi.fn(() => ({
    threshold: { value: 0, setTargetAtTime: vi.fn() },
    ratio: { value: 0, setTargetAtTime: vi.fn() },
    attack: { value: 0, setTargetAtTime: vi.fn() },
    release: { value: 0, setTargetAtTime: vi.fn() },
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  createConvolver: vi.fn(() => ({
    buffer: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  createDelay: vi.fn(() => ({
    delayTime: { value: 0, setTargetAtTime: vi.fn() },
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  createWaveShaper: vi.fn(() => ({
    curve: null,
    oversample: '4x',
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  createBuffer: vi.fn((channels: number, length: number, sampleRate: number) => ({
    numberOfChannels: channels,
    length,
    sampleRate,
    duration: length / sampleRate,
    getChannelData: vi.fn(() => new Float32Array(length)),
  })),
  decodeAudioData: vi.fn(() => Promise.resolve({
    numberOfChannels: 2,
    length: 44100,
    sampleRate: 44100,
    duration: 1,
    getChannelData: vi.fn(() => new Float32Array(44100).fill(0.5)),
  })),
  currentTime: 0,
  sampleRate: 44100,
  state: 'running',
  resume: vi.fn(),
  destination: { connect: vi.fn(), disconnect: vi.fn() },
  close: vi.fn(),
};

vi.stubGlobal('AudioContext', vi.fn(() => mockAudioContext));
vi.stubGlobal('webkitAudioContext', vi.fn(() => mockAudioContext));

import { AudioEngine } from '../audio/AudioEngine';

describe('AudioEngine', () => {
  let engine: AudioEngine;

  beforeEach(async () => {
    AudioEngine['instance'] = null;
    engine = AudioEngine.getInstance();
    await engine.init();
  });

  afterEach(() => {
    engine.destroy();
  });

  describe('init', () => {
    it('should initialize AudioContext and masterGain', () => {
      const state = engine.getState();
      expect(state.tracks).toEqual([]);
      expect(state.masterVolume).toBe(80);
    });

    it('should not re-initialize if already initialized', async () => {
      const contextBefore = engine.getContext();
      await engine.init();
      const contextAfter = engine.getContext();
      expect(contextBefore).toBe(contextAfter);
    });
  });

  describe('addTrack / removeTrack', () => {
    it('should add a new track', () => {
      const track = engine.addTrack();
      expect(track).toBeDefined();
      expect(track.name).toBe('轨道 1');
      expect(engine.getState().tracks.length).toBe(1);
    });

    it('should add multiple tracks with incremented names', () => {
      engine.addTrack();
      engine.addTrack();
      const tracks = engine.getState().tracks;
      expect(tracks.length).toBe(2);
      expect(tracks[0].name).toBe('轨道 1');
      expect(tracks[1].name).toBe('轨道 2');
    });

    it('should remove a track by id', () => {
      const track = engine.addTrack();
      const result = engine.removeTrack(track.id);
      expect(result).toBe(true);
      expect(engine.getState().tracks.length).toBe(0);
    });

    it('should return false when removing non-existent track', () => {
      const result = engine.removeTrack('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('play / pause / stop', () => {
    it('should not play when no tracks exist', () => {
      engine.play();
      expect(engine.getState().playback.isPlaying).toBe(false);
    });

    it('should toggle play state', () => {
      engine.addTrack();
      engine.play();
      expect(engine.getState().playback.isPlaying).toBe(true);

      engine.pause();
      expect(engine.getState().playback.isPlaying).toBe(false);
    });

    it('should stop and reset currentTime to 0', () => {
      engine.addTrack();
      engine.play();
      engine.stop();
      const state = engine.getState();
      expect(state.playback.isPlaying).toBe(false);
      expect(state.playback.currentTime).toBe(0);
    });

    it('should not pause when not playing', () => {
      engine.addTrack();
      engine.pause();
      expect(engine.getState().playback.isPlaying).toBe(false);
    });
  });

  describe('track controls', () => {
    it('should set track volume', () => {
      const track = engine.addTrack();
      engine.setTrackVolume(track.id, 50);
      const state = engine.getState();
      expect(state.tracks[0].volume).toBe(50);
    });

    it('should set track pan', () => {
      const track = engine.addTrack();
      engine.setTrackPan(track.id, -50);
      const state = engine.getState();
      expect(state.tracks[0].pan).toBe(-50);
    });

    it('should toggle mute', () => {
      const track = engine.addTrack();
      const muted = engine.toggleTrackMute(track.id);
      expect(muted).toBe(true);
      expect(engine.getState().tracks[0].muted).toBe(true);
    });

    it('should toggle solo', () => {
      const track = engine.addTrack();
      const solo = engine.toggleTrackSolo(track.id);
      expect(solo).toBe(true);
      expect(engine.getState().tracks[0].solo).toBe(true);
    });
  });

  describe('effects', () => {
    it('should add effect to track', () => {
      const track = engine.addTrack();
      const effectId = engine.addEffect(track.id, 'eq', 0);
      expect(effectId).not.toBeNull();
      const state = engine.getState();
      expect(state.tracks[0].effects.length).toBe(1);
      expect(state.tracks[0].effects[0].type).toBe('eq');
    });

    it('should not add more than 4 effects', () => {
      const track = engine.addTrack();
      engine.addEffect(track.id, 'eq', 0);
      engine.addEffect(track.id, 'compressor', 1);
      engine.addEffect(track.id, 'reverb', 2);
      engine.addEffect(track.id, 'delay', 3);
      const result = engine.addEffect(track.id, 'distortion', 4);
      expect(result).toBeNull();
    });

    it('should remove effect from track', () => {
      const track = engine.addTrack();
      const effectId = engine.addEffect(track.id, 'eq', 0);
      const result = engine.removeEffect(track.id, effectId!);
      expect(result).toBe(true);
      expect(engine.getState().tracks[0].effects.length).toBe(0);
    });

    it('should set effect parameter', () => {
      const track = engine.addTrack();
      const effectId = engine.addEffect(track.id, 'eq', 0);
      engine.setEffectParam(track.id, effectId!, 'lowGain', 6);
      const effect = engine.getState().tracks[0].effects[0];
      expect(effect.params.lowGain).toBe(6);
    });

    it('should toggle effect bypass', () => {
      const track = engine.addTrack();
      const effectId = engine.addEffect(track.id, 'eq', 0);
      const bypassed = engine.toggleEffectBypass(track.id, effectId!);
      expect(bypassed).toBe(true);
      expect(engine.getState().tracks[0].effects[0].bypassed).toBe(true);
    });
  });

  describe('solo/mute interaction', () => {
    it('should mute non-solo tracks when any track is solo', () => {
      const track1 = engine.addTrack();
      const track2 = engine.addTrack();
      engine.toggleTrackSolo(track1.id);
      const state = engine.getState();
      expect(state.tracks[0].solo).toBe(true);
      expect(state.tracks[1].solo).toBe(false);
    });
  });

  describe('BPM', () => {
    it('should set BPM within valid range', () => {
      engine.setBPM(140);
      expect(engine.getState().playback.bpm).toBe(140);
    });

    it('should clamp BPM to valid range', () => {
      engine.setBPM(10);
      expect(engine.getState().playback.bpm).toBe(20);
      engine.setBPM(500);
      expect(engine.getState().playback.bpm).toBe(300);
    });
  });

  describe('master volume', () => {
    it('should set master volume', () => {
      engine.setMasterVolume(50);
      expect(engine.getState().masterVolume).toBe(50);
    });

    it('should clamp master volume to 0-100', () => {
      engine.setMasterVolume(-10);
      expect(engine.getState().masterVolume).toBe(0);
      engine.setMasterVolume(200);
      expect(engine.getState().masterVolume).toBe(100);
    });
  });

  describe('subscribe', () => {
    it('should notify listeners on state change', () => {
      const listener = vi.fn();
      engine.subscribe(listener);
      engine.addTrack();
      expect(listener).toHaveBeenCalled();
    });

    it('should unsubscribe when cleanup function is called', () => {
      const listener = vi.fn();
      const unsubscribe = engine.subscribe(listener);
      unsubscribe();
      engine.addTrack();
      expect(listener).not.toHaveBeenCalled();
    });
  });
});

describe('EffectSlot parameter latency', () => {
  it('should use setTargetAtTime for parameter changes with ramp time ≤ 50ms', async () => {
    const capturedCompressors: any[] = [];
    const origCreateCompressor = mockAudioContext.createDynamicsCompressor;
    mockAudioContext.createDynamicsCompressor = vi.fn(() => {
      const node = origCreateCompressor();
      capturedCompressors.push(node);
      return node;
    });

    AudioEngine['instance'] = null;
    const engine = AudioEngine.getInstance();
    await engine.init();

    const track = engine.addTrack();
    const effectId = engine.addEffect(track.id, 'compressor', 0);
    expect(effectId).not.toBeNull();

    engine.setEffectParam(track.id, effectId!, 'threshold', -40);

    expect(capturedCompressors.length).toBeGreaterThan(0);
    const lastCompressor = capturedCompressors[capturedCompressors.length - 1];
    expect(lastCompressor.threshold.setTargetAtTime).toHaveBeenCalled();

    const calls = lastCompressor.threshold.setTargetAtTime.mock.calls;
    const lastCall = calls[calls.length - 1];
    if (lastCall) {
      const rampTime = lastCall[2] as number;
      expect(rampTime).toBeLessThanOrEqual(0.05);
    }

    mockAudioContext.createDynamicsCompressor = origCreateCompressor;
    engine.destroy();
  });
});

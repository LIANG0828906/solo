import { TrackType } from './trackNode';
export var PlayMode;
(function (PlayMode) {
    PlayMode["LOOP"] = "loop";
    PlayMode["SINGLE"] = "single";
    PlayMode["SHUFFLE"] = "shuffle";
})(PlayMode || (PlayMode = {}));
export class AudioMixer {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.trackStates = new Map();
        this.trackBuffers = new Map();
        this._isPlaying = false;
        this._playMode = PlayMode.LOOP;
        this._masterVolume = 80;
        this._currentTime = 0;
        this._duration = 8;
        this.animationFrameId = null;
        this.onProgressCallback = null;
        this.initAudioContext();
    }
    initAudioContext() {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = this._masterVolume / 100;
            this.generateAllTrackBuffers();
        }
        catch (e) {
            console.error('Failed to initialize audio context:', e);
        }
    }
    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            return this.audioContext.resume();
        }
        return Promise.resolve();
    }
    generateAllTrackBuffers() {
        if (!this.audioContext)
            return;
        this.trackBuffers.set(TrackType.GUITAR, this.generateGuitarBuffer());
        this.trackBuffers.set(TrackType.DRUMS, this.generateDrumsBuffer());
        this.trackBuffers.set(TrackType.BASS, this.generateBassBuffer());
        this.trackBuffers.set(TrackType.KEYBOARD, this.generateKeyboardBuffer());
        this.trackBuffers.set(TrackType.VOCALS, this.generateVocalsBuffer());
        this.trackBuffers.set(TrackType.SYNTH, this.generateSynthBuffer());
    }
    generateGuitarBuffer() {
        const ctx = this.audioContext;
        const sampleRate = ctx.sampleRate;
        const duration = this._duration;
        const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
        const bpm = 120;
        const beatDuration = 60 / bpm;
        const beatsPerMeasure = 4;
        for (let i = 0; i < duration; i++) {
            const noteIndex = i % notes.length;
            const freq = notes[noteIndex];
            const startSample = Math.floor(i * beatDuration * beatsPerMeasure * sampleRate / 8);
            const endSample = Math.floor((i + 1) * beatDuration * beatsPerMeasure * sampleRate / 8);
            for (let s = startSample; s < endSample && s < data.length; s++) {
                const t = (s - startSample) / sampleRate;
                const envelope = this.adsrEnvelope(t, 0.01, 0.1, 0.7, 0.2);
                const wave = Math.sin(2 * Math.PI * freq * t);
                data[s] = envelope * wave * 0.3;
            }
        }
        return buffer;
    }
    generateDrumsBuffer() {
        const ctx = this.audioContext;
        const sampleRate = ctx.sampleRate;
        const duration = this._duration;
        const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        const bpm = 120;
        const beatDuration = 60 / bpm;
        const samplesPerBeat = Math.floor(beatDuration * sampleRate);
        for (let beat = 0; beat < duration * (bpm / 60); beat++) {
            const startSample = beat * samplesPerBeat;
            if (beat % 2 === 0) {
                const kickFreq = 150;
                for (let s = 0; s < samplesPerBeat / 2 && startSample + s < data.length; s++) {
                    const t = s / sampleRate;
                    const freq = kickFreq * Math.exp(-t * 30);
                    const envelope = Math.exp(-t * 20);
                    data[startSample + s] += Math.sin(2 * Math.PI * freq * t) * envelope * 0.5;
                }
            }
            if (beat % 4 === 2) {
                for (let s = 0; s < samplesPerBeat / 3 && startSample + s < data.length; s++) {
                    const t = s / sampleRate;
                    const noise = (Math.random() * 2 - 1);
                    const envelope = Math.exp(-t * 40);
                    data[startSample + s] += noise * envelope * 0.4;
                }
            }
            const hhStart = startSample;
            for (let s = 0; s < samplesPerBeat / 4 && hhStart + s < data.length; s++) {
                const t = s / sampleRate;
                const noise = (Math.random() * 2 - 1);
                const envelope = Math.exp(-t * 80);
                const filtered = noise * 0.5;
                data[hhStart + s] += filtered * envelope * 0.15;
            }
        }
        return buffer;
    }
    generateBassBuffer() {
        const ctx = this.audioContext;
        const sampleRate = ctx.sampleRate;
        const duration = this._duration;
        const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        const notes = [65.41, 73.42, 82.41, 87.31, 98.00, 110.00, 123.47, 130.81];
        const bpm = 120;
        const beatDuration = 60 / bpm;
        for (let i = 0; i < 16; i++) {
            const noteIndex = Math.floor(i / 2) % notes.length;
            const freq = notes[noteIndex];
            const startSample = Math.floor(i * beatDuration * sampleRate / 2);
            const endSample = Math.floor((i + 1) * beatDuration * sampleRate / 2);
            for (let s = startSample; s < endSample && s < data.length; s++) {
                const t = (s - startSample) / sampleRate;
                const envelope = this.adsrEnvelope(t, 0.005, 0.05, 0.8, 0.1);
                const saw = 2 * ((freq * t) % 1) - 1;
                data[s] = envelope * saw * 0.25;
            }
        }
        return buffer;
    }
    generateKeyboardBuffer() {
        const ctx = this.audioContext;
        const sampleRate = ctx.sampleRate;
        const duration = this._duration;
        const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        const chord = [261.63, 329.63, 392.00];
        const bpm = 60;
        const beatDuration = 60 / bpm;
        for (let i = 0; i < 8; i++) {
            const startSample = Math.floor(i * beatDuration * 2 * sampleRate);
            const endSample = Math.floor((i + 1) * beatDuration * 2 * sampleRate);
            const baseNote = chord[i % 3];
            for (let s = startSample; s < endSample && s < data.length; s++) {
                const t = (s - startSample) / sampleRate;
                const envelope = this.adsrEnvelope(t, 0.02, 0.1, 0.6, 0.3);
                let sample = 0;
                for (const freq of chord) {
                    sample += Math.sin(2 * Math.PI * (freq + baseNote - chord[0]) * t);
                }
                data[s] = envelope * sample * 0.15;
            }
        }
        return buffer;
    }
    generateVocalsBuffer() {
        const ctx = this.audioContext;
        const sampleRate = ctx.sampleRate;
        const duration = this._duration;
        const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        const melody = [392.00, 440.00, 493.88, 523.25, 493.88, 440.00, 392.00, 349.23];
        const bpm = 80;
        const beatDuration = 60 / bpm;
        for (let i = 0; i < melody.length; i++) {
            const freq = melody[i];
            const startSample = Math.floor(i * beatDuration * sampleRate);
            const endSample = Math.floor((i + 1) * beatDuration * sampleRate);
            for (let s = startSample; s < endSample && s < data.length; s++) {
                const t = (s - startSample) / sampleRate;
                const envelope = this.adsrEnvelope(t, 0.05, 0.1, 0.7, 0.2);
                const vibrato = 1 + Math.sin(2 * Math.PI * 5 * t) * 0.02;
                const wave = Math.sin(2 * Math.PI * freq * vibrato * t);
                const pulseWidth = 0.5 + Math.sin(2 * Math.PI * freq * t) * 0.1;
                const pulse = wave > pulseWidth ? 1 : -1;
                data[s] = envelope * (wave * 0.7 + pulse * 0.3) * 0.2;
            }
        }
        return buffer;
    }
    generateSynthBuffer() {
        const ctx = this.audioContext;
        const sampleRate = ctx.sampleRate;
        const duration = this._duration;
        const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 659.25, 523.25, 392.00];
        const bpm = 140;
        const beatDuration = 60 / bpm;
        for (let i = 0; i < 16; i++) {
            const noteIndex = i % notes.length;
            const freq = notes[noteIndex];
            const startSample = Math.floor(i * beatDuration * sampleRate / 2);
            const endSample = Math.floor((i + 1) * beatDuration * sampleRate / 2);
            for (let s = startSample; s < endSample && s < data.length; s++) {
                const t = (s - startSample) / sampleRate;
                const envelope = this.adsrEnvelope(t, 0.001, 0.02, 0.4, 0.05);
                const square = Math.sign(Math.sin(2 * Math.PI * freq * t));
                const lfo = Math.sin(2 * Math.PI * 0.5 * t);
                const filtered = square * (0.5 + lfo * 0.5);
                data[s] = envelope * filtered * 0.15;
            }
        }
        return buffer;
    }
    adsrEnvelope(t, attack, decay, sustain, release) {
        if (t < attack) {
            return t / attack;
        }
        else if (t < attack + decay) {
            return 1 - (1 - sustain) * ((t - attack) / decay);
        }
        else {
            return sustain;
        }
    }
    registerTrack(track) {
        if (!this.audioContext || !this.masterGain)
            return;
        const gainNode = this.audioContext.createGain();
        gainNode.connect(this.masterGain);
        gainNode.gain.value = track.volume / 100;
        this.trackStates.set(track.id, {
            source: null,
            gainNode,
            isPlaying: false,
            startTime: 0,
            pauseTime: 0
        });
    }
    setTrackVolume(trackId, volume) {
        const state = this.trackStates.get(trackId);
        if (state && this.audioContext) {
            const targetGain = volume / 100;
            const now = this.audioContext.currentTime;
            state.gainNode.gain.linearRampToValueAtTime(targetGain, now + 0.3);
        }
    }
    setTrackPitch(trackId, pitch) {
        const state = this.trackStates.get(trackId);
        if (state && state.source) {
            state.source.detune.value = pitch * 100;
        }
    }
    setTrackSpeed(trackId, speed) {
        const state = this.trackStates.get(trackId);
        if (state && state.source) {
            state.source.playbackRate.value = speed;
        }
    }
    setMasterVolume(volume) {
        this._masterVolume = volume;
        if (this.masterGain && this.audioContext) {
            const now = this.audioContext.currentTime;
            this.masterGain.gain.linearRampToValueAtTime(volume / 100, now + 0.1);
        }
    }
    get masterVolume() {
        return this._masterVolume;
    }
    get isPlaying() {
        return this._isPlaying;
    }
    get playMode() {
        return this._playMode;
    }
    set playMode(mode) {
        this._playMode = mode;
    }
    get currentTime() {
        return this._currentTime;
    }
    get duration() {
        return this._duration;
    }
    setOnProgressCallback(callback) {
        this.onProgressCallback = callback;
    }
    play(tracks) {
        if (!this.audioContext)
            return;
        this.resume().then(() => {
            tracks.forEach(track => {
                this.playTrack(track);
            });
            this._isPlaying = true;
            this.startProgressTracking();
        });
    }
    playTrack(track) {
        if (!this.audioContext)
            return;
        const state = this.trackStates.get(track.id);
        if (!state)
            return;
        if (state.source) {
            state.source.stop();
            state.source.disconnect();
        }
        const buffer = this.trackBuffers.get(track.type);
        if (!buffer)
            return;
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(state.gainNode);
        source.detune.value = track.pitch * 100;
        source.playbackRate.value = track.speed;
        const offset = state.pauseTime > 0 ? state.pauseTime : 0;
        source.start(0, offset);
        state.source = source;
        state.isPlaying = true;
        state.startTime = this.audioContext.currentTime - offset;
    }
    pause() {
        if (!this.audioContext)
            return;
        this.trackStates.forEach((state) => {
            if (state.source && state.isPlaying) {
                state.pauseTime = this.audioContext.currentTime - state.startTime;
                state.source.stop();
                state.source.disconnect();
                state.source = null;
                state.isPlaying = false;
            }
        });
        this._isPlaying = false;
        this.stopProgressTracking();
    }
    stop() {
        this.trackStates.forEach((state) => {
            if (state.source) {
                state.source.stop();
                state.source.disconnect();
                state.source = null;
            }
            state.isPlaying = false;
            state.pauseTime = 0;
        });
        this._isPlaying = false;
        this._currentTime = 0;
        this.stopProgressTracking();
        if (this.onProgressCallback) {
            this.onProgressCallback(0, this._duration);
        }
    }
    seek(time) {
        this._currentTime = Math.max(0, Math.min(this._duration, time));
        if (this._isPlaying) {
            this.trackStates.forEach((state) => {
                if (state.source) {
                    state.source.stop();
                    state.source.disconnect();
                    state.source = null;
                }
                state.pauseTime = this._currentTime;
                state.isPlaying = false;
            });
        }
    }
    startProgressTracking() {
        const update = () => {
            if (!this._isPlaying || !this.audioContext)
                return;
            const firstState = Array.from(this.trackStates.values())[0];
            if (firstState) {
                this._currentTime = (this.audioContext.currentTime - firstState.startTime) % this._duration;
                if (this.onProgressCallback) {
                    this.onProgressCallback(this._currentTime, this._duration);
                }
            }
            this.animationFrameId = requestAnimationFrame(update);
        };
        update();
    }
    stopProgressTracking() {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    dispose() {
        this.stop();
        this.trackStates.forEach((state) => {
            state.gainNode.disconnect();
        });
        if (this.masterGain) {
            this.masterGain.disconnect();
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

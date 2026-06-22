import { v4 as uuidv4 } from 'uuid';
import wavEncoder from 'wav-encoder';

export interface RecordingItem {
  id: string;
  name: string;
  buffer: AudioBuffer;
  duration: number;
  createdAt: number;
}

interface EffectParams {
  reverb: number;
  delayTime: number;
  lowpassFreq: number;
}

class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private lowpassFilter: BiquadFilterNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private convolver: ConvolverNode | null = null;
  private reverbWet: GainNode | null = null;
  private reverbDry: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private audioBufferSource: AudioBufferSourceNode | null = null;
  private currentBuffer: AudioBuffer | null = null;
  private isPlaying = false;
  private isRecording = false;
  private effectParams: EffectParams = {
    reverb: 30,
    delayTime: 0.3,
    lowpassFreq: 20000,
  };

  async init(): Promise<void> {
    if (this.audioContext) return;
    
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;
    
    this.lowpassFilter = this.audioContext.createBiquadFilter();
    this.lowpassFilter.type = 'lowpass';
    this.lowpassFilter.frequency.value = this.effectParams.lowpassFreq;
    this.lowpassFilter.Q.value = 1;
    
    this.delayNode = this.audioContext.createDelay(2);
    this.delayNode.delayTime.value = this.effectParams.delayTime;
    
    this.delayFeedback = this.audioContext.createGain();
    this.delayFeedback.gain.value = 0.4;
    
    this.convolver = this.audioContext.createConvolver();
    this.convolver.buffer = this.generateImpulseResponse(2, 2.5);
    
    this.reverbWet = this.audioContext.createGain();
    this.reverbWet.gain.value = this.effectParams.reverb / 100;
    
    this.reverbDry = this.audioContext.createGain();
    this.reverbDry.gain.value = 1;
    
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.8;
    
    this.connectEffectChain();
  }

  private connectEffectChain(): void {
    if (!this.audioContext || !this.lowpassFilter || !this.delayNode || 
        !this.delayFeedback || !this.convolver || !this.reverbWet || 
        !this.reverbDry || !this.analyser || !this.masterGain) return;

    this.lowpassFilter.connect(this.delayNode);
    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    
    this.lowpassFilter.connect(this.reverbDry);
    this.delayNode.connect(this.convolver);
    this.convolver.connect(this.reverbWet);
    
    this.reverbDry.connect(this.analyser);
    this.reverbWet.connect(this.analyser);
    this.delayNode.connect(this.analyser);
    
    this.analyser.connect(this.masterGain);
    this.masterGain.connect(this.audioContext.destination);
  }

  private generateImpulseResponse(duration: number, decay: number): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');
    
    const sampleRate = this.audioContext.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    
    return impulse;
  }

  async startMicrophone(): Promise<void> {
    if (!this.audioContext) await this.init();
    if (this.isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (!this.audioContext || !this.lowpassFilter) return;
      
      this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
      this.mediaStreamSource.connect(this.lowpassFilter);
      
      this.mediaRecorder = new MediaRecorder(stream);
      this.recordedChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.start();
      this.isRecording = true;
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    } catch (error) {
      console.error('Failed to start microphone:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<RecordingItem | null> {
    if (!this.mediaRecorder || !this.isRecording) return null;

    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.audioContext) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = async () => {
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        const arrayBuffer = await blob.arrayBuffer();
        let decodedBuffer: AudioBuffer | null = null;
        
        try {
          decodedBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
          
          const wavBuffer = await this.encodeWav(decodedBuffer);
          const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
          const wavArrayBuffer = await wavBlob.arrayBuffer();
          const finalBuffer = await this.audioContext!.decodeAudioData(wavArrayBuffer);
          
          const recording: RecordingItem = {
            id: uuidv4(),
            name: `录音 ${new Date().toLocaleTimeString()}`,
            buffer: finalBuffer,
            duration: finalBuffer.duration,
            createdAt: Date.now(),
          };
          
          resolve(recording);
        } catch {
          if (decodedBuffer) {
            const recording: RecordingItem = {
              id: uuidv4(),
              name: `录音 ${new Date().toLocaleTimeString()}`,
              buffer: decodedBuffer,
              duration: decodedBuffer.duration,
              createdAt: Date.now(),
            };
            resolve(recording);
          } else {
            resolve(null);
          }
        }
      };

      this.mediaRecorder!.stop();
      
      if (this.mediaStreamSource) {
        this.mediaStreamSource.disconnect();
        this.mediaStreamSource = null;
      }
      
      const tracks = this.mediaRecorder!.stream.getTracks();
      tracks.forEach(track => track.stop());
      
      this.isRecording = false;
      this.mediaRecorder = null;
    });
  }

  private async encodeWav(audioBuffer: AudioBuffer): Promise<ArrayBuffer> {
    const sampleRate = audioBuffer.sampleRate;
    const numberOfChannels = audioBuffer.numberOfChannels;
    
    const channelData: Float32Array[] = [];
    for (let i = 0; i < numberOfChannels; i++) {
      channelData.push(audioBuffer.getChannelData(i));
    }
    
    const wavData = await wavEncoder.encode({
      sampleRate,
      channelData,
    });
    
    return wavData;
  }

  async loadAudioFile(file: File): Promise<AudioBuffer> {
    if (!this.audioContext) await this.init();
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    this.currentBuffer = audioBuffer;
    
    return audioBuffer;
  }

  playAudio(buffer?: AudioBuffer): void {
    if (!this.audioContext || !this.lowpassFilter) return;
    
    this.stopPlayback();
    
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer || this.currentBuffer;
    
    if (!source.buffer) return;
    
    source.connect(this.lowpassFilter);
    source.start(0);
    
    this.audioBufferSource = source;
    this.isPlaying = true;
    
    source.onended = () => {
      this.isPlaying = false;
      this.audioBufferSource = null;
    };
  }

  stopPlayback(): void {
    if (this.audioBufferSource) {
      try {
        this.audioBufferSource.stop();
      } catch (e) {
        // ignore
      }
      this.audioBufferSource.disconnect();
      this.audioBufferSource = null;
    }
    this.isPlaying = false;
  }

  getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(128);
    
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  getTimeDomainData(): Float32Array {
    if (!this.analyser) return new Float32Array(2048);
    
    const dataArray = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(dataArray);
    return dataArray;
  }

  getTimeDomainDataByte(): Uint8Array {
    if (!this.analyser) return new Uint8Array(2048);
    
    const dataArray = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  setReverb(value: number): void {
    this.effectParams.reverb = value;
    if (this.reverbWet) {
      this.reverbWet.gain.setTargetAtTime(value / 100, this.audioContext?.currentTime || 0, 0.1);
    }
  }

  setDelayTime(value: number): void {
    this.effectParams.delayTime = value;
    if (this.delayNode && this.audioContext) {
      this.delayNode.delayTime.setTargetAtTime(value, this.audioContext.currentTime, 0.05);
    }
  }

  setLowpassFrequency(value: number): void {
    this.effectParams.lowpassFreq = value;
    if (this.lowpassFilter && this.audioContext) {
      this.lowpassFilter.frequency.setTargetAtTime(value, this.audioContext.currentTime, 0.05);
    }
  }

  getSampleRate(): number {
    return this.audioContext?.sampleRate || 44100;
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getCurrentBuffer(): AudioBuffer | null {
    return this.currentBuffer;
  }

  setCurrentBuffer(buffer: AudioBuffer | null): void {
    this.currentBuffer = buffer;
  }

  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  async exportWav(buffer: AudioBuffer): Promise<Blob> {
    const wavData = await this.encodeWav(buffer);
    return new Blob([wavData], { type: 'audio/wav' });
  }

  dispose(): void {
    this.stopPlayback();
    
    if (this.mediaRecorder && this.isRecording) {
      const tracks = this.mediaRecorder.stream.getTracks();
      tracks.forEach(track => track.stop());
      this.mediaRecorder.stop();
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const audioEngine = new AudioEngine();
export default audioEngine;

import { v4 as uuidv4 } from 'uuid';
import { EffectType, EffectState, EFFECT_CONFIGS, IEffectSlot } from '@types/index';

const PARAM_RAMP_TIME = 0.01;

export class EffectSlot implements IEffectSlot {
  id: string;
  type: EffectType;
  params: Record<string, number>;
  bypassed: boolean;
  slotIndex: number;

  private audioContext: AudioContext;
  private inputNode: AudioNode | null = null;
  private outputNode: AudioNode | null = null;
  private wetGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private effectNode: AudioNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private delayNode: DelayNode | null = null;
  private feedbackGain: GainNode | null = null;
  private waveShaper: WaveShaperNode | null = null;
  private convolver: ConvolverNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private nodesCreated: boolean = false;

  constructor(
    audioContext: AudioContext,
    type: EffectType,
    slotIndex: number,
  ) {
    this.id = uuidv4();
    this.type = type;
    this.slotIndex = slotIndex;
    this.bypassed = false;
    this.audioContext = audioContext;

    const config = EFFECT_CONFIGS[type];
    this.params = {};
    config.params.forEach((p) => {
      this.params[p.name] = p.default;
    });
  }

  getState(): EffectState {
    return {
      id: this.id,
      type: this.type,
      params: { ...this.params },
      bypassed: this.bypassed,
      slotIndex: this.slotIndex,
    };
  }

  setParam(name: string, value: number): void {
    this.params[name] = value;
    this.applyParam(name, value);
  }

  toggleBypass(): boolean {
    this.bypassed = !this.bypassed;
    this.applyBypassState();
    return this.bypassed;
  }

  private scheduleParam(param: AudioParam, value: number): void {
    const t = this.audioContext.currentTime;
    param.cancelScheduledValues(t);
    param.setValueAtTime(param.value, t);
    param.setTargetAtTime(value, t, PARAM_RAMP_TIME);
  }

  private applyBypassState(): void {
    if (!this.dryGain || !this.wetGain) return;
    if (this.bypassed) {
      this.scheduleParam(this.dryGain.gain, 1);
      this.scheduleParam(this.wetGain.gain, 0);
    } else {
      const wet = this.params['wet'] ?? 0.5;
      this.scheduleParam(this.dryGain.gain, 1 - wet);
      this.scheduleParam(this.wetGain.gain, wet);
    }
  }

  createNodes(input: AudioNode, output: AudioNode): void {
    this.disconnect();

    this.inputNode = input;
    this.outputNode = output;

    this.dryGain = this.audioContext.createGain();
    this.wetGain = this.audioContext.createGain();

    switch (this.type) {
      case 'eq':
        this.createEQ();
        break;
      case 'compressor':
        this.createCompressor();
        break;
      case 'reverb':
        this.createReverb();
        break;
      case 'delay':
        this.createDelay();
        break;
      case 'distortion':
        this.createDistortion();
        break;
    }

    this.connectChain();
    this.nodesCreated = true;
  }

  private connectChain(): void {
    if (!this.inputNode || !this.outputNode || !this.dryGain || !this.wetGain || !this.effectNode) return;

    this.inputNode.connect(this.dryGain);
    this.dryGain.connect(this.outputNode);

    this.inputNode.connect(this.effectNode);
    this.effectNode.connect(this.wetGain);
    this.wetGain.connect(this.outputNode);

    const wet = this.params['wet'] ?? 0.5;
    this.dryGain.gain.value = 1 - wet;
    this.wetGain.gain.value = wet;

    if (this.bypassed) {
      this.dryGain.gain.value = 1;
      this.wetGain.gain.value = 0;
    }
  }

  private createEQ(): void {
    const lowFilter = this.audioContext.createBiquadFilter();
    lowFilter.type = 'lowshelf';
    lowFilter.frequency.value = 320;
    lowFilter.gain.value = this.params['lowGain'] || 0;

    const midFilter = this.audioContext.createBiquadFilter();
    midFilter.type = 'peaking';
    midFilter.frequency.value = 1000;
    midFilter.Q.value = 1;
    midFilter.gain.value = this.params['midGain'] || 0;

    const highFilter = this.audioContext.createBiquadFilter();
    highFilter.type = 'highshelf';
    highFilter.frequency.value = 3200;
    highFilter.gain.value = this.params['highGain'] || 0;

    lowFilter.connect(midFilter);
    midFilter.connect(highFilter);

    this.eqFilters = [lowFilter, midFilter, highFilter];
    this.effectNode = lowFilter;
  }

  private createCompressor(): void {
    const compressor = this.audioContext.createDynamicsCompressor();
    compressor.threshold.value = this.params['threshold'] ?? -24;
    compressor.ratio.value = this.params['ratio'] ?? 4;
    compressor.attack.value = this.params['attack'] ?? 0.003;
    compressor.release.value = this.params['release'] ?? 0.25;

    this.compressorNode = compressor;
    this.effectNode = compressor;
  }

  private createReverb(): void {
    const convolver = this.audioContext.createConvolver();
    this.generateImpulseResponse(convolver, this.params['decay'] ?? 2);

    this.convolver = convolver;
    this.effectNode = convolver;
  }

  private generateImpulseResponse(convolver: ConvolverNode, decay: number): void {
    const sampleRate = this.audioContext.sampleRate;
    const length = Math.floor(sampleRate * decay);
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }

    convolver.buffer = impulse;
  }

  private createDelay(): void {
    const delay = this.audioContext.createDelay(2);
    delay.delayTime.value = this.params['delayTime'] ?? 0.3;

    const feedback = this.audioContext.createGain();
    feedback.gain.value = this.params['feedback'] ?? 0.3;

    delay.connect(feedback);
    feedback.connect(delay);

    this.delayNode = delay;
    this.feedbackGain = feedback;
    this.effectNode = delay;
  }

  private createDistortion(): void {
    const waveShaper = this.audioContext.createWaveShaper();
    waveShaper.curve = this.makeDistortionCurve(this.params['amount'] ?? 0.5);
    waveShaper.oversample = '4x';

    this.waveShaper = waveShaper;
    this.effectNode = waveShaper;
  }

  private makeDistortionCurve(amount: number): Float32Array {
    const k = amount * 100;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < n_samples; i++) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }

    return curve;
  }

  private applyParam(name: string, value: number): void {
    if (!this.nodesCreated) return;

    switch (this.type) {
      case 'eq':
        this.applyEQParam(name, value);
        break;
      case 'compressor':
        this.applyCompressorParam(name, value);
        break;
      case 'reverb':
        this.applyReverbParam(name, value);
        break;
      case 'delay':
        this.applyDelayParam(name, value);
        break;
      case 'distortion':
        this.applyDistortionParam(name, value);
        break;
    }
  }

  private applyEQParam(name: string, value: number): void {
    if (name === 'lowGain' && this.eqFilters[0]) {
      this.scheduleParam(this.eqFilters[0].gain, value);
    } else if (name === 'midGain' && this.eqFilters[1]) {
      this.scheduleParam(this.eqFilters[1].gain, value);
    } else if (name === 'highGain' && this.eqFilters[2]) {
      this.scheduleParam(this.eqFilters[2].gain, value);
    }
  }

  private applyCompressorParam(name: string, value: number): void {
    if (!this.compressorNode) return;
    if (name === 'threshold') this.scheduleParam(this.compressorNode.threshold, value);
    else if (name === 'ratio') this.scheduleParam(this.compressorNode.ratio, value);
    else if (name === 'attack') this.scheduleParam(this.compressorNode.attack, value);
    else if (name === 'release') this.scheduleParam(this.compressorNode.release, value);
  }

  private applyReverbParam(name: string, value: number): void {
    if (name === 'decay' && this.convolver) {
      this.generateImpulseResponse(this.convolver, value);
    } else if (name === 'wet' && this.dryGain && this.wetGain && !this.bypassed) {
      this.scheduleParam(this.dryGain.gain, 1 - value);
      this.scheduleParam(this.wetGain.gain, value);
    }
  }

  private applyDelayParam(name: string, value: number): void {
    if (name === 'delayTime' && this.delayNode) {
      this.scheduleParam(this.delayNode.delayTime, value);
    } else if (name === 'feedback' && this.feedbackGain) {
      this.scheduleParam(this.feedbackGain.gain, value);
    } else if (name === 'wet' && this.dryGain && this.wetGain && !this.bypassed) {
      this.scheduleParam(this.dryGain.gain, 1 - value);
      this.scheduleParam(this.wetGain.gain, value);
    }
  }

  private applyDistortionParam(name: string, value: number): void {
    if (name === 'amount' && this.waveShaper) {
      this.waveShaper.curve = this.makeDistortionCurve(value);
    } else if (name === 'wet' && this.dryGain && this.wetGain && !this.bypassed) {
      this.scheduleParam(this.dryGain.gain, 1 - value);
      this.scheduleParam(this.wetGain.gain, value);
    }
  }

  disconnect(): void {
    if (!this.nodesCreated) return;
    try {
      if (this.inputNode && this.dryGain) this.inputNode.disconnect(this.dryGain);
      if (this.inputNode && this.effectNode) this.inputNode.disconnect(this.effectNode);
      if (this.dryGain && this.outputNode) this.dryGain.disconnect(this.outputNode);
      if (this.wetGain && this.outputNode) this.wetGain.disconnect(this.outputNode);
      if (this.effectNode && this.wetGain) this.effectNode.disconnect(this.wetGain);
      if (this.eqFilters.length > 0) {
        this.eqFilters[0].disconnect();
        if (this.eqFilters[1]) this.eqFilters[0].disconnect(this.eqFilters[1]);
        if (this.eqFilters[2]) this.eqFilters[1].disconnect(this.eqFilters[2]);
      }
      if (this.delayNode) {
        this.delayNode.disconnect();
        if (this.feedbackGain) this.feedbackGain.disconnect();
      }
    } catch (e) {
      // ignore disconnect errors
    }
    this.eqFilters = [];
    this.effectNode = null;
    this.dryGain = null;
    this.wetGain = null;
    this.delayNode = null;
    this.feedbackGain = null;
    this.waveShaper = null;
    this.convolver = null;
    this.compressorNode = null;
    this.nodesCreated = false;
  }

  destroy(): void {
    this.disconnect();
  }
}

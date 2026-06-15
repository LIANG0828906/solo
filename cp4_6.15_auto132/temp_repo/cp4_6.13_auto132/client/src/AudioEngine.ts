import { AudioNodeData, ConnectionData, NodeType } from './types';

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private activeNodes: Map<string, AudioNode> = new Map();
  private playing: boolean = false;
  private bpm: number = 120;
  private pulseInterval: ReturnType<typeof setInterval> | null = null;
  private onPulseCallback: (() => void) | null = null;

  constructor() {}

  private ensureContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ latencyHint: 'interactive' });
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  setBPM(bpm: number) {
    this.bpm = bpm;
    if (this.playing) {
      this.stopPulse();
      this.startPulse();
    }
  }

  setOnPulseCallback(callback: () => void) {
    this.onPulseCallback = callback;
  }

  private startPulse() {
    const interval = 60000 / this.bpm;
    this.pulseInterval = setInterval(() => {
      if (this.onPulseCallback) {
        this.onPulseCallback();
      }
    }, interval);
  }

  private stopPulse() {
    if (this.pulseInterval) {
      clearInterval(this.pulseInterval);
      this.pulseInterval = null;
    }
  }

  private topologicalSort(
    nodes: AudioNodeData[],
    connections: ConnectionData[]
  ): AudioNodeData[] {
    const inDegree: Map<string, number> = new Map();
    const adjacency: Map<string, string[]> = new Map();

    nodes.forEach((n) => {
      inDegree.set(n.id, 0);
      adjacency.set(n.id, []);
    });

    connections.forEach((conn) => {
      const current = inDegree.get(conn.toNodeId) || 0;
      inDegree.set(conn.toNodeId, current + 1);
      const adj = adjacency.get(conn.fromNodeId) || [];
      adj.push(conn.toNodeId);
      adjacency.set(conn.fromNodeId, adj);
    });

    const queue: string[] = [];
    inDegree.forEach((degree, id) => {
      if (degree === 0) queue.push(id);
    });

    const sorted: AudioNodeData[] = [];
    const nodeMap: Map<string, AudioNodeData> = new Map();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    while (queue.length > 0) {
      const id = queue.shift()!;
      const node = nodeMap.get(id);
      if (node) sorted.push(node);

      const neighbors = adjacency.get(id) || [];
      neighbors.forEach((neighborId) => {
        const deg = (inDegree.get(neighborId) || 0) - 1;
        inDegree.set(neighborId, deg);
        if (deg === 0) queue.push(neighborId);
      });
    }

    return sorted;
  }

  private createOscillatorNode(params: AudioNodeData['params']): OscillatorNode {
    const ctx = this.ensureContext();
    const osc = ctx.createOscillator();
    osc.type = (params.waveform as OscillatorType) || 'sine';
    osc.frequency.value = params.frequency || 440;
    return osc;
  }

  private createGainNode(params: AudioNodeData['params']): GainNode {
    const ctx = this.ensureContext();
    const gain = ctx.createGain();
    gain.gain.value = (params.volume || 50) / 100;
    return gain;
  }

  private createDelayNode(params: AudioNodeData['params']): DelayNode {
    const ctx = this.ensureContext();
    const delay = ctx.createDelay(5.0);
    delay.delayTime.value = params.delayTime || 0.3;
    return delay;
  }

  private createReverbNode(params: AudioNodeData['params']): ConvolverNode {
    const ctx = this.ensureContext();
    const convolver = ctx.createConvolver();
    const rate = ctx.sampleRate;
    const length = rate * (params.reverbTime || 2);
    const impulse = ctx.createBuffer(2, length, rate);
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    convolver.buffer = impulse;
    return convolver;
  }

  private createPlayerNode(params: AudioNodeData['params']): AudioBufferSourceNode {
    const ctx = this.ensureContext();
    const source = ctx.createBufferSource();
    const duration = 2;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < buffer.length; i++) {
      data[i] = Math.sin((i / buffer.length) * Math.PI * 2 * (params.frequency || 440) * (i / ctx.sampleRate));
    }
    source.buffer = buffer;
    source.loop = true;
    source.playbackRate.value = params.playbackRate || 1;
    return source;
  }

  private createNode(node: AudioNodeData): AudioNode | null {
    const type: NodeType = node.type;
    switch (type) {
      case 'oscillator':
        return this.createOscillatorNode(node.params);
      case 'player':
        return this.createPlayerNode(node.params);
      case 'gain':
        return this.createGainNode(node.params);
      case 'delay': {
        const delay = this.createDelayNode(node.params);
        const feedback = this.audioContext!.createGain();
        feedback.gain.value = node.params.feedback || 0.3;
        delay.connect(feedback);
        feedback.connect(delay);
        return delay;
      }
      case 'reverb':
        return this.createReverbNode(node.params);
      case 'output':
        return this.audioContext!.destination;
      default:
        return null;
    }
  }

  play(nodes: AudioNodeData[], connections: ConnectionData[]) {
    if (this.playing) return;
    const ctx = this.ensureContext();
    this.activeNodes.clear();

    const sortedNodes = this.topologicalSort(nodes, connections);

    sortedNodes.forEach((nodeData) => {
      if (nodeData.type === 'output') {
        this.activeNodes.set(nodeData.id, ctx.destination);
      } else {
        const audioNode = this.createNode(nodeData);
        if (audioNode) {
          this.activeNodes.set(nodeData.id, audioNode);
        }
      }
    });

    connections.forEach((conn) => {
      const fromNode = this.activeNodes.get(conn.fromNodeId);
      const toNode = this.activeNodes.get(conn.toNodeId);
      if (fromNode && toNode) {
        try {
          fromNode.connect(toNode);
        } catch (e) {
          console.warn('Connection error:', e);
        }
      }
    });

    this.activeNodes.forEach((node) => {
      if (node instanceof OscillatorNode) {
        node.start();
      } else if (node instanceof AudioBufferSourceNode) {
        node.start();
      }
    });

    this.playing = true;
    this.startPulse();
  }

  stop() {
    if (!this.playing) return;

    this.activeNodes.forEach((node) => {
      try {
        if (node instanceof OscillatorNode) {
          node.stop();
          node.disconnect();
        } else if (node instanceof AudioBufferSourceNode) {
          node.stop();
          node.disconnect();
        } else if (node !== this.audioContext?.destination) {
          node.disconnect();
        }
      } catch (e) {
        console.warn('Stop error:', e);
      }
    });

    this.activeNodes.clear();
    this.playing = false;
    this.stopPulse();
  }

  isPlaying(): boolean {
    return this.playing;
  }

  getActiveNodeIds(): string[] {
    return Array.from(this.activeNodes.keys());
  }
}

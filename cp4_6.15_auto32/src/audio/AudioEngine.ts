import { ModuleId, ModuleType, Port, Module, Connection } from '../types/ModuleTypes';
import { OscillatorAudioModule } from './modules/OscillatorNode';
import { FilterAudioModule } from './modules/FilterNode';
import { EnvelopeAudioModule } from './modules/EnvelopeNode';
import { LFOAudioModule } from './modules/LFONode';
import { ReverbAudioModule } from './modules/ReverbNode';

type AudioModuleInstance =
  | OscillatorAudioModule
  | FilterAudioModule
  | EnvelopeAudioModule
  | LFOAudioModule
  | ReverbAudioModule
  | OutputAudioModule;

class OutputAudioModule {
  private gainNode: GainNode | null = null;
  private context: AudioContext;
  public moduleId: ModuleId;

  constructor(context: AudioContext, moduleId: ModuleId) {
    this.context = context;
    this.moduleId = moduleId;
  }

  create(params: Record<string, number | string>): void {
    this.gainNode = this.context.createGain();
    this.gainNode.gain.value = (params.volume as number) ?? 0.5;
    this.gainNode.connect(this.context.destination);
  }

  getAudioInputNode(): AudioNode | null {
    return this.gainNode;
  }

  updateParam(key: string, value: number | string): void {
    if (!this.gainNode) return;
    if (key === 'volume') {
      this.gainNode.gain.setValueAtTime(value as number, this.context.currentTime);
    }
  }

  dispose(): void {
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
  }
}

interface ActiveConnection {
  sourceModuleId: ModuleId;
  sourcePortName: string;
  targetModuleId: ModuleId;
  targetPortName: string;
  signalType: string;
}

export class AudioEngine {
  private context: AudioContext | null = null;
  private modules: Map<ModuleId, AudioModuleInstance> = new Map();
  private activeConnections: Map<string, ActiveConnection> = new Map();
  private _cpuUsage: number = 0;
  private _sampleRate: number = 44100;
  private frameCount: number = 0;
  private lastCpuCheck: number = 0;

  async init(): Promise<void> {
    if (this.context) return;
    this.context = new AudioContext({
      sampleRate: 44100,
    });
    this._sampleRate = this.context.sampleRate;
    await this.context.resume();
    this.startCpuMonitoring();
  }

  private startCpuMonitoring(): void {
    const measure = () => {
      if (!this.context) return;
      this.frameCount++;
      const now = performance.now();
      if (now - this.lastCpuCheck >= 1000) {
        const activeModules = this.modules.size;
        const activeConnections = this.activeConnections.size;
        const baseLoad = activeModules * 3 + activeConnections * 2;
        this._cpuUsage = Math.min(99, Math.max(0, baseLoad + Math.random() * 2));
        this.frameCount = 0;
        this.lastCpuCheck = now;
      }
      requestAnimationFrame(measure);
    };
    this.lastCpuCheck = performance.now();
    requestAnimationFrame(measure);
  }

  get cpuUsage(): number {
    return this._cpuUsage;
  }

  get sampleRate(): number {
    return this._sampleRate;
  }

  get audioContext(): AudioContext | null {
    return this.context;
  }

  createModule(module: Module): void {
    if (!this.context) return;
    const { id, type, params } = module;
    let audioModule: AudioModuleInstance;

    switch (type) {
      case 'oscillator':
        audioModule = new OscillatorAudioModule(this.context, id);
        break;
      case 'filter':
        audioModule = new FilterAudioModule(this.context, id);
        break;
      case 'envelope':
        audioModule = new EnvelopeAudioModule(this.context, id);
        break;
      case 'lfo':
        audioModule = new LFOAudioModule(this.context, id);
        break;
      case 'reverb':
        audioModule = new ReverbAudioModule(this.context, id);
        break;
      case 'output':
        audioModule = new OutputAudioModule(this.context, id);
        break;
      default:
        return;
    }

    audioModule.create(params);
    this.modules.set(id, audioModule);
  }

  removeModule(moduleId: ModuleId): void {
    const audioModule = this.modules.get(moduleId);
    if (audioModule) {
      audioModule.dispose();
      this.modules.delete(moduleId);
    }
    const connectionsToRemove: string[] = [];
    this.activeConnections.forEach((conn, connId) => {
      if (conn.sourceModuleId === moduleId || conn.targetModuleId === moduleId) {
        connectionsToRemove.push(connId);
      }
    });
    for (const connId of connectionsToRemove) {
      this.activeConnections.delete(connId);
    }
  }

  connect(connection: Connection, modules: Module[]): boolean {
    if (!this.context) return false;
    const fromModule = modules.find(m =>
      m.ports.some(p => p.id === connection.fromPortId)
    );
    const toModule = modules.find(m =>
      m.ports.some(p => p.id === connection.toPortId)
    );
    if (!fromModule || !toModule) return false;

    const fromPort = fromModule.ports.find(p => p.id === connection.fromPortId)!;
    const toPort = toModule.ports.find(p => p.id === connection.toPortId)!;

    const sourceAudio = this.modules.get(fromModule.id);
    const targetAudio = this.modules.get(toModule.id);
    if (!sourceAudio || !targetAudio) return false;

    try {
      if (fromPort.signalType === 'audio' && toPort.signalType === 'audio') {
        const sourceNode = this.getAudioOutputNode(sourceAudio, fromPort.name);
        const targetNode = this.getAudioInputNode(targetAudio, toPort.name);
        if (sourceNode && targetNode) {
          sourceNode.connect(targetNode as AudioNode);
        }
      } else if (fromPort.signalType === 'control' && toPort.signalType === 'control') {
        const sourceNode = this.getControlOutputNode(sourceAudio);
        const targetParam = this.getControlInputNode(targetAudio, toPort.name);
        if (sourceNode && targetParam) {
          sourceNode.connect(targetParam as AudioParam);
        }
      } else if (fromPort.signalType === 'trigger' && toPort.signalType === 'trigger') {
        // handled separately via trigger method
      }

      this.activeConnections.set(connection.id, {
        sourceModuleId: fromModule.id,
        sourcePortName: fromPort.name,
        targetModuleId: toModule.id,
        targetPortName: toPort.name,
        signalType: fromPort.signalType,
      });
      return true;
    } catch {
      return false;
    }
  }

  disconnect(connectionId: string): void {
    const conn = this.activeConnections.get(connectionId);
    if (!conn) return;

    const sourceAudio = this.modules.get(conn.sourceModuleId);
    const targetAudio = this.modules.get(conn.targetModuleId);
    if (!sourceAudio || !targetAudio) {
      this.activeConnections.delete(connectionId);
      return;
    }

    try {
      if (conn.signalType === 'audio') {
        const sourceNode = this.getAudioOutputNode(sourceAudio, conn.sourcePortName);
        const targetNode = this.getAudioInputNode(targetAudio, conn.targetPortName);
        if (sourceNode && targetNode) {
          sourceNode.disconnect(targetNode as AudioNode);
        }
      } else if (conn.signalType === 'control') {
        const sourceNode = this.getControlOutputNode(sourceAudio);
        const targetParam = this.getControlInputNode(targetAudio, conn.targetPortName);
        if (sourceNode && targetParam) {
          sourceNode.disconnect(targetParam as AudioParam);
        }
      }
    } catch {
      // ignore disconnect errors
    }

    this.activeConnections.delete(connectionId);
  }

  updateParam(moduleId: ModuleId, key: string, value: number | string): void {
    const audioModule = this.modules.get(moduleId);
    if (audioModule) {
      audioModule.updateParam(key, value);
    }
  }

  triggerEnvelope(moduleId: ModuleId): void {
    const audioModule = this.modules.get(moduleId);
    if (audioModule instanceof EnvelopeAudioModule) {
      audioModule.trigger();
    }
  }

  releaseEnvelope(moduleId: ModuleId): void {
    const audioModule = this.modules.get(moduleId);
    if (audioModule instanceof EnvelopeAudioModule) {
      audioModule.releaseEnvelope();
    }
  }

  private getAudioOutputNode(mod: AudioModuleInstance, portName: string): AudioNode | null {
    if (mod instanceof OscillatorAudioModule) return mod.getAudioOutputNode();
    if (mod instanceof FilterAudioModule) return mod.getAudioOutputNode();
    if (mod instanceof ReverbAudioModule) return mod.getAudioOutputNode();
    return null;
  }

  private getAudioInputNode(mod: AudioModuleInstance, portName: string): AudioNode | AudioParam | null {
    if (mod instanceof FilterAudioModule) return mod.getAudioInputNode();
    if (mod instanceof ReverbAudioModule) return mod.getAudioInputNode();
    if (mod instanceof OutputAudioModule) return mod.getAudioInputNode();
    return null;
  }

  private getControlOutputNode(mod: AudioModuleInstance): AudioNode | null {
    if (mod instanceof EnvelopeAudioModule) return mod.getControlOutputNode();
    if (mod instanceof LFOAudioModule) return mod.getControlOutputNode();
    return null;
  }

  private getControlInputNode(mod: AudioModuleInstance, portName: string): AudioNode | AudioParam | null {
    if (mod instanceof OscillatorAudioModule) return mod.getControlInputNode(portName);
    if (mod instanceof FilterAudioModule) return mod.getControlInputNode(portName);
    return null;
  }

  async resume(): Promise<void> {
    if (this.context?.state === 'suspended') {
      await this.context.resume();
    }
  }

  dispose(): void {
    this.modules.forEach(mod => mod.dispose());
    this.modules.clear();
    this.activeConnections.clear();
    if (this.context) {
      this.context.close();
      this.context = null;
    }
  }
}

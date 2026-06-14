import React, { useReducer, useCallback, useRef, useState, useEffect, createContext, useContext } from 'react';
import {
  Module,
  Connection,
  ModuleType,
  MODULE_CONFIGS,
  generateId,
  Port,
} from './types/ModuleTypes';
import { AudioEngine } from './audio/AudioEngine';
import { validateConnection } from './utils/portValidator';
import ModulePanel from './components/ModulePanel';
import Workbench from './components/Workbench';

interface AppState {
  modules: Module[];
  connections: Connection[];
}

type AppAction =
  | { type: 'ADD_MODULE'; payload: { moduleType: ModuleType; x: number; y: number } }
  | { type: 'REMOVE_MODULE'; payload: { id: string } }
  | { type: 'MOVE_MODULE'; payload: { id: string; x: number; y: number } }
  | { type: 'UPDATE_PARAM'; payload: { moduleId: string; key: string; value: number | string } }
  | { type: 'ADD_CONNECTION'; payload: { fromPortId: string; toPortId: string } }
  | { type: 'REMOVE_CONNECTION'; payload: { id: string } };

interface SynthContextType {
  state: AppState;
  audioEngine: AudioEngine;
  dispatch: React.Dispatch<AppAction>;
}

const SynthContext = createContext<SynthContextType | null>(null);

export function useSynthContext(): SynthContextType {
  const ctx = useContext(SynthContext);
  if (!ctx) throw new Error('useSynthContext must be used within SynthContext');
  return ctx;
}

function createModule(type: ModuleType, x: number, y: number): Module {
  const config = MODULE_CONFIGS[type];
  const id = generateId();

  const ports: Port[] = config.ports.map(pt => ({
    id: `${id}_${pt.name}_${pt.direction}`,
    moduleId: id,
    name: pt.name,
    direction: pt.direction,
    signalType: pt.signalType,
  }));

  return {
    id,
    type,
    x,
    y,
    params: { ...config.defaultParams },
    ports,
  };
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_MODULE': {
      const module = createModule(action.payload.moduleType, action.payload.x, action.payload.y);
      return { ...state, modules: [...state.modules, module] };
    }
    case 'REMOVE_MODULE': {
      const moduleId = action.payload.id;
      const connectionsToRemove = new Set(
        state.connections
          .filter(c => {
            const fromMod = state.modules.find(m => m.ports.some(p => p.id === c.fromPortId));
            const toMod = state.modules.find(m => m.ports.some(p => p.id === c.toPortId));
            return fromMod?.id === moduleId || toMod?.id === moduleId;
          })
          .map(c => c.id)
      );
      return {
        ...state,
        modules: state.modules.filter(m => m.id !== moduleId),
        connections: state.connections.filter(c => !connectionsToRemove.has(c.id)),
      };
    }
    case 'MOVE_MODULE': {
      return {
        ...state,
        modules: state.modules.map(m =>
          m.id === action.payload.id
            ? { ...m, x: action.payload.x, y: action.payload.y }
            : m
        ),
      };
    }
    case 'UPDATE_PARAM': {
      return {
        ...state,
        modules: state.modules.map(m =>
          m.id === action.payload.moduleId
            ? { ...m, params: { ...m.params, [action.payload.key]: action.payload.value } }
            : m
        ),
      };
    }
    case 'ADD_CONNECTION': {
      const exists = state.connections.some(
        c =>
          (c.fromPortId === action.payload.fromPortId && c.toPortId === action.payload.toPortId) ||
          (c.fromPortId === action.payload.toPortId && c.toPortId === action.payload.fromPortId)
      );
      if (exists) return state;
      const conn: Connection = {
        id: generateId(),
        fromPortId: action.payload.fromPortId,
        toPortId: action.payload.toPortId,
      };
      return { ...state, connections: [...state.connections, conn] };
    }
    case 'REMOVE_CONNECTION': {
      return {
        ...state,
        connections: state.connections.filter(c => c.id !== action.payload.id),
      };
    }
    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(appReducer, { modules: [], connections: [] });
  const audioEngineRef = useRef(new AudioEngine());
  const [panelOpen, setPanelOpen] = useState(true);
  const [cpuUsage, setCpuUsage] = useState(0);
  const [sampleRate, setSampleRate] = useState(44100);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const moduleCounterRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const engine = audioEngineRef.current;
      setCpuUsage(engine.cpuUsage);
      setSampleRate(engine.sampleRate);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setPanelOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const initAudio = useCallback(async () => {
    if (audioInitialized) return;
    await audioEngineRef.current.init();
    setAudioInitialized(true);
    setSampleRate(audioEngineRef.current.sampleRate);
  }, [audioInitialized]);

  const handleAddModule = useCallback(async (type: ModuleType) => {
    await initAudio();
    moduleCounterRef.current += 1;
    const spacing = 40;
    const baseX = 30 + (moduleCounterRef.current % 4) * 240;
    const baseY = 30 + Math.floor(moduleCounterRef.current / 4) * 260;
    const newModule = createModule(type, baseX, baseY);
    audioEngineRef.current.createModule(newModule);
    dispatch({ type: 'ADD_MODULE', payload: { moduleType: type, x: newModule.x, y: newModule.y } });
  }, [initAudio]);

  const handleRemoveModule = useCallback((id: string) => {
    audioEngineRef.current.removeModule(id);
    dispatch({ type: 'REMOVE_MODULE', payload: { id } });
  }, []);

  const handleMoveModule = useCallback((id: string, x: number, y: number) => {
    dispatch({ type: 'MOVE_MODULE', payload: { id, x, y } });
  }, []);

  const handleParamChange = useCallback((moduleId: string, key: string, value: number | string) => {
    audioEngineRef.current.updateParam(moduleId, key, value);
    dispatch({ type: 'UPDATE_PARAM', payload: { moduleId, key, value } });
  }, []);

  const handleAddConnection = useCallback((fromPortId: string, toPortId: string): boolean => {
    const findPort = (id: string): Port | undefined =>
      state.modules
        .flatMap(m => m.ports)
        .find(p => p.id === id);

    const fromPort = findPort(fromPortId);
    const toPort = findPort(toPortId);
    if (!fromPort || !toPort) return false;

    const validation = validateConnection(fromPort, toPort);
    if (!validation.valid) {
      return false;
    }

    const conn: Connection = {
      id: generateId(),
      fromPortId,
      toPortId,
    };
    const success = audioEngineRef.current.connect(conn, state.modules);
    if (success) {
      dispatch({ type: 'ADD_CONNECTION', payload: { fromPortId, toPortId } });
    }
    return success;
  }, [state.modules]);

  const handleRemoveConnection = useCallback((id: string) => {
    audioEngineRef.current.disconnect(id);
    dispatch({ type: 'REMOVE_CONNECTION', payload: { id } });
  }, []);

  const handleTriggerEnvelope = useCallback((moduleId: string) => {
    audioEngineRef.current.triggerEnvelope(moduleId);
  }, []);

  const handleReleaseEnvelope = useCallback((moduleId: string) => {
    audioEngineRef.current.releaseEnvelope(moduleId);
  }, []);

  const contextValue: SynthContextType = {
    state,
    audioEngine: audioEngineRef.current,
    dispatch,
  };

  return (
    <SynthContext.Provider value={contextValue}>
      <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#1a1a2e' }}>
        <div className="flex flex-1 overflow-hidden">
          <ModulePanel
            onAddModule={handleAddModule}
            isOpen={panelOpen}
            onToggle={() => setPanelOpen(p => !p)}
          />

          <Workbench
            modules={state.modules}
            connections={state.connections}
            onMoveModule={handleMoveModule}
            onRemoveModule={handleRemoveModule}
            onAddConnection={handleAddConnection}
            onRemoveConnection={handleRemoveConnection}
            onParamChange={handleParamChange}
            onTriggerEnvelope={handleTriggerEnvelope}
            onReleaseEnvelope={handleReleaseEnvelope}
            onInitAudio={initAudio}
          />
        </div>

        <div
          className="flex items-center justify-between px-4 h-7 shrink-0"
          style={{
            background: 'rgba(22,33,62,0.95)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          <div className="flex items-center gap-4 text-[10px]">
            <span className="text-white/40">
              CPU: <span style={{ color: cpuUsage > 70 ? '#e94560' : cpuUsage > 40 ? '#ffd600' : '#00e5ff' }}>{cpuUsage.toFixed(1)}%</span>
            </span>
            <span className="text-white/40">
              采样率: <span style={{ color: '#00e5ff' }}>{sampleRate}Hz</span>
            </span>
            <span className="text-white/40">
              模块: <span style={{ color: '#ffd600' }}>{state.modules.length}</span>
            </span>
            <span className="text-white/40">
              连接: <span style={{ color: '#ffd600' }}>{state.connections.length}</span>
            </span>
          </div>
          <div className="text-[10px] text-white/20">
            {audioInitialized ? '🟢 音频就绪' : '🔴 点击工作区启动音频'}
          </div>
        </div>
      </div>
    </SynthContext.Provider>
  );
}

import React, { useReducer, useRef, useCallback } from 'react';
import StyleEditor from './StyleEditor';
import AnimationPreview from './AnimationPreview';
import CodePreview from './CodePreview';
import { presets, AnimationStep, AnimationPreset } from './presets';

interface AppState {
  steps: AnimationStep[];
  isPlaying: boolean;
  speed: number;
  duration: number;
  activePreset: string | null;
}

type Action =
  | { type: 'SET_STEPS'; steps: AnimationStep[] }
  | { type: 'ADD_STEP'; step: AnimationStep }
  | { type: 'UPDATE_STEP'; id: string; updates: Partial<AnimationStep> }
  | { type: 'REMOVE_STEP'; id: string }
  | { type: 'REORDER_STEPS'; steps: AnimationStep[] }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'SET_PLAYING'; playing: boolean }
  | { type: 'SET_SPEED'; speed: number }
  | { type: 'SET_DURATION'; duration: number }
  | { type: 'LOAD_PRESET'; preset: AnimationPreset }
  | { type: 'RESET' };

const defaultSteps: AnimationStep[] = [
  { id: crypto.randomUUID(), percentage: 0, property: 'transform', value: 'rotate(0deg)' },
  { id: crypto.randomUUID(), percentage: 100, property: 'transform', value: 'rotate(360deg)' },
];

const initialState: AppState = {
  steps: defaultSteps,
  isPlaying: true,
  speed: 1,
  duration: 2,
  activePreset: null,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_STEPS':
      return { ...state, steps: action.steps };
    case 'ADD_STEP':
      return { ...state, steps: [...state.steps, action.step], activePreset: null };
    case 'UPDATE_STEP':
      return {
        ...state,
        steps: state.steps.map((s) =>
          s.id === action.id ? { ...s, ...action.updates } : s
        ),
        activePreset: null,
      };
    case 'REMOVE_STEP':
      return {
        ...state,
        steps: state.steps.filter((s) => s.id !== action.id),
        activePreset: null,
      };
    case 'REORDER_STEPS':
      return { ...state, steps: action.steps, activePreset: null };
    case 'TOGGLE_PLAY':
      return { ...state, isPlaying: !state.isPlaying };
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.playing };
    case 'SET_SPEED':
      return { ...state, speed: action.speed };
    case 'SET_DURATION':
      return { ...state, duration: action.duration };
    case 'LOAD_PRESET':
      return {
        ...state,
        steps: action.preset.steps.map((s) => ({ ...s, id: crypto.randomUUID() })),
        duration: action.preset.duration,
        isPlaying: true,
        activePreset: action.preset.name,
      };
    case 'RESET':
      return {
        ...initialState,
        steps: defaultSteps.map((s) => ({ ...s, id: crypto.randomUUID() })),
      };
    default:
      return state;
  }
}

const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = useCallback(() => {
    const data = {
      steps: state.steps,
      duration: state.duration,
      speed: state.speed,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'animation-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.steps, state.duration, state.speed]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data.steps)) {
          dispatch({ type: 'SET_STEPS', steps: data.steps });
        }
        if (typeof data.duration === 'number') {
          dispatch({ type: 'SET_DURATION', duration: data.duration });
        }
        if (typeof data.speed === 'number') {
          dispatch({ type: 'SET_SPEED', speed: data.speed });
        }
      } catch {
        alert('导入失败：无效的 JSON 文件');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  return (
    <div style={styles.app}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImportFile}
      />

      <div style={styles.header}>
        <h1 style={styles.title}>CSS 动画组合预览工具</h1>
        <div style={styles.headerActions}>
          <button style={styles.headerBtn} onClick={handleImportClick}>
            导入配置
          </button>
          <button style={styles.headerBtn} onClick={handleExport}>
            导出配置
          </button>
        </div>
      </div>

      <div style={styles.layout}>
        <div style={styles.leftPanel}>
          <StyleEditor
            steps={state.steps}
            onAdd={(step) => dispatch({ type: 'ADD_STEP', step })}
            onUpdate={(id, updates) => dispatch({ type: 'UPDATE_STEP', id, updates })}
            onRemove={(id) => dispatch({ type: 'REMOVE_STEP', id })}
            onReorder={(steps) => dispatch({ type: 'REORDER_STEPS', steps })}
            presets={presets}
            activePreset={state.activePreset}
            onLoadPreset={(preset) => dispatch({ type: 'LOAD_PRESET', preset })}
          />
        </div>

        <div style={styles.centerPanel}>
          <AnimationPreview
            steps={state.steps}
            isPlaying={state.isPlaying}
            speed={state.speed}
            duration={state.duration}
            onTogglePlay={() => dispatch({ type: 'TOGGLE_PLAY' })}
            onReset={() => dispatch({ type: 'SET_PLAYING', playing: true })}
            onSpeedChange={(speed) => dispatch({ type: 'SET_SPEED', speed })}
          />
        </div>

        <div style={styles.rightPanel}>
          <CodePreview steps={state.steps} duration={state.duration} />
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  app: {
    width: '100%',
    height: '100vh',
    background: '#0F172A',
    color: '#E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #1E293B',
    flexShrink: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    margin: 0,
    color: '#E2E8F0',
  },
  headerActions: {
    display: 'flex',
    gap: 8,
  },
  headerBtn: {
    padding: '8px 16px',
    background: '#334155',
    color: '#E2E8F0',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    transition: 'background 0.2s ease-out',
  },
  layout: {
    flex: 1,
    display: 'flex',
    gap: 16,
    padding: 16,
    overflow: 'hidden',
  },
  leftPanel: {
    width: 360,
    flexShrink: 0,
  },
  centerPanel: {
    flex: 1,
    minWidth: 0,
  },
  rightPanel: {
    width: '25%',
    minWidth: 300,
    flexShrink: 0,
  },
};

const mediaStyle = document.createElement('style');
mediaStyle.textContent = `
  @media (max-width: 1024px) {
    [data-layout="true"] {
      flex-direction: column !important;
    }
    [data-layout="true"] > div {
      width: 100% !important;
      min-width: 0 !important;
    }
    [data-left="true"], [data-right="true"] {
      width: 50% !important;
    }
  }
  @media (max-width: 768px) {
    [data-left="true"], [data-right="true"] {
      width: 100% !important;
    }
  }
  [data-headerbtn]:hover { background: #6366F1 !important; }
`;
document.head.appendChild(mediaStyle);

export default App;

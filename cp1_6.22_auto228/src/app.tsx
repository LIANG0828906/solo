import React, { useReducer, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AppState,
  ModelMode,
  Measurement,
  HistoryEntry,
  AtomType,
  MoleculeData,
} from './types';
import { mockMoleculeData } from './mockData';
import {
  setupScene,
  loadMolecule,
  setModelMode as sceneSetModelMode,
  highlightAtoms,
  updateClipping,
  addMeasurement,
  removeMeasurement,
  clearAllMeasurements,
  resetCamera,
  getAtomInfo,
} from './scene';
import { LeftPanel, RightPanel } from './ui';
import './styles.css';

type Action =
  | { type: 'SET_MOLECULE'; payload: MoleculeData }
  | { type: 'SET_MODEL_MODE'; payload: ModelMode }
  | { type: 'SET_SELECTION'; payload: number[] }
  | { type: 'ADD_MEASUREMENT'; payload: Measurement }
  | { type: 'REMOVE_MEASUREMENT'; payload: number }
  | { type: 'CLEAR_MEASUREMENTS' }
  | { type: 'SET_CLIPPING_RADIUS'; payload: number }
  | { type: 'TOGGLE_MEASURING' }
  | { type: 'SET_MEASURE_FIRST'; payload: number | null }
  | { type: 'UNDO' }
  | { type: 'REDO' };

const MAX_HISTORY = 5;

function pushHistory(state: AppState, entry: HistoryEntry): HistoryEntry[] {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(entry);
  if (newHistory.length > MAX_HISTORY) {
    newHistory.shift();
  }
  return newHistory;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_MOLECULE':
      return { ...state, molecule: action.payload };

    case 'SET_MODEL_MODE': {
      const entry: HistoryEntry = {
        type: 'model-switch',
        selection: state.selection,
        clippingRadius: state.clippingRadius,
        modelMode: action.payload,
      };
      return {
        ...state,
        modelMode: action.payload,
        history: pushHistory(state, entry),
        historyIndex: state.historyIndex + 1 >= MAX_HISTORY
          ? MAX_HISTORY - 1
          : state.historyIndex + 1,
      };
    }

    case 'SET_SELECTION': {
      const entry: HistoryEntry = {
        type: 'selection',
        selection: action.payload,
        clippingRadius: state.clippingRadius,
        modelMode: state.modelMode,
      };
      return {
        ...state,
        selection: action.payload,
        history: pushHistory(state, entry),
        historyIndex: state.historyIndex + 1 >= MAX_HISTORY
          ? MAX_HISTORY - 1
          : state.historyIndex + 1,
      };
    }

    case 'ADD_MEASUREMENT':
      return {
        ...state,
        measurements: [...state.measurements, action.payload],
        isMeasuring: false,
        measureFirstAtom: null,
      };

    case 'REMOVE_MEASUREMENT':
      return {
        ...state,
        measurements: state.measurements.filter(m => m.id !== action.payload),
      };

    case 'CLEAR_MEASUREMENTS':
      return { ...state, measurements: [] };

    case 'SET_CLIPPING_RADIUS': {
      const entry: HistoryEntry = {
        type: 'clipping',
        selection: state.selection,
        clippingRadius: action.payload,
        modelMode: state.modelMode,
      };
      return {
        ...state,
        clippingRadius: action.payload,
        history: pushHistory(state, entry),
        historyIndex: state.historyIndex + 1 >= MAX_HISTORY
          ? MAX_HISTORY - 1
          : state.historyIndex + 1,
      };
    }

    case 'TOGGLE_MEASURING':
      return {
        ...state,
        isMeasuring: !state.isMeasuring,
        measureFirstAtom: state.isMeasuring ? null : state.measureFirstAtom,
      };

    case 'SET_MEASURE_FIRST':
      return { ...state, measureFirstAtom: action.payload };

    case 'UNDO': {
      if (state.historyIndex < 0) return state;
      const entry = state.history[state.historyIndex];
      if (!entry) return state;
      return {
        ...state,
        selection: entry.selection,
        clippingRadius: entry.clippingRadius,
        modelMode: entry.modelMode,
        historyIndex: state.historyIndex - 1,
      };
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      const nextIndex = state.historyIndex + 1;
      const entry = state.history[nextIndex];
      if (!entry) return state;
      return {
        ...state,
        selection: entry.selection,
        clippingRadius: entry.clippingRadius,
        modelMode: entry.modelMode,
        historyIndex: nextIndex,
      };
    }

    default:
      return state;
  }
}

const initialState: AppState = {
  molecule: null,
  modelMode: 'ball-stick',
  selection: [],
  measurements: [],
  clippingRadius: 30,
  isMeasuring: false,
  measureFirstAtom: null,
  history: [],
  historyIndex: -1,
};

let measureIdCounter = 0;

const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const sceneContainerRef = useRef<HTMLDivElement>(null);
  const sceneInitialized = useRef(false);

  useEffect(() => {
    if (sceneInitialized.current) return;
    sceneInitialized.current = true;

    const container = sceneContainerRef.current;
    if (!container) return;

    setupScene(container, {
      onAtomClick: (atomId: number) => {
        if (state.isMeasuring) {
          if (state.measureFirstAtom === null) {
            dispatch({ type: 'SET_MEASURE_FIRST', payload: atomId });
          } else {
            if (state.measurements.length < 5) {
              const firstId = state.measureFirstAtom;
              const a1 = getAtomInfo(firstId);
              const a2 = getAtomInfo(atomId);
              if (a1 && a2) {
                const dx = a1.x - a2.x;
                const dy = a1.y - a2.y;
                const dz = a1.z - a2.z;
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                const id = ++measureIdCounter;
                const m: Measurement = { id, atom1Id: firstId, atom2Id: atomId, distance };
                dispatch({ type: 'ADD_MEASUREMENT', payload: m });
                addMeasurement(id, firstId, atomId);
              }
            }
            dispatch({ type: 'SET_MEASURE_FIRST', payload: null });
          }
        } else {
          dispatch({ type: 'SET_SELECTION', payload: [atomId] });
        }
      },
      onBoxSelect: (atomIds: number[]) => {
        dispatch({ type: 'SET_SELECTION', payload: atomIds });
      },
    });

    loadMolecule(mockMoleculeData);
    dispatch({ type: 'SET_MOLECULE', payload: mockMoleculeData });
  }, []);

  useEffect(() => {
    highlightAtoms(state.selection);
  }, [state.selection]);

  useEffect(() => {
    sceneSetModelMode(state.modelMode);
  }, [state.modelMode]);

  useEffect(() => {
    updateClipping(state.clippingRadius);
  }, [state.clippingRadius]);

  const handleModelModeChange = useCallback((mode: ModelMode) => {
    dispatch({ type: 'SET_MODEL_MODE', payload: mode });
  }, []);

  const handleToggleMeasuring = useCallback(() => {
    dispatch({ type: 'TOGGLE_MEASURING' });
  }, []);

  const handleClearMeasurements = useCallback(() => {
    clearAllMeasurements();
    dispatch({ type: 'CLEAR_MEASUREMENTS' });
  }, []);

  const handleClippingRadiusChange = useCallback((radius: number) => {
    dispatch({ type: 'SET_CLIPPING_RADIUS', payload: radius });
  }, []);

  const handleUndo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const handleRedo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const handleResetCamera = useCallback(() => {
    resetCamera();
  }, []);

  const atomMap = new Map<number, AtomType>();
  if (state.molecule) {
    for (const atom of state.molecule.atoms) {
      atomMap.set(atom.id, atom);
    }
  }

  const selectedAtoms = state.selection
    .map(id => atomMap.get(id))
    .filter((a): a is AtomType => a !== undefined);

  return (
    <div className="app-container">
      <LeftPanel
        modelMode={state.modelMode}
        onModelModeChange={handleModelModeChange}
        isMeasuring={state.isMeasuring}
        onToggleMeasuring={handleToggleMeasuring}
        onClearMeasurements={handleClearMeasurements}
        measurementCount={state.measurements.length}
        clippingRadius={state.clippingRadius}
        onClippingRadiusChange={handleClippingRadiusChange}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onResetCamera={handleResetCamera}
        canUndo={state.historyIndex >= 0}
        canRedo={state.historyIndex < state.history.length - 1}
        history={state.history}
      />
      <div className="scene-container" ref={sceneContainerRef}>
        {state.isMeasuring && (
          <div className="measuring-indicator">
            <span className="measuring-dot" />
            {state.measureFirstAtom === null ? '点击第一个原子' : '点击第二个原子'}
          </div>
        )}
      </div>
      <RightPanel
        selectedAtoms={selectedAtoms}
        measurements={state.measurements}
        atomMap={atomMap}
      />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);

import React, { useReducer, useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import SpiceRack from './components/SpiceRack';
import MixingTable from './components/MixingTable';
import { 
  AppState, 
  AppAction, 
  WeighedSpice, 
  GroundPowder, 
  MoldedProduct,
  IncenseRecord,
  Spice
} from './types';

const initialState: AppState = {
  selectedSpices: [],
  groundPowder: null,
  moldedProduct: null,
  records: [],
  grindProgress: 0,
};

const generateIncenseName = (spices: WeighedSpice[]): string => {
  if (spices.length === 0) return '无名香';
  
  const prefixes = ['清', '雅', '幽', '静', '禅', '妙', '玄', '灵'];
  const mainSpice = spices.reduce((a, b) => a.weight > b.weight ? a : b);
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  
  if (mainSpice.name === '沉香') return `${prefix}沉香`;
  if (mainSpice.name === '檀香') return `${prefix}檀香`;
  if (mainSpice.name === '龙脑') return `${prefix}冰片香`;
  if (mainSpice.name === '丁香') return `${prefix}丁香`;
  if (mainSpice.name === '乳香') return `${prefix}乳香`;
  if (mainSpice.name === '麝香') return `${prefix}麝香`;
  
  return `${prefix}合香`;
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'ADD_SPICE': {
      const existingIndex = state.selectedSpices.findIndex(
        (s) => s.spiceId === action.payload.spiceId
      );
      
      let newSpices: WeighedSpice[];
      if (existingIndex >= 0) {
        newSpices = [...state.selectedSpices];
        newSpices[existingIndex] = {
          ...newSpices[existingIndex],
          weight: newSpices[existingIndex].weight + action.payload.weight,
        };
      } else {
        newSpices = [...state.selectedSpices, action.payload];
      }
      
      return {
        ...state,
        selectedSpices: newSpices,
        groundPowder: null,
        moldedProduct: null,
      };
    }
    
    case 'GRIND': {
      if (state.selectedSpices.length === 0) return state;
      
      const totalWeight = state.selectedSpices.reduce(
        (sum, s) => sum + s.weight, 
        0
      );
      
      const powder: GroundPowder = {
        spices: state.selectedSpices,
        fineness: state.grindProgress,
        totalWeight,
      };
      
      return {
        ...state,
        groundPowder: powder,
      };
    }
    
    case 'MOLD': {
      if (!state.groundPowder || state.grindProgress < 100) return state;
      
      const product: MoldedProduct = {
        id: uuidv4(),
        moldType: action.payload,
        powder: state.groundPowder,
        isIgnited: false,
        name: generateIncenseName(state.selectedSpices),
      };
      
      return {
        ...state,
        moldedProduct: product,
      };
    }
    
    case 'IGNITE': {
      if (!state.moldedProduct || state.moldedProduct.isIgnited) return state;
      
      const ignitedProduct: MoldedProduct = {
        ...state.moldedProduct,
        isIgnited: true,
      };
      
      const burnTime = state.moldedProduct.powder.totalWeight * 5;
      const record: IncenseRecord = {
        id: uuidv4(),
        name: state.moldedProduct.name,
        recipe: state.moldedProduct.powder.spices.map((s) => ({
          name: s.name,
          weight: s.weight,
        })),
        burnTime,
        timestamp: Date.now(),
      };
      
      const newRecords = [record, ...state.records].slice(0, 3);
      
      return {
        ...state,
        moldedProduct: ignitedProduct,
        records: newRecords,
      };
    }
    
    case 'RESET': {
      return {
        ...initialState,
        records: state.records,
      };
    }
    
    case 'UPDATE_GRIND_PROGRESS': {
      return {
        ...state,
        grindProgress: action.payload,
        groundPowder: state.groundPowder
          ? { ...state.groundPowder, fineness: action.payload }
          : null,
      };
    }
    
    case 'CLEAR_SELECTED_SPICES': {
      return {
        ...state,
        selectedSpices: [],
      };
    }
    
    default:
      return state;
  }
};

const App: React.FC = () => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [draggedSpice, setDraggedSpice] = useState<Spice | null>(null);

  const handleDragStart = useCallback((spice: Spice) => {
    setDraggedSpice(spice);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedSpice(null);
  }, []);

  const handleWeigh = useCallback((spice: WeighedSpice) => {
    dispatch({ type: 'ADD_SPICE', payload: spice });
    setDraggedSpice(null);
  }, []);

  const handleGrind = useCallback(() => {
    dispatch({ type: 'GRIND' });
  }, []);

  const handleMold = useCallback((moldType: 'plum' | 'ruyi' | 'stick') => {
    dispatch({ type: 'MOLD', payload: moldType });
  }, []);

  const handleIgnite = useCallback(() => {
    dispatch({ type: 'IGNITE' });
  }, []);

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const handleUpdateGrindProgress = useCallback((progress: number) => {
    dispatch({ type: 'UPDATE_GRIND_PROGRESS', payload: progress });
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="app-container">
      <div className="left-panel">
        <SpiceRack
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
        
        <div className="records-container">
          {state.records.map((record) => (
            <div key={record.id} className="record-card">
              <div className="record-title">{record.name}</div>
              <div className="record-recipe">
                {record.recipe.map((r, i) => (
                  <div key={i}>
                    {r.name}: {r.weight}钱
                  </div>
                ))}
              </div>
              <div className="record-time">
                燃时: {formatTime(record.burnTime)}
              </div>
              <div style={{ 
                position: 'absolute', 
                top: '8px', 
                right: '10px',
                fontSize: '9px',
                color: '#8d6e63'
              }}>
                {formatDate(record.timestamp)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="center-panel">
        <MixingTable
          selectedSpices={state.selectedSpices}
          groundPowder={state.groundPowder}
          moldedProduct={state.moldedProduct}
          grindProgress={state.grindProgress}
          draggedSpice={draggedSpice}
          onWeigh={handleWeigh}
          onGrind={handleGrind}
          onMold={handleMold}
          onIgnite={handleIgnite}
          onReset={handleReset}
          onUpdateGrindProgress={handleUpdateGrindProgress}
        />
      </div>
    </div>
  );
};

export default App;

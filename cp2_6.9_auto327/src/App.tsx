import { useReducer, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { AppState, AppAction, ShowRecord } from './types';
import { initialItems, initialActors, plays } from './data/mockData';
import Backstage from './components/Backstage';
import Stage from './components/Stage';

const initialState: AppState = {
  scene: 'backstage',
  items: initialItems,
  actors: initialActors,
  currentPlay: plays[0],
  showRecords: [],
  currentShow: null,
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SCENE':
      return { ...state, scene: action.payload };

    case 'BORROW_ITEM': {
      const { itemId, actorId } = action.payload;
      const updatedItems = state.items.map(item =>
        item.id === itemId ? { ...item, status: 'borrowed' as const } : item
      );
      const updatedActors = state.actors.map(actor =>
        actor.id === actorId && !actor.currentItems.includes(itemId)
          ? { ...actor, currentItems: [...actor.currentItems, itemId] }
          : actor
      );
      return { ...state, items: updatedItems, actors: updatedActors };
    }

    case 'RETURN_ITEM': {
      const { itemId, actorId } = action.payload;
      const updatedItems = state.items.map(item =>
        item.id === itemId ? { ...item, status: 'available' as const } : item
      );
      const updatedActors = state.actors.map(actor =>
        actor.id === actorId
          ? { ...actor, currentItems: actor.currentItems.filter(id => id !== itemId) }
          : actor
      );
      return { ...state, items: updatedItems, actors: updatedActors };
    }

    case 'MARK_ITEM_REPAIR': {
      const updatedItems = state.items.map(item =>
        item.id === action.payload ? { ...item, status: 'needs-repair' as const } : item
      );
      return { ...state, items: updatedItems };
    }

    case 'SET_PLAY':
      return { ...state, currentPlay: action.payload };

    case 'START_SHOW': {
      if (!state.currentPlay) return state;
      const actorRecords = state.currentPlay.cast.map(cast => {
        const actor = state.actors.find(a => a.id === cast.actorId)!;
        return {
          actorId: actor.id,
          actorName: actor.name,
          role: cast.role,
          wornItems: [...actor.currentItems],
          correctItems: cast.requiredItems,
          hasMistake: false,
          hasDamage: false,
        };
      });
      const newShow: ShowRecord = {
        id: uuidv4(),
        playId: state.currentPlay.id,
        playTitle: state.currentPlay.title,
        date: new Date().toISOString().split('T')[0],
        actorRecords,
      };
      return { ...state, currentShow: newShow, scene: 'stage' };
    }

    case 'END_SHOW': {
      const { hasMistake, hasDamage } = action.payload;
      if (!state.currentShow || !state.currentPlay) return state;

      const updatedActorRecords = state.currentShow.actorRecords.map(record => ({
        ...record,
        hasMistake,
        hasDamage,
      }));

      const updatedShow = { ...state.currentShow, actorRecords: updatedActorRecords };
      const updatedItems = state.items.map(item => {
        if (hasDamage && state.actors.some(a => a.currentItems.includes(item.id))) {
          return { ...item, status: 'needs-repair' as const };
        }
        if (item.status === 'borrowed') {
          return { ...item, status: 'available' as const };
        }
        return item;
      });

      const updatedActors = state.actors.map(actor => ({
        ...actor,
        currentItems: [],
      }));

      return {
        ...state,
        scene: 'backstage',
        showRecords: [...state.showRecords, updatedShow],
        currentShow: null,
        items: updatedItems,
        actors: updatedActors,
      };
    }

    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleBorrowItem = useCallback((itemId: string, actorId: string) => {
    dispatch({ type: 'BORROW_ITEM', payload: { itemId, actorId } });
  }, []);

  const handleReturnItem = useCallback((itemId: string, actorId: string) => {
    dispatch({ type: 'RETURN_ITEM', payload: { itemId, actorId } });
  }, []);

  const handleStartShow = useCallback(() => {
    dispatch({ type: 'START_SHOW' });
  }, []);

  const handleEndShow = useCallback((hasMistake: boolean, hasDamage: boolean) => {
    dispatch({ type: 'END_SHOW', payload: { hasMistake, hasDamage } });
  }, []);

  const handlePlayChange = useCallback((playId: string) => {
    const play = plays.find(p => p.id === playId);
    if (play) {
      dispatch({ type: 'SET_PLAY', payload: play });
    }
  }, []);

  const hasWarnings = state.items.some(item => item.status === 'needs-repair');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1a1a1a', color: '#c79a32', fontFamily: "'Noto Serif SC', serif" }}>
      <header style={{
        padding: '16px 24px',
        backgroundColor: '#8b0000',
        borderBottom: '2px solid #c79a32',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>🎭</span>
          <h1 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', color: '#c79a32', fontWeight: 700 }}>
            梨园后台
          </h1>
          {hasWarnings && (
            <span className="warning-icon" style={{ color: '#ff4444', fontSize: '20px' }}>⚠️</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>今日戏码：</span>
            <select
              value={state.currentPlay?.id || ''}
              onChange={(e) => handlePlayChange(e.target.value)}
              disabled={state.scene === 'stage'}
              style={{
                padding: '6px 12px',
                backgroundColor: '#1a1a1a',
                color: '#c79a32',
                border: '1px solid #c79a32',
                borderRadius: '4px',
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              {plays.map(play => (
                <option key={play.id} value={play.id}>{play.title}</option>
              ))}
            </select>
          </div>

          <div style={{ fontSize: '14px', opacity: 0.8 }}>
            演出记录: {state.showRecords.length} 场
          </div>
        </div>
      </header>

      <main style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
        <AnimatePresence mode="wait">
          {state.scene === 'backstage' ? (
            <motion.div
              key="backstage"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.5 }}
            >
              <Backstage
                items={state.items}
                actors={state.actors}
                currentPlay={state.currentPlay}
                onBorrowItem={handleBorrowItem}
                onReturnItem={handleReturnItem}
                onStartShow={handleStartShow}
              />
            </motion.div>
          ) : (
            <motion.div
              key="stage"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
            >
              <Stage
                actors={state.actors}
                items={state.items}
                currentPlay={state.currentPlay!}
                currentShow={state.currentShow!}
                onEndShow={handleEndShow}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {state.showRecords.length > 0 && state.scene === 'backstage' && (
        <footer style={{
          padding: '20px 24px',
          marginTop: '40px',
          backgroundColor: '#2a2a2a',
          borderTop: '1px solid #444',
        }}>
          <h3 style={{ color: '#c79a32', marginBottom: '16px', fontSize: '1.1rem' }}>演出记录</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {state.showRecords.slice(-5).reverse().map(record => (
              <div key={record.id} style={{
                padding: '12px 16px',
                backgroundColor: '#1a1a1a',
                border: '1px solid #444',
                borderRadius: '8px',
                minWidth: '200px',
              }}>
                <div style={{ fontWeight: 600, color: '#c79a32' }}>{record.playTitle}</div>
                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>{record.date}</div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  {record.actorRecords.some(r => r.hasMistake) && (
                    <span style={{ color: '#ff6b6b', fontSize: '12px' }}>❌ 穿错</span>
                  )}
                  {record.actorRecords.some(r => r.hasDamage) && (
                    <span style={{ color: '#ffa500', fontSize: '12px' }}>⚠️ 损坏</span>
                  )}
                  {!record.actorRecords.some(r => r.hasMistake || r.hasDamage) && (
                    <span style={{ color: '#51cf66', fontSize: '12px' }}>✅ 完美</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </footer>
      )}
    </div>
  );
}

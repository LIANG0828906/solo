import { useReducer, useEffect, useCallback } from 'react';
import { appReducer, initialState } from '@/reducer';
import type { Action } from '@/types';
import { Toolbar } from '@/components/Toolbar';
import { Canvas } from '@/components/Canvas';
import { BroadcastSync } from '@/utils/BroadcastSync';

interface AppProps {
  broadcastSync: BroadcastSync;
}

export default function App({ broadcastSync }: AppProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const dispatchWithSync = useCallback((action: Action) => {
    dispatch(action);
    broadcastSync.broadcastAction(action);
  }, [broadcastSync]);

  useEffect(() => {
    const savedState = broadcastSync.loadFromStorage();
    if (savedState) {
      dispatch({ type: 'SYNC_STATE', payload: savedState });
    }
  }, [broadcastSync]);

  useEffect(() => {
    broadcastSync.setOnStateSync((syncState) => {
      dispatch({ type: 'SYNC_STATE', payload: syncState });
    });

    broadcastSync.setOnActionDispatch((action) => {
      dispatch(action);
    });

    broadcastSync.setOnConnectionChange((connected) => {
      dispatch({ type: 'SET_SYNC_CONNECTED', payload: connected });
    });

    return () => {
      broadcastSync.destroy();
    };
  }, [broadcastSync]);

  useEffect(() => {
    const stateToSync = {
      strokes: state.strokes,
      notes: state.notes,
      connections: state.connections,
    };
    broadcastSync.saveToStorage(stateToSync);
  }, [state.strokes, state.notes, state.connections, broadcastSync]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Toolbar
        currentTool={state.currentTool}
        currentColor={state.currentColor}
        currentWidth={state.currentWidth}
        isSyncConnected={state.isSyncConnected}
        onToolChange={(tool) => dispatchWithSync({ type: 'SET_TOOL', payload: tool })}
        onColorChange={(color) => dispatchWithSync({ type: 'SET_COLOR', payload: color })}
        onWidthChange={(width) => dispatchWithSync({ type: 'SET_WIDTH', payload: width })}
        onClearCanvas={() => dispatchWithSync({ type: 'CLEAR_CANVAS' })}
      />
      <Canvas state={state} dispatch={dispatchWithSync} />
    </div>
  );
}

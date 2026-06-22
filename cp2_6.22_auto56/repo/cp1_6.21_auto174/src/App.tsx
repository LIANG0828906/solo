import { useEffect, useReducer } from 'react';
import { getGameEngine } from './main';
import GameUI from './components/GameUI';

function GameApp() {
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  useEffect(() => {
    const engine = getGameEngine();
    if (engine) {
      const unsubscribe = engine.subscribe(() => {
        forceUpdate();
      });
      return unsubscribe;
    }
    
    const checkEngine = setInterval(() => {
      const e = getGameEngine();
      if (e) {
        const unsubscribe = e.subscribe(() => {
          forceUpdate();
        });
        clearInterval(checkEngine);
        return unsubscribe;
      }
    }, 100);
    
    return () => clearInterval(checkEngine);
  }, []);

  const engine = getGameEngine();
  const state = engine?.getState() || {
    fragments: [],
    recipes: [],
    slots: [null, null, null],
    isNearAltar: false,
    collectedCount: 0,
    newRecipeName: null,
  };

  const handleCombine = () => {
    engine?.performCombination();
  };

  const handleAddToSlot = (fragmentId: number) => {
    return engine?.addToSlot(fragmentId) || false;
  };

  const handleRemoveFromSlot = (slotIndex: number) => {
    engine?.removeFromSlot(slotIndex);
  };

  const runesModule = engine?.runesModule || null;

  return (
    <GameUI
      onCombine={handleCombine}
      onAddToSlot={handleAddToSlot}
      onRemoveFromSlot={handleRemoveFromSlot}
      runesModule={runesModule}
      gameState={state}
    />
  );
}

export default GameApp;

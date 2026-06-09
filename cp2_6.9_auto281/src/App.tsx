import { useCallback } from 'react';
import { Scene } from './scene/Scene';
import { ControlPanel } from './components/ControlPanel';
import { useFlagStore } from './store/useFlagStore';

function App() {
  const flags = useFlagStore((state) => state.flags);
  const paths = useFlagStore((state) => state.paths);
  const selectedFlags = useFlagStore((state) => state.selectedFlags);
  const addFlag = useFlagStore((state) => state.addFlag);
  const removeFlag = useFlagStore((state) => state.removeFlag);
  const toggleSelectFlag = useFlagStore((state) => state.toggleSelectFlag);
  const generatePath = useFlagStore((state) => state.generatePath);
  const reset = useFlagStore((state) => state.reset);

  const handleGroundClick = useCallback(
    (position: [number, number, number]) => {
      addFlag(position);
    },
    [addFlag]
  );

  const handleSelectFlag = useCallback(
    (id: string) => {
      toggleSelectFlag(id);
    },
    [toggleSelectFlag]
  );

  const handleRemoveFlag = useCallback(
    (id: string) => {
      removeFlag(id);
    },
    [removeFlag]
  );

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <Scene
        flags={flags}
        paths={paths}
        selectedFlags={selectedFlags}
        onGroundClick={handleGroundClick}
        onSelectFlag={handleSelectFlag}
      />
      <ControlPanel
        flags={flags}
        selectedFlags={selectedFlags}
        onSelectFlag={handleSelectFlag}
        onRemoveFlag={handleRemoveFlag}
        onGeneratePath={generatePath}
        onReset={reset}
      />
    </div>
  );
}

export default App;

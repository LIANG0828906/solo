import { useEffect } from 'react';
import Toolbar from './components/Toolbar';
import Board from './components/Board';
import PropertyPanel from './components/PropertyPanel';
import AssetLibrary from './components/AssetLibrary';
import PageSwitcher from './components/PageSwitcher';
import { useBoardStore } from './store/boardStore';
import { useUIStore } from './store/uiStore';

export default function App() {
  const initFromStorage = useBoardStore((s) => s.initFromStorage);
  const themeName = useUIStore((s) => s.themeName);
  const setTheme = useUIStore((s) => s.setTheme);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  useEffect(() => {
    document.body.classList.toggle('dark', themeName === 'dark');
  }, [themeName]);

  void setTheme;

  return (
    <div className="app">
      <Toolbar />
      <div
        style={{
          position: 'relative',
          flex: 1,
          marginTop: 'var(--toolbar-height)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <PageSwitcher />
        <Board />
      </div>
      <PropertyPanel />
      <AssetLibrary />
    </div>
  );
}

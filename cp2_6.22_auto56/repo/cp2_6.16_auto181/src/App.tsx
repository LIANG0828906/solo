import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Toolbar } from '@/components/Toolbar';
import { PanelList } from '@/modules/editor/PanelList';
import { CharacterTray } from '@/modules/editor/CharacterTray';
import { PanelEditor } from '@/modules/editor/PanelEditor';
import { StoryPlayer } from '@/modules/player/StoryPlayer';

const App: React.FC = () => {
  const { isPlayerMode } = useStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (isPlayerMode) {
    return <StoryPlayer />;
  }

  return (
    <div className="w-full h-full flex flex-col" style={{ backgroundColor: '#FFF8E7' }}>
      <Toolbar onToggleDrawer={() => setDrawerOpen(true)} />

      <div className="flex flex-1 overflow-hidden relative">
        <PanelList onCloseDrawer={drawerOpen ? () => setDrawerOpen(false) : undefined} />

        {drawerOpen && (
          <div
            className="fixed inset-0 z-30 lg:hidden"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
            onClick={() => setDrawerOpen(false)}
          />
        )}

        <PanelEditor />

        <CharacterTray onDragStartCharacter={() => {}} />
      </div>
    </div>
  );
};

export default App;

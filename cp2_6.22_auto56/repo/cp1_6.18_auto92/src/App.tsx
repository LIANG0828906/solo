import React, { useState, useEffect, useRef } from 'react';
import { useCharacterStore } from './stores/characterStore';
import { CharacterList } from './components/CharacterList';
import { CharacterDetail } from './components/CharacterDetail';
import { ForceGraph } from './components/ForceGraph';
import { EditModal } from './components/EditModal';
import { RelationPanel } from './components/RelationPanel';
import { HistoryBar } from './components/HistoryBar';
import { TopBar } from './components/TopBar';

const App: React.FC = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState(null as any);
  const [graphSize, setGraphSize] = useState({ width: 800, height: 600 });
  const graphContainerRef = useRef<HTMLDivElement>(null);

  const isFlashing = useCharacterStore((s) => s.isFlashing);
  const warningMessage = useCharacterStore((s) => s.warningMessage);
  const selectedCharacterId = useCharacterStore((s) => s.selectedCharacterId);
  const characters = useCharacterStore((s) => s.characters);

  useEffect(() => {
    const updateSize = () => {
      if (graphContainerRef.current) {
        setGraphSize({
          width: graphContainerRef.current.clientWidth,
          height: graphContainerRef.current.clientHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleAddCharacter = () => {
    setEditingCharacter(null);
    setIsEditModalOpen(true);
  };

  const handleEditCharacter = () => {
    const char = characters.find((c) => c.id === selectedCharacterId);
    if (char) {
      setEditingCharacter(char);
      setIsEditModalOpen(true);
    }
  };

  const selectedChar = characters.find((c) => c.id === selectedCharacterId);

  return (
    <div className={`app ${isFlashing ? 'flash-effect' : ''}`}>
      <TopBar />

      <div className="main-layout">
        <aside className="sidebar left-sidebar">
          <CharacterList onAddCharacter={handleAddCharacter} />
        </aside>

        <main className="graph-area" ref={graphContainerRef}>
          {graphSize.width > 0 && graphSize.height > 0 && (
            <ForceGraph width={graphSize.width} height={graphSize.height} />
          )}
          <div className="graph-overlay-panels">
            <RelationPanel />
          </div>
        </main>

        <aside className="sidebar right-sidebar">
          <CharacterDetail onEdit={handleEditCharacter} />
        </aside>
      </div>

      <HistoryBar />

      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        character={editingCharacter}
      />

      {warningMessage && (
        <div className="warning-toast">{warningMessage}</div>
      )}

      {isFlashing && <div className="flash-overlay" />}
    </div>
  );
};

export default App;

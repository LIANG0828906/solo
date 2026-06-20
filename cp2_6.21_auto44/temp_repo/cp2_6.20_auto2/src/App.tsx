import React, { useEffect } from 'react';
import { ConfigPanel } from './components/ConfigPanel';
import { PasswordResult } from './components/PasswordResult';
import { HistoryPanel } from './components/HistoryPanel';
import { usePassword } from './hooks/usePassword';

const App: React.FC = () => {
  const {
    config,
    updateConfig,
    currentPassword,
    displayedPassword,
    isAnimating,
    strength,
    history,
    toasts,
    draggedItemId,
    setDraggedItemId,
    handleGenerate,
    copyToClipboard,
    toggleFavorite,
    deleteHistoryItem,
    clearHistory,
    reorderHistory
  } = usePassword();

  useEffect(() => {
    handleGenerate();
  }, []);

  return (
    <div className="app-container">
      <ConfigPanel
        config={config}
        onConfigChange={updateConfig}
      />
      <main className="main-content">
        <PasswordResult
          currentPassword={currentPassword}
          displayedPassword={displayedPassword}
          isAnimating={isAnimating}
          strength={strength}
          toasts={toasts}
          onGenerate={handleGenerate}
          onCopy={copyToClipboard}
        />
        <HistoryPanel
          history={history}
          draggedItemId={draggedItemId}
          setDraggedItemId={setDraggedItemId}
          onCopy={copyToClipboard}
          onToggleFavorite={toggleFavorite}
          onDelete={deleteHistoryItem}
          onReorder={reorderHistory}
          onClear={clearHistory}
        />
      </main>
    </div>
  );
};

export default App;

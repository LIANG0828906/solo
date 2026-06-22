import { useState, useEffect, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { ProjectProvider, useProject } from '@/store/ProjectContext';
import { ProjectList } from '@/components/ProjectList';
import { IdeaBoard } from '@/components/IdeaBoard';
import { Toolbar } from '@/components/Toolbar';
import { Modal } from '@/components/Modal';
import { exportProjectToJson } from '@/utils/export';
import type { IdeaCard as IdeaCardType } from '@/types';

const AppContent = () => {
  const {
    state,
    addProject,
    setCurrentProject,
    addCard,
    moveCard,
    updateCardNote,
    deleteCard,
    restoreCard,
    clearBoard,
    extractColors,
  } = useProject();

  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const currentProject = state.projects.find(p => p.id === state.currentProjectId);

  const handleAddImage = useCallback(
    async (file: File) => {
      if (!currentProject) return;

      const imageUrl = URL.createObjectURL(file);
      setPendingImage(file);

      try {
        const colors = await extractColors(imageUrl);

        const existingCards = currentProject.cards.length;
        const columns = Math.min(4, Math.max(1, Math.floor(window.innerWidth / 240)));
        const row = Math.floor(existingCards / columns);
        const col = existingCards % columns;

        const newCard: Omit<IdeaCardType, 'id' | 'createdAt'> = {
          imageUrl,
          imageName: file.name,
          colors,
          note: '',
          position: {
            x: col * 240 + 20,
            y: row * 320 + 20,
          },
        };

        addCard(currentProject.id, newCard);
      } catch (error) {
        console.error('Failed to process image:', error);
      } finally {
        setPendingImage(null);
      }
    },
    [currentProject, extractColors, addCard]
  );

  const handleMoveCard = useCallback(
    (cardId: string, position: { x: number; y: number }) => {
      if (currentProject) {
        moveCard(currentProject.id, cardId, position);
      }
    },
    [currentProject, moveCard]
  );

  const handleUpdateCardNote = useCallback(
    (cardId: string, note: string) => {
      if (currentProject) {
        updateCardNote(currentProject.id, cardId, note);
      }
    },
    [currentProject, updateCardNote]
  );

  const handleDeleteCard = useCallback(
    (cardId: string): IdeaCardType | null => {
      if (currentProject) {
        return deleteCard(currentProject.id, cardId);
      }
      return null;
    },
    [currentProject, deleteCard]
  );

  const handleRestoreCard = useCallback(
    (card: IdeaCardType) => {
      if (currentProject) {
        restoreCard(currentProject.id, card);
      }
    },
    [currentProject, restoreCard]
  );

  const handleClearBoard = useCallback(() => {
    if (currentProject) {
      clearBoard(currentProject.id);
    }
  }, [currentProject, clearBoard]);

  const handleExport = useCallback(() => {
    if (currentProject) {
      exportProjectToJson(currentProject);
    }
  }, [currentProject]);

  const handleClearRequest = useCallback(() => {
    setShowClearModal(true);
  }, []);

  const handleClearConfirm = useCallback(() => {
    handleClearBoard();
    setShowClearModal(false);
  }, [handleClearBoard]);

  return (
    <div className="app">
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#ffffff',
            color: '#333333',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          },
        }}
      />

      <Toolbar
        currentProject={currentProject}
        onAddImage={handleAddImage}
        onClearBoard={handleClearRequest}
        onExport={handleExport}
        onToggleMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        isMobile={isMobile}
      />

      <div className="app-body">
        <ProjectList
          projects={state.projects}
          currentProjectId={state.currentProjectId}
          onSelectProject={setCurrentProject}
          onAddProject={addProject}
          isMobile={isMobile}
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        {isMobile && mobileMenuOpen && (
          <div
            className="mobile-overlay"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <main className="main-content">
          <IdeaBoard
            project={currentProject}
            onMoveCard={handleMoveCard}
            onUpdateCardNote={handleUpdateCardNote}
            onDeleteCard={handleDeleteCard}
            onRestoreCard={handleRestoreCard}
            onClearBoard={handleClearBoard}
          />
        </main>
      </div>

      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearConfirm}
        title="确认清空"
        message="确定要清空当前灵感板吗？此操作无法撤销。"
        confirmText="清空"
        cancelText="取消"
      />

      {pendingImage && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <p>正在处理图片...</p>
        </div>
      )}
    </div>
  );
};

const App = () => {
  return (
    <ProjectProvider>
      <AppContent />
    </ProjectProvider>
  );
};

export default App;

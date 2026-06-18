import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, User } from 'lucide-react';
import { usePrototypeStore } from '../stores/prototypeStore';
import { Toolbar } from '../modules/board/Toolbar';
import { BoardCanvas } from '../modules/board/BoardCanvas';
import { PropertyPanel } from '../modules/board/PropertyPanel';
import { ScreenManager } from '../modules/board/ScreenManager';
import { InviteDialog } from '../modules/collab/InviteDialog';

export const ProjectEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    currentProjectId,
    currentScreenId,
    selectedComponentId,
    projects,
    setCurrentProject,
    setCurrentScreen,
    selectComponent,
    clearCurrentProject,
  } = usePrototypeStore();

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showPropertyPanel, setShowPropertyPanel] = useState(true);

  const currentProject = projects.find((p) => p.id === id);

  useEffect(() => {
    if (id && id !== currentProjectId) {
      setCurrentProject(id);
    }
    return () => {
      clearCurrentProject();
    };
  }, [id, currentProjectId, setCurrentProject, clearCurrentProject]);

  useEffect(() => {
    const checkWidth = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.activeElement?.tagName === 'INPUT') return;
        selectComponent(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectComponent]);

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">😕</div>
          <p className="text-slate-600 mb-4">项目不存在或已被删除</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      <header className="bg-[#1E293B] p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-white font-semibold">{currentProject.name}</h1>
            <p className="text-slate-400 text-xs">{currentProject.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInviteDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm font-medium"
          >
            <Share2 size={16} />
            分享
          </button>
          <button
            className="w-9 h-9 bg-slate-600 hover:bg-slate-500 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <User size={18} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <Toolbar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <BoardCanvas
            onComponentUpdate={() => {}}
            onComponentSelect={(id) => {
              selectComponent(id);
              if (isMobile && id) {
                setShowPropertyPanel(true);
              }
            }}
          />
          <ScreenManager />
        </div>

        {isMobile ? (
          <>
            {showPropertyPanel && selectedComponentId && (
              <div className="fixed inset-x-0 bottom-0 top-auto z-40 animate-slideUp">
                <div className="bg-white rounded-t-2xl shadow-2xl max-h-[70vh] overflow-hidden">
                  <div className="flex justify-center py-2">
                    <div className="w-12 h-1 bg-slate-300 rounded-full" />
                  </div>
                  <div className="h-full overflow-auto">
                    <PropertyPanel
                      selectedComponentId={selectedComponentId}
                      onClose={() => setShowPropertyPanel(false)}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-4 flex-shrink-0">
            <PropertyPanel selectedComponentId={selectedComponentId} />
          </div>
        )}
      </div>

      <InviteDialog
        isOpen={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
        projectId={id!}
      />
    </div>
  );
};

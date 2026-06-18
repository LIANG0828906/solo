import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { usePrototypeStore } from '../stores/prototypeStore';
import { ConnectionLine } from '../components/ConnectionLine';
import type { Component } from '../types';

export const ProjectPreview: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    projects,
    screens,
    components,
    connections,
    currentScreenId,
    setCurrentProject,
    setCurrentScreen,
    clearCurrentProject,
  } = usePrototypeStore();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showModal, setShowModal] = useState<string | null>(null);

  const currentProject = projects.find((p) => p.id === id);
  const projectScreens = screens
    .filter((s) => s.projectId === id)
    .sort((a, b) => a.order - b.order);
  const currentScreen = projectScreens.find((s) => s.id === currentScreenId);
  const currentComponents = components.filter(
    (c) => c.screenId === currentScreenId
  );

  useEffect(() => {
    if (id) {
      setCurrentProject(id);
    }
    return () => {
      clearCurrentProject();
    };
  }, [id, setCurrentProject, clearCurrentProject]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate(`/project/${id}`);
      }
      if (e.key === 'ArrowLeft') {
        handlePrevScreen();
      }
      if (e.key === 'ArrowRight') {
        handleNextScreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [id, navigate, projectScreens, currentScreenId]);

  const handlePrevScreen = () => {
    const currentIndex = projectScreens.findIndex((s) => s.id === currentScreenId);
    if (currentIndex > 0) {
      setCurrentScreen(projectScreens[currentIndex - 1].id);
    }
  };

  const handleNextScreen = () => {
    const currentIndex = projectScreens.findIndex((s) => s.id === currentScreenId);
    if (currentIndex < projectScreens.length - 1) {
      setCurrentScreen(projectScreens[currentIndex + 1].id);
    }
  };

  const handleComponentClick = (component: Component) => {
    if (component.interaction) {
      if (component.interaction.type === 'navigate' && component.interaction.targetScreenId) {
        setCurrentScreen(component.interaction.targetScreenId);
      } else if (component.interaction.type === 'modal' && component.interaction.modalContent) {
        setShowModal(component.interaction.modalContent);
      } else if (component.interaction.type === 'animation') {
        console.log('Trigger animation:', component.interaction.animationType);
      }
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">😕</div>
          <p className="text-slate-300 mb-4">项目不存在</p>
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

  const currentIndex = projectScreens.findIndex((s) => s.id === currentScreenId);

  return (
    <div className="h-screen flex flex-col bg-slate-900 overflow-hidden">
      <header className="bg-slate-800/90 backdrop-blur px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/project/${id}`)}
            className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-white font-semibold">{currentProject.name}</h1>
            <p className="text-slate-400 text-xs">
              预览模式 · 屏幕 {currentIndex + 1} / {projectScreens.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleFullscreen}
            className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
            title="全屏"
          >
            <Maximize2 size={20} />
          </button>
          <button
            onClick={() => navigate(`/project/${id}`)}
            className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div
            className="relative bg-white rounded-xl shadow-2xl overflow-hidden"
            style={{ width: '100%', maxWidth: '1200px', aspectRatio: '16/9' }}
          >
            <div className="absolute inset-0 p-8">
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ overflow: 'visible' }}
              >
                {connections
                  .filter((conn) => {
                    const fromComponent = components.find(
                      (c) => c.id === conn.fromComponentId
                    );
                    return fromComponent?.screenId === currentScreenId;
                  })
                  .map((conn) => {
                    const fromComponent = components.find(
                      (c) => c.id === conn.fromComponentId
                    );
                    const toScreen = screens.find((s) => s.id === conn.toScreenId);
                    return (
                      <ConnectionLine
                        key={conn.id}
                        connection={conn}
                        fromComponent={fromComponent}
                        toScreen={toScreen}
                        isPreview
                      />
                    );
                  })}
              </svg>

              {currentComponents.map((component) => (
                <div
                  key={component.id}
                  className="absolute transition-all duration-200 hover:shadow-lg"
                  style={{
                    left: component.x,
                    top: component.y,
                    width: component.width,
                    height: component.height,
                    backgroundColor: component.backgroundColor,
                    borderRadius: component.borderRadius,
                    border: `1px solid ${component.borderColor}`,
                    cursor: component.interaction ? 'pointer' : 'default',
                  }}
                  onClick={() => handleComponentClick(component)}
                >
                  {component.type === 'text' && component.text && (
                    <div
                      className="w-full h-full flex items-center justify-center px-2"
                      style={{
                        fontSize: component.fontSize,
                        fontWeight: component.fontWeight,
                        color: '#1E293B',
                      }}
                    >
                      {component.text}
                    </div>
                  )}
                  {component.type === 'button' && (
                    <div
                      className="w-full h-full flex items-center justify-center text-white font-medium"
                      style={{ fontSize: component.fontSize }}
                    >
                      {component.text || '按钮'}
                    </div>
                  )}
                  {component.type === 'image' && component.imageUrl && (
                    <img
                      src={component.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      style={{ borderRadius: component.borderRadius }}
                    />
                  )}
                  {component.interaction && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                      ⚡
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {projectScreens.length > 1 && (
          <>
            <button
              onClick={handlePrevScreen}
              disabled={currentIndex === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={handleNextScreen}
              disabled={currentIndex === projectScreens.length - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {projectScreens.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {projectScreens.map((screen, index) => (
              <button
                key={screen.id}
                onClick={() => setCurrentScreen(screen.id)}
                className={`w-2 h-2 rounded-full transition-all ${
                  screen.id === currentScreenId
                    ? 'bg-white w-6'
                    : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-800/90 backdrop-blur px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
          <span>按</span>
          <kbd className="px-2 py-0.5 bg-slate-700 rounded text-xs">←</kbd>
          <kbd className="px-2 py-0.5 bg-slate-700 rounded text-xs">→</kbd>
          <span>切换屏幕</span>
          <span className="text-slate-600">|</span>
          <kbd className="px-2 py-0.5 bg-slate-700 rounded text-xs">Esc</kbd>
          <span>退出预览</span>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 animate-scaleIn">
            <div className="p-6">
              <p className="text-slate-700">{showModal}</p>
            </div>
            <div className="px-6 pb-6">
              <button
                onClick={() => setShowModal(null)}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

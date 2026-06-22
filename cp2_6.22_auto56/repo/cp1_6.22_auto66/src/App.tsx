import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Frame } from './types';
import StoryBoard from './modules/storyboard/StoryBoard';
import FrameThumbnail from './modules/storyboard/FrameThumbnail';
import TextEditor from './modules/storyboard/TextEditor';
import PreviewModal from './modules/preview/PreviewModal';
import { exportPdf } from './modules/export/exportApi';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 450;

function createFrame(index: number): Frame {
  return {
    id: uuidv4(),
    index,
    description: '',
    createdAt: Date.now(),
  };
}

export default function App() {
  const [frames, setFrames] = useState<Frame[]>(() => [createFrame(1)]);
  const [currentFrameId, setCurrentFrameId] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [editorHeight, setEditorHeight] = useState(160);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingEditor, setIsResizingEditor] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [newFrameIds, setNewFrameIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!currentFrameId && frames.length > 0) {
      setCurrentFrameId(frames[0].id);
    }
  }, [frames, currentFrameId]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentFrame = frames.find((f) => f.id === currentFrameId) || null;
  const currentIndex = currentFrame ? frames.findIndex((f) => f.id === currentFrameId) : -1;

  const addFrame = useCallback(() => {
    const newFrame = createFrame(frames.length + 1);
    setFrames((prev) => [...prev, newFrame]);
    setCurrentFrameId(newFrame.id);
    setNewFrameIds((prev) => new Set(prev).add(newFrame.id));
    setTimeout(() => {
      setNewFrameIds((prev) => {
        const next = new Set(prev);
        next.delete(newFrame.id);
        return next;
      });
    }, 400);
  }, [frames.length]);

  const deleteFrame = useCallback(
    (frameId: string) => {
      if (frames.length <= 1) return;
      const idx = frames.findIndex((f) => f.id === frameId);
      const newFrames = frames
        .filter((f) => f.id !== frameId)
        .map((f, i) => ({ ...f, index: i + 1 }));
      setFrames(newFrames);
      if (currentFrameId === frameId) {
        const newIdx = Math.min(idx, newFrames.length - 1);
        setCurrentFrameId(newFrames[newIdx]?.id || null);
      }
    },
    [frames, currentFrameId]
  );

  const selectFrame = useCallback((frameId: string) => {
    setCurrentFrameId(frameId);
  }, []);

  const reorderFrames = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      const newFrames = [...frames];
      const [removed] = newFrames.splice(fromIndex, 1);
      newFrames.splice(toIndex, 0, removed);
      const reindexed = newFrames.map((f, i) => ({ ...f, index: i + 1 }));
      setFrames(reindexed);
      const targetId = reindexed[0]?.id;
      if (targetId) {
        setCurrentFrameId(targetId);
      }
    },
    [frames]
  );

  const updateFrameDescription = useCallback(
    (frameId: string, description: string) => {
      setFrames((prev) =>
        prev.map((f) => (f.id === frameId ? { ...f, description } : f))
      );
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isResizingSidebar) {
        const newWidth = Math.max(120, Math.min(400, e.clientX));
        setSidebarWidth(newWidth);
        if (newWidth <= 80) {
          setSidebarCollapsed(true);
        } else {
          setSidebarCollapsed(false);
        }
      }
      if (isResizingEditor) {
        const container = document.querySelector('.editor-section');
        if (container) {
          const rect = container.getBoundingClientRect();
          const newHeight = Math.max(100, Math.min(400, rect.bottom - e.clientY + 6));
          setEditorHeight(newHeight);
        }
      }
    },
    [isResizingSidebar, isResizingEditor]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizingSidebar(false);
    setIsResizingEditor(false);
  }, []);

  useEffect(() => {
    if (isResizingSidebar || isResizingEditor) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizingSidebar, isResizingEditor, handleMouseMove, handleMouseUp]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportPdf(frames);
    } catch (err) {
      console.error('导出失败:', err);
      alert('导出失败，请确保后端服务已启动');
    } finally {
      setIsExporting(false);
    }
  };

  const goToFrame = useCallback(
    (index: number) => {
      const clampedIndex = Math.max(0, Math.min(frames.length - 1, index));
      const frame = frames[clampedIndex];
      if (frame) {
        setCurrentFrameId(frame.id);
      }
    },
    [frames]
  );

  return (
    <div className="app-container">
      <aside
        className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
        style={
          {
            '--sidebar-width': `${sidebarWidth}px`,
          } as React.CSSProperties
        }
      >
        <div className="sidebar-header">
          <span className="sidebar-icon">🎬</span>
          <span className="sidebar-title">故事板</span>
        </div>

        <FrameThumbnail
          frames={frames}
          currentFrameId={currentFrameId}
          newFrameIds={newFrameIds}
          collapsed={sidebarCollapsed}
          onSelect={selectFrame}
          onDelete={deleteFrame}
          onReorder={reorderFrames}
        />

        <div className="sidebar-footer">
          <button className="btn btn-primary" onClick={addFrame}>
            <span>＋</span>
            <span>新增帧</span>
          </button>
        </div>

        <div
          className={`resizer ${isResizingSidebar ? 'active' : ''}`}
          onMouseDown={() => setIsResizingSidebar(true)}
        />
      </aside>

      <main className="main-area">
        <div className="topbar">
          <button
            className="topbar-toggle"
            onClick={() => setSidebarCollapsed((s) => !s)}
            title={sidebarCollapsed ? '展开侧边栏' : '折叠侧边栏'}
          >
            {sidebarCollapsed ? '☰' : '✕'}
          </button>
          <div className="topbar-title">
            {currentFrame ? `第 ${currentFrame.index} 帧 / 共 ${frames.length} 帧` : '故事板'}
          </div>
          <div className="topbar-actions">
            <button className="btn btn-ghost" onClick={() => setIsPreviewMode(true)}>
              ▶ 预览
            </button>
            <button
              className="btn btn-primary"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? <span className="loading" /> : '⬇'}
              {isExporting ? '导出中' : '导出PDF'}
            </button>
          </div>
        </div>

        <StoryBoard
          frame={currentFrame}
          canvasWidth={CANVAS_WIDTH}
          canvasHeight={CANVAS_HEIGHT}
        />

        <section className="editor-section" style={{ height: `${editorHeight}px` }}>
          <div
            className={`editor-resizer ${isResizingEditor ? 'active' : ''}`}
            onMouseDown={() => setIsResizingEditor(true)}
          />
          <TextEditor
            frame={currentFrame}
            onUpdateDescription={updateFrameDescription}
          />
        </section>
      </main>

      {isPreviewMode && (
        <PreviewModal
          frames={frames}
          currentIndex={currentIndex}
          onClose={() => setIsPreviewMode(false)}
          onGoToFrame={goToFrame}
          canvasWidth={CANVAS_WIDTH}
          canvasHeight={CANVAS_HEIGHT}
        />
      )}
    </div>
  );
}

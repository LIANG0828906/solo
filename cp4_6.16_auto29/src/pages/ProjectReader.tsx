import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProgressPanel } from '@/components/ProgressPanel';
import { PatternGrid } from '@/components/PatternGrid';
import { useProjectStore } from '@/store/projectStore';
import { calculateActiveSeconds } from '@/utils/time';
import './ProjectReader.css';

export function ProjectReader() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    loadProjects,
    advanceRow,
    undo,
    startActiveSession,
    endActiveSession,
  } = useProjectStore();
  const projects = useProjectStore((state) => {
    console.log('[Reader] selector called, projects.length:', state.projects.length);
    return state.projects;
  });
  const project = id ? projects.find((p) => p.id === id) : undefined;
  console.log('[Reader] render, project?.currentRow:', project?.currentRow, 'undoStack size:', project?.undoStack?.length);

  const [activeSeconds, setActiveSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);
  const isLeavingRef = useRef(false);

  useEffect(() => {
    console.log('[Reader] loadProjects useEffect');
    loadProjects();
  }, [loadProjects]);

  const updateActiveSeconds = useCallback(() => {
    if (project) {
      setActiveSeconds(calculateActiveSeconds(project.activeSegments, Date.now()));
    }
  }, [project]);

  useEffect(() => {
    if (!project) return;

    updateActiveSeconds();

    if (project.currentRow < project.rowCount) {
      startActiveSession(project.id);

      timerRef.current = window.setInterval(() => {
        updateActiveSeconds();
      }, 1000);
    }

    isLeavingRef.current = false;

    return () => {
      if (isLeavingRef.current) return;
      isLeavingRef.current = true;

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      endActiveSession(project.id);
    };
  }, [project?.id, project?.currentRow, startActiveSession, endActiveSession, updateActiveSeconds]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!project) return;
      if (document.hidden) {
        endActiveSession(project.id);
      } else {
        startActiveSession(project.id);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [project, startActiveSession, endActiveSession]);

  const handleAdvanceRow = useCallback(() => {
    if (!project || project.currentRow >= project.rowCount) return;
    advanceRow(project.id);
  }, [project, advanceRow]);

  const handleUndo = useCallback(() => {
    if (!project || project.undoStack.length === 0) return;
    undo(project.id);
  }, [project, undo]);

  const handleBack = useCallback(async () => {
    if (!project) {
      navigate('/');
      return;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    await endActiveSession(project.id);
    navigate('/');
  }, [project, navigate, endActiveSession]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleAdvanceRow();
      } else if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleUndo();
      } else if (e.code === 'Escape') {
        handleBack();
      }
    },
    [handleAdvanceRow, handleUndo, handleBack]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const beforeUnload = () => {
      if (project && !isLeavingRef.current) {
        endActiveSession(project.id);
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [project, endActiveSession]);

  if (!project) {
    return (
      <div className="reader-page">
        <div className="reader-page__loading">项目不存在</div>
      </div>
    );
  }

  const isCompleted = project.currentRow >= project.rowCount;

  return (
    <div className="reader-page">
      <header className="reader-header">
        <button className="reader-header__back" onClick={handleBack} aria-label="返回">
          ← 返回
        </button>
        <div className="reader-header__title">
          <div
            className="reader-header__color-dot"
            style={{ backgroundColor: project.yarnColor }}
          />
          <h1 className="reader-header__name">{project.name}</h1>
        </div>
        <div style={{ width: 60 }} />
      </header>

      <div className="reader-page__progress">
        <ProgressPanel
          currentRow={project.currentRow}
          totalRows={project.rowCount}
          elapsedSeconds={activeSeconds}
        />
      </div>

      <main className="reader-page__content">
        <div className="reader-page__grid-wrapper">
          <PatternGrid
            patternText={project.patternText}
            currentRow={project.currentRow}
            totalRows={project.rowCount}
          />
        </div>
      </main>

      <footer className="reader-footer">
        <button
          className={`btn reader-footer__btn reader-footer__undo ${
            project.undoStack.length === 0 ? 'is-disabled' : ''
          }`}
          onClick={handleUndo}
          disabled={project.undoStack.length === 0}
        >
          ↶ 撤销
          <span className="reader-footer__hint">
            可撤销 {project.undoStack.length}/5
          </span>
        </button>

        <button
          className={`btn btn--large btn-primary reader-footer__advance ${
            isCompleted ? 'is-disabled' : ''
          }`}
          onClick={handleAdvanceRow}
          disabled={isCompleted}
        >
          {isCompleted ? '🎉 已完成' : '✓ 完成一行'}
          <span className="reader-footer__hint">空格键</span>
        </button>
      </footer>
    </div>
  );
}

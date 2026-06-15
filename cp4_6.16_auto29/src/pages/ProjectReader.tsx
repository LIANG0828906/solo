import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProgressPanel } from '@/components/ProgressPanel';
import { PatternGrid } from '@/components/PatternGrid';
import { useProjectStore } from '@/store/projectStore';
import './ProjectReader.css';

export function ProjectReader() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProject, loadProjects, advanceRow, undoRow, startReading, updateElapsedTime } =
    useProjectStore();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const project = id ? getProject(id) : undefined;

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!project) return;

    setElapsedSeconds(project.elapsedSeconds);

    if (project.currentRow < project.rowCount) {
      startReading(project.id);
      startTimeRef.current = Date.now() - project.elapsedSeconds * 1000;

      timerRef.current = window.setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setElapsedSeconds(elapsed);
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (project.elapsedSeconds !== elapsedSeconds) {
        updateElapsedTime(project.id, elapsedSeconds);
      }
    };
  }, [project?.id]);

  const handleAdvanceRow = useCallback(() => {
    if (!project || project.currentRow >= project.rowCount) return;
    advanceRow(project.id);
  }, [project, advanceRow]);

  const handleUndoRow = useCallback(() => {
    if (!project || project.undoStack.length === 0) return;
    undoRow(project.id);
  }, [project, undoRow]);

  const handleBack = useCallback(() => {
    if (project && timerRef.current) {
      clearInterval(timerRef.current);
      updateElapsedTime(project.id, elapsedSeconds);
    }
    navigate('/');
  }, [project, elapsedSeconds, navigate, updateElapsedTime]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleAdvanceRow();
      } else if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleUndoRow();
      } else if (e.code === 'Escape') {
        handleBack();
      }
    },
    [handleAdvanceRow, handleUndoRow, handleBack]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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
          elapsedSeconds={elapsedSeconds}
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
          onClick={handleUndoRow}
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

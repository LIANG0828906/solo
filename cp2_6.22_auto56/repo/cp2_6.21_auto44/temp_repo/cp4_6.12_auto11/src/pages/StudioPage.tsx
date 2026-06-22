import React, { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import FabricList from '../fabric/FabricList';
import DesignCanvas from '../design/DesignCanvas';
import Toolbar from '../components/Toolbar';
import NewProjectModal from '../components/NewProjectModal';
import { useProjectStore } from '../store/projectStore';

const StudioPage: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    createNewProject,
    saveCurrentProject,
    clearAllCells,
    isSaving,
    lastSaved,
    currentProject,
  } = useProjectStore();
  const [showNewProject, setShowNewProject] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleNewProject = () => {
    setShowNewProject(true);
  };

  const handleCreateProject = async (data: {
    name: string;
    widthCm: number;
    heightCm: number;
    gridCols: number;
    gridRows: number;
  }) => {
    await createNewProject(data);
    setShowNewProject(false);
  };

  const handleSave = useCallback(async () => {
    try {
      await saveCurrentProject();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('保存失败:', err);
    }
  }, [saveCurrentProject]);

  const handleExport = () => {
    if (!canvasRef.current) return;

    const cells = canvasRef.current.querySelectorAll('[data-cell]');
    if (cells.length === 0) return;

    const gridEl = canvasRef.current.querySelector('[data-grid]') as HTMLElement;
    if (!gridEl) return;

    const rect = gridEl.getBoundingClientRect();
    const scale = 2;

    const canvas = document.createElement('canvas');
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(scale, scale);

    const computedStyle = window.getComputedStyle(gridEl);
    ctx.fillStyle = computedStyle.backgroundColor || '#8D6E63';
    ctx.fillRect(0, 0, rect.width, rect.height);

    const cellEls = Array.from(cells) as HTMLElement[];
    const cellCount = cellEls.length;
    const cols = currentProject?.gridCols || 10;
    const rows = cellCount / cols;
    const cellWidth = rect.width / cols;
    const cellHeight = rect.height / rows;

    cellEls.forEach((cell, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * cellWidth + 1;
      const y = row * cellHeight + 1;
      const w = cellWidth - 1;
      const h = cellHeight - 1;

      const bg = cell.style.background;
      if (bg && !bg.includes('transparent')) {
        if (bg.startsWith('linear-gradient') || bg.startsWith('radial-gradient')) {
          ctx.fillStyle = cell.style.background.split(' ').pop()?.replace(')', '') || '#F5F0E8';
        } else {
          ctx.fillStyle = bg;
        }
        ctx.fillRect(x, y, w, h);
      } else {
        ctx.fillStyle = '#FFFAF4';
        ctx.fillRect(x, y, w, h);
      }
    });

    const link = document.createElement('a');
    link.download = `${currentProject?.name || 'quilt-design'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleClear = () => {
    if (window.confirm('确定要清空画布上的所有色块吗？')) {
      clearAllCells();
    }
  };

  const handleProjects = () => {
    navigate('/projects');
  };

  return (
    <div style={styles.page}>
      <Toolbar
        onNewProject={handleNewProject}
        onSave={handleSave}
        onExport={handleExport}
        onClear={handleClear}
        onProjects={handleProjects}
        isSaving={isSaving}
        lastSaved={lastSaved}
      />

      <div style={styles.main}>
        <FabricList />
        <div ref={canvasRef} style={styles.canvasArea}>
          <DesignCanvas />
        </div>
      </div>

      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onSubmit={handleCreateProject}
        />
      )}

      {saveSuccess && (
        <div style={styles.saveToast}>✓ 保存成功</div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  canvasArea: {
    flex: 1,
    display: 'flex',
    overflow: 'auto',
    background: '#F5F0E8',
  },
  saveToast: {
    position: 'fixed',
    top: 80,
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#6B8E6B',
    color: '#FFF',
    padding: '10px 24px',
    borderRadius: 24,
    fontSize: 14,
    fontWeight: 500,
    zIndex: 500,
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    animation: 'fadeIn 0.3s ease',
  },
};

export default StudioPage;

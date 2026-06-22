import React, { useState, useRef, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Canvas from '@/components/Canvas';
import UIPanel from '@/components/UIPanel';
import {
  Fragment,
  FragmentType,
  HistoryState,
  Particle,
  createFragment,
  createParticles,
  createHistoryState,
  generateThumbnail,
  exportCanvas,
  getNextZIndex,
  moveZIndex,
  groupFragments,
  ungroupFragments,
  alignFragmentsHorizontally,
  alignFragmentsVertically,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BASE_FRAGMENT_SIZE,
  ActionType,
} from '@/utils/collageEngine';
import './App.css';

const App: React.FC = () => {
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingFragmentId, setEditingFragmentId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [animatingFragments, setAnimatingFragments] = useState<
    Map<string, { startTime: number; startScale: number }>
  >(new Map());
  const [transitionState, setTransitionState] = useState<{
    from: Fragment[];
    to: Fragment[];
    progress: number;
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportToast, setShowExportToast] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const pushHistory = useCallback(
    (newFragments: Fragment[], actionType: ActionType) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const thumbnail = generateThumbnail(canvas);
      const newState = createHistoryState(newFragments, thumbnail, actionType);

      setHistory((prev) => {
        const truncated = prev.slice(0, historyIndex + 1);
        return [...truncated, newState];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  const handleFragmentAdd = useCallback(
    (type: FragmentType, color: string, texture: string, x: number, y: number) => {
      const newFragment = createFragment(
        type,
        color,
        texture,
        x,
        y,
        getNextZIndex(fragments)
      );

      const newAnimating = new Map(animatingFragments);
      newAnimating.set(newFragment.id, {
        startTime: Date.now(),
        startScale: 0.8,
      });
      setAnimatingFragments(newAnimating);

      setParticles((prev) => [...prev, ...createParticles(x, y, color, 20)]);

      const newFragments = [...fragments, newFragment];
      setFragments(newFragments);
      setSelectedIds([newFragment.id]);
      pushHistory(newFragments, 'add');
    },
    [fragments, animatingFragments, pushHistory]
  );

  const handleSelect = useCallback((ids: string[], _ctrlKey: boolean) => {
    setSelectedIds(ids);
    if (ids.length !== 1) {
      setEditingFragmentId(null);
    }
  }, []);

  const handleFragmentMove = useCallback((id: string, x: number, y: number) => {
    setFragments((prev) =>
      prev.map((f) => (f.id === id ? { ...f, x, y } : f))
    );
  }, []);

  const handleFragmentsMove = useCallback(
    (ids: string[], dx: number, dy: number) => {
      if (!isDragging) {
        setIsDragging(true);
        dragStartPositionsRef.current = new Map(
          fragments
            .filter((f) => ids.includes(f.id))
            .map((f) => [f.id, { x: f.x, y: f.y }])
        );
      }

      setFragments((prev) =>
        prev.map((f) => {
          const startPos = dragStartPositionsRef.current.get(f.id);
          if (ids.includes(f.id) && startPos) {
            let newX = startPos.x + dx;
            let newY = startPos.y + dy;
            newX = Math.max(
              BASE_FRAGMENT_SIZE,
              Math.min(CANVAS_WIDTH - BASE_FRAGMENT_SIZE, newX)
            );
            newY = Math.max(
              BASE_FRAGMENT_SIZE,
              Math.min(CANVAS_HEIGHT - BASE_FRAGMENT_SIZE, newY)
            );
            return { ...f, x: newX, y: newY };
          }
          return f;
        })
      );
    },
    [isDragging, fragments]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        pushHistory(fragments, 'move');
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging, fragments, pushHistory]);

  const handleFragmentUpdate = useCallback(
    (id: string, changes: Partial<Fragment>) => {
      setFragments((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...changes } : f))
      );
    },
    []
  );

  const handleFragmentUpdateWithHistory = useCallback(
    (id: string, changes: Partial<Fragment>, actionType: ActionType) => {
      const newFragments = fragments.map((f) =>
        f.id === id ? { ...f, ...changes } : f
      );
      setFragments(newFragments);
      pushHistory(newFragments, actionType);
    },
    [fragments, pushHistory]
  );

  const handleDoubleClick = useCallback((id: string) => {
    setEditingFragmentId(id);
    setSelectedIds([id]);
  }, []);

  const handleCloseEditPanel = useCallback(() => {
    if (editingFragmentId) {
      const fragment = fragments.find((f) => f.id === editingFragmentId);
      if (fragment) {
        pushHistory(fragments, 'rotate');
      }
    }
    setEditingFragmentId(null);
  }, [editingFragmentId, fragments, pushHistory]);

  const handleZIndexChange = useCallback(
    (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
      const newFragments = moveZIndex(fragments, id, direction);
      setFragments(newFragments);
      pushHistory(newFragments, 'scale');
    },
    [fragments, pushHistory]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;

    const fromFragments = [...fragments];
    const toState = history[historyIndex - 1];
    const toFragments = toState.fragments;

    setTransitionState({
      from: fromFragments,
      to: toFragments,
      progress: 0,
    });

    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / 500, 1);

      setTransitionState((prev) =>
        prev ? { ...prev, progress } : null
      );

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setFragments(toFragments);
        setHistoryIndex((prev) => prev - 1);
        setTransitionState(null);
      }
    };

    requestAnimationFrame(animate);
  }, [historyIndex, fragments, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;

    const fromFragments = [...fragments];
    const toState = history[historyIndex + 1];
    const toFragments = toState.fragments;

    setTransitionState({
      from: fromFragments,
      to: toFragments,
      progress: 0,
    });

    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / 500, 1);

      setTransitionState((prev) =>
        prev ? { ...prev, progress } : null
      );

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setFragments(toFragments);
        setHistoryIndex((prev) => prev + 1);
        setTransitionState(null);
      }
    };

    requestAnimationFrame(animate);
  }, [historyIndex, fragments, history]);

  const handleClear = useCallback(() => {
    if (fragments.length === 0) return;
    if (!window.confirm('确定要清空画布吗？此操作可以撤销。')) return;

    const newFragments: Fragment[] = [];
    setFragments(newFragments);
    setSelectedIds([]);
    setEditingFragmentId(null);
    pushHistory(newFragments, 'clear');
  }, [fragments, pushHistory]);

  const handleExport = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || fragments.length === 0) return;

    setIsExporting(true);

    setTimeout(() => {
      exportCanvas(canvas);
      setIsExporting(false);
      setShowExportToast(true);

      setTimeout(() => {
        setShowExportToast(false);
      }, 1500);
    }, 300);
  }, [fragments]);

  const handleJumpToHistory = useCallback(
    (index: number) => {
      if (index === historyIndex) return;

      const fromFragments = [...fragments];
      const toState = history[index];
      const toFragments = toState.fragments;

      setTransitionState({
        from: fromFragments,
        to: toFragments,
        progress: 0,
      });

      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / 500, 1);

        setTransitionState((prev) =>
          prev ? { ...prev, progress } : null
        );

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setFragments(toFragments);
          setHistoryIndex(index);
          setSelectedIds([]);
          setEditingFragmentId(null);
          setTransitionState(null);
        }
      };

      requestAnimationFrame(animate);
    },
    [historyIndex, fragments, history]
  );

  const handleGroup = useCallback(() => {
    if (selectedIds.length < 2) return;

    const groupId = uuidv4();
    const newFragments = groupFragments(fragments, selectedIds, groupId);
    setFragments(newFragments);
    pushHistory(newFragments, 'group');
  }, [selectedIds, fragments, pushHistory]);

  const handleUngroup = useCallback(() => {
    const selectedFragments = fragments.filter((f) => selectedIds.includes(f.id));
    const groupIds = new Set(
      selectedFragments.filter((f) => f.groupId).map((f) => f.groupId!)
    );

    if (groupIds.size === 0) return;

    let newFragments = [...fragments];
    groupIds.forEach((gid) => {
      newFragments = ungroupFragments(newFragments, gid);
    });

    setFragments(newFragments);
    pushHistory(newFragments, 'ungroup');
  }, [selectedIds, fragments, pushHistory]);

  const handleAlignHorizontal = useCallback(() => {
    if (selectedIds.length < 2) return;

    const selectedFragments = fragments.filter((f) => selectedIds.includes(f.id));
    const aligned = alignFragmentsHorizontally(selectedFragments);

    const newFragments = fragments.map((f) => {
      const alignedFrag = aligned.find((a) => a.id === f.id);
      return alignedFrag || f;
    });

    setFragments(newFragments);
    pushHistory(newFragments, 'move');
  }, [selectedIds, fragments, pushHistory]);

  const handleAlignVertical = useCallback(() => {
    if (selectedIds.length < 2) return;

    const selectedFragments = fragments.filter((f) => selectedIds.includes(f.id));
    const aligned = alignFragmentsVertically(selectedFragments);

    const newFragments = fragments.map((f) => {
      const alignedFrag = aligned.find((a) => a.id === f.id);
      return alignedFrag || f;
    });

    setFragments(newFragments);
    pushHistory(newFragments, 'move');
  }, [selectedIds, fragments, pushHistory]);

  const handleDelete = useCallback(() => {
    if (selectedIds.length === 0) return;

    const newFragments = fragments.filter((f) => !selectedIds.includes(f.id));
    setFragments(newFragments);
    setSelectedIds([]);
    setEditingFragmentId(null);
    pushHistory(newFragments, 'delete');
  }, [selectedIds, fragments, pushHistory]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z')
      ) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const editingFragment = editingFragmentId
    ? fragments.find((f) => f.id === editingFragmentId)
    : null;

  const handleEditPanelFragmentUpdate = useCallback(
    (id: string, changes: Partial<Fragment>) => {
      handleFragmentUpdate(id, changes);
    },
    [handleFragmentUpdate]
  );

  useEffect(() => {
    if (editingFragment && historyIndex >= 0) {
      const hasRotationChange = editingFragment.rotation !== 0;
      const hasScaleChange = editingFragment.scale !== 1;
      if (hasRotationChange || hasScaleChange) {
        const actionType = hasRotationChange ? 'rotate' : 'scale';
        pushHistory(fragments, actionType);
      }
    }
  }, [editingFragmentId]);

  return (
    <div className="app">
      <UIPanel
        fragments={fragments}
        selectedIds={selectedIds}
        history={history}
        historyIndex={historyIndex}
        editingFragmentId={editingFragmentId}
        onFragmentUpdate={handleEditPanelFragmentUpdate}
        onZIndexChange={handleZIndexChange}
        onCloseEditPanel={handleCloseEditPanel}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onExport={handleExport}
        onJumpToHistory={handleJumpToHistory}
        onGroup={handleGroup}
        onUngroup={handleUngroup}
        onAlignHorizontal={handleAlignHorizontal}
        onAlignVertical={handleAlignVertical}
        onDelete={handleDelete}
        isExporting={isExporting}
        showExportToast={showExportToast}
      />

      <main className="main-content">
        <Canvas
          fragments={fragments}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onFragmentMove={handleFragmentMove}
          onFragmentsMove={handleFragmentsMove}
          onFragmentUpdate={handleFragmentUpdate}
          onFragmentAdd={handleFragmentAdd}
          onDoubleClick={handleDoubleClick}
          onDelete={handleDelete}
          canvasRef={canvasRef}
          particles={particles}
          onParticlesUpdate={setParticles}
          animatingFragments={animatingFragments}
          onAnimatingUpdate={setAnimatingFragments}
          transitionState={transitionState}
        />
      </main>
    </div>
  );
};

export default App;

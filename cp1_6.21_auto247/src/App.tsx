import { useEffect, useCallback } from 'react';
import { useAppStore } from './store/useAppStore';
import SceneCanvas from './scene/SceneCanvas';
import BrickLibrary from './ui/BrickLibrary';
import PropertyPanel from './ui/PropertyPanel';
import Toolbar from './ui/Toolbar';
import TutorialBubble from './ui/TutorialBubble';
import { saveModel, getAllModels, SavedModel } from './utils/indexedDB';
import { v4 as uuidv4 } from 'uuid';

export default function App() {
  const {
    bricks,
    selectedIds,
    past,
    future,
    showTutorial,
    tutorialStep,
    brickTypes,
    isExporting,
    addBrick,
    removeSelected,
    moveSelected,
    selectBrick,
    clearSelection,
    changeColor,
    undo,
    redo,
    nextTutorialStep,
    closeTutorial,
    setBrickTypes,
    setExporting,
  } = useAppStore();

  const selectedBricks = bricks.filter(b => selectedIds.includes(b.id));

  useEffect(() => {
    fetch('/api/bricks/types')
      .then(res => res.json())
      .then(data => setBrickTypes(data))
      .catch(err => {
        const fallbackTypes = [
          { id: '2x2', name: '2x2方块', width: 2, height: 1, depth: 2, shape: 'cube' as const },
          { id: '2x4', name: '2x4长条', width: 2, height: 1, depth: 4, shape: 'cube' as const },
          { id: '1x8', name: '1x8薄板', width: 1, height: 0.5, depth: 8, shape: 'cube' as const },
          { id: 'slope', name: '斜面块', width: 2, height: 1, depth: 2, shape: 'slope' as const },
          { id: 'cylinder', name: '圆柱体', width: 1, height: 1, depth: 1, shape: 'cylinder' as const },
        ];
        setBrickTypes(fallbackTypes);
      });
  }, [setBrickTypes]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        removeSelected();
        return;
      }

      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      if (e.ctrlKey && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        redo();
        return;
      }

      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      if (selectedIds.length > 0) {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            moveSelected({ x: -1, y: 0, z: 0 });
            break;
          case 'ArrowRight':
            e.preventDefault();
            moveSelected({ x: 1, y: 0, z: 0 });
            break;
          case 'ArrowUp':
            e.preventDefault();
            moveSelected({ x: 0, y: 0, z: -1 });
            break;
          case 'ArrowDown':
            e.preventDefault();
            moveSelected({ x: 0, y: 0, z: 1 });
            break;
          case 'PageUp':
            e.preventDefault();
            moveSelected({ x: 0, y: 1, z: 0 });
            break;
          case 'PageDown':
            e.preventDefault();
            moveSelected({ x: 0, y: -1, z: 0 });
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, moveSelected, removeSelected, undo, redo]);

  const handleDropBrick = useCallback((type: string, color: string, position: { x: number; y: number; z: number }) => {
    addBrick(type, color, position);
  }, [addBrick]);

  const handleColorChange = useCallback((color: string) => {
    if (selectedIds.length > 0) {
      selectedIds.forEach(id => changeColor(id, color));
    }
  }, [selectedIds, changeColor]);

  const handleSave = useCallback(async () => {
    const canvas = document.querySelector('.scene-canvas canvas') as HTMLCanvasElement;
    let thumbnail = '';

    if (canvas) {
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = 64;
      thumbCanvas.height = 64;
      const ctx = thumbCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(canvas, 0, 0, 64, 64);
        thumbnail = thumbCanvas.toDataURL('image/png');
      }
    }

    const model: SavedModel = {
      id: uuidv4(),
      name: `模型 ${new Date().toLocaleString()}`,
      thumbnail,
      bricks: [...bricks],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      await saveModel(model);
      alert('保存成功！');
    } catch (e) {
      console.error('保存失败', e);
      alert('保存失败');
    }
  }, [bricks]);

  const handleExport = useCallback(async () => {
    if (bricks.length === 0) {
      alert('场景中没有积木可导出');
      return;
    }

    setExporting(true);

    try {
      const response = await fetch('/api/export/stl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bricks }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'model.stl';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert('导出失败');
      }
    } catch (e) {
      console.error('导出失败', e);
      generateSTLLocal(bricks);
    } finally {
      setExporting(false);
    }
  }, [bricks, setExporting]);

  const generateSTLLocal = (bricksArray: typeof bricks) => {
    const BRICK_UNIT = 16;
    let stl = 'solid model\n';

    bricksArray.forEach(brick => {
      const bt = brickTypes.find(t => t.id === brick.type);
      if (!bt) return;

      const w = bt.width * BRICK_UNIT;
      const h = bt.height * BRICK_UNIT;
      const d = bt.depth * BRICK_UNIT;
      const px = brick.position.x * BRICK_UNIT;
      const py = brick.position.y * BRICK_UNIT;
      const pz = brick.position.z * BRICK_UNIT;

      if (bt.shape === 'cube' || bt.shape === 'slope') {
        const hw = w / 2;
        const hd = d / 2;

        const vertices = [
          [px - hw, py,      pz - hd],
          [px + hw, py,      pz - hd],
          [px + hw, py,      pz + hd],
          [px - hw, py,      pz + hd],
          [px - hw, py + h,  pz - hd],
          [px + hw, py + h,  pz - hd],
          [px + hw, py + h,  pz + hd],
          [px - hw, py + h,  pz + hd],
        ];

        const faces = [
          [0, 2, 1], [0, 3, 2],
          [4, 5, 6], [4, 6, 7],
          [0, 1, 5], [0, 5, 4],
          [2, 3, 7], [2, 7, 6],
          [1, 2, 6], [1, 6, 5],
          [0, 4, 7], [0, 7, 3],
        ];

        faces.forEach(face => {
          const v0 = vertices[face[0]];
          const v1 = vertices[face[1]];
          const v2 = vertices[face[2]];

          const ax = v1[0] - v0[0];
          const ay = v1[1] - v0[1];
          const az = v1[2] - v0[2];
          const bx = v2[0] - v0[0];
          const by = v2[1] - v0[1];
          const bz = v2[2] - v0[2];

          const nx = ay * bz - az * by;
          const ny = az * bx - ax * bz;
          const nz = ax * by - ay * bx;
          const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;

          stl += `facet normal ${(nx / len).toFixed(6)} ${(ny / len).toFixed(6)} ${(nz / len).toFixed(6)}\n`;
          stl += `  outer loop\n`;
          stl += `    vertex ${v0[0].toFixed(6)} ${v0[1].toFixed(6)} ${v0[2].toFixed(6)}\n`;
          stl += `    vertex ${v1[0].toFixed(6)} ${v1[1].toFixed(6)} ${v1[2].toFixed(6)}\n`;
          stl += `    vertex ${v2[0].toFixed(6)} ${v2[1].toFixed(6)} ${v2[2].toFixed(6)}\n`;
          stl += `  endloop\n`;
          stl += `endfacet\n`;
        });
      }
    });

    stl += 'endsolid model\n';

    const blob = new Blob([stl], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'model.stl';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.app}>
      <Toolbar
        onSave={handleSave}
        onExport={handleExport}
        onUndo={undo}
        onRedo={redo}
        canUndo={past.length > 0}
        canRedo={future.length > 0}
        isExporting={isExporting}
      />

      <div style={styles.main}>
        <BrickLibrary brickTypes={brickTypes} />

        <div style={styles.sceneContainer}>
          <SceneCanvas brickTypes={brickTypes} onDropBrick={handleDropBrick} />
        </div>

        <PropertyPanel
          selectedBricks={selectedBricks}
          brickTypes={brickTypes}
          onColorChange={handleColorChange}
          onDelete={removeSelected}
        />
      </div>

      {showTutorial && (
        <TutorialBubble
          step={tutorialStep}
          onNext={nextTutorialStep}
          onClose={closeTutorial}
        />
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#0F172A',
  },
  main: {
    flex: 1,
    display: 'flex',
    gap: 12,
    padding: 12,
    overflow: 'hidden',
  },
  sceneContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
};

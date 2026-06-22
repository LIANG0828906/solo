import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AtomManager } from '@/managers/AtomManager';
import { EventDispatcher } from '@/managers/EventDispatcher';
import { PhysicsEngine } from '@/modules/physics/PhysicsEngine';
import { Renderer2D } from '@/modules/render/Renderer2D';
import { ParticleSystem3D } from '@/modules/render/ParticleSystem3D';
import { AtomType } from '@/types';
import Toolbar from './Toolbar';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const App: React.FC = () => {
  const canvas2DRef = useRef<HTMLCanvasElement>(null);
  const container3DRef = useRef<HTMLDivElement>(null);

  const atomManagerRef = useRef<AtomManager | null>(null);
  const eventDispatcherRef = useRef<EventDispatcher | null>(null);
  const physicsEngineRef = useRef<PhysicsEngine | null>(null);
  const renderer2DRef = useRef<Renderer2D | null>(null);
  const particleSystem3DRef = useRef<ParticleSystem3D | null>(null);

  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const fpsFramesRef = useRef<number>(0);
  const fpsTimeRef = useRef<number>(0);

  const draggingAtomIdRef = useRef<string | null>(null);

  const [selectedAtomType, setSelectedAtomType] = useState<AtomType>('H');
  const [isRunning, setIsRunning] = useState(true);
  const [stats, setStats] = useState({
    atomCount: 0,
    moleculeCount: 0,
    bondCount: 0,
    maxAtoms: 150,
  });
  const [hasSelectedAtom, setHasSelectedAtom] = useState(false);
  const [fps, setFps] = useState(60);
  const [particleCount, setParticleCount] = useState(0);

  const selectedAtomTypeRef = useRef(selectedAtomType);
  const isRunningRef = useRef(isRunning);

  useEffect(() => {
    selectedAtomTypeRef.current = selectedAtomType;
  }, [selectedAtomType]);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  const updateStats = useCallback(() => {
    if (atomManagerRef.current) {
      setStats({
        atomCount: atomManagerRef.current.getAtomCount(),
        moleculeCount: atomManagerRef.current.getMoleculeCount(),
        bondCount: atomManagerRef.current.getBondCount(),
        maxAtoms: atomManagerRef.current.MAX_ATOMS,
      });
      setHasSelectedAtom(atomManagerRef.current.getSelectedAtom() !== undefined);
    }
    if (particleSystem3DRef.current) {
      setParticleCount(particleSystem3DRef.current.getParticleCount());
    }
  }, []);

  useEffect(() => {
    if (!canvas2DRef.current || !container3DRef.current) return;

    const atomManager = new AtomManager(CANVAS_WIDTH, CANVAS_HEIGHT);
    const eventDispatcher = new EventDispatcher();
    const physicsEngine = new PhysicsEngine(atomManager, eventDispatcher);
    const renderer2D = new Renderer2D(canvas2DRef.current, atomManager, eventDispatcher);
    const particleSystem3D = new ParticleSystem3D(
      container3DRef.current,
      eventDispatcher,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
    );
    particleSystem3D.setCanvas2DReference(canvas2DRef.current);

    atomManagerRef.current = atomManager;
    eventDispatcherRef.current = eventDispatcher;
    physicsEngineRef.current = physicsEngine;
    renderer2DRef.current = renderer2D;
    particleSystem3DRef.current = particleSystem3D;

    renderer2D.resize(CANVAS_WIDTH, CANVAS_HEIGHT);
    particleSystem3D.resize(CANVAS_WIDTH, CANVAS_HEIGHT);

    const gameLoop = (currentTime: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = currentTime;
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      fpsFramesRef.current++;
      if (currentTime - fpsTimeRef.current >= 1000) {
        setFps(fpsFramesRef.current);
        fpsFramesRef.current = 0;
        fpsTimeRef.current = currentTime;
      }

      if (isRunningRef.current) {
        const physicsStart = performance.now();
        physicsEngine.update(deltaTime / 16.67);
        const physicsEnd = performance.now();

        if (physicsEnd - physicsStart > 5) {
        }
      }

      renderer2D.render(deltaTime);
      particleSystem3D.render(deltaTime);

      updateStats();

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);
    updateStats();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      particleSystem3D.dispose();
    };
  }, [updateStats]);

  const getCanvasPosition = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvas2DRef.current!.getBoundingClientRect();
    const scaleX = canvas2DRef.current!.width / rect.width;
    const scaleY = canvas2DRef.current!.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPosition(e);
    const atomManager = atomManagerRef.current;
    if (!atomManager) return;

    const hitAtom = atomManager.findAtomAtPosition(pos.x, pos.y);

    if (hitAtom) {
      atomManager.selectAtom(hitAtom.id);
      atomManager.startDrag(hitAtom.id);
      draggingAtomIdRef.current = hitAtom.id;
    } else {
      atomManager.selectAtom(null);
      atomManager.addAtom(selectedAtomTypeRef.current, pos.x, pos.y);
    }
    updateStats();
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingAtomIdRef.current) return;
    const pos = getCanvasPosition(e);
    const atomManager = atomManagerRef.current;
    if (!atomManager) return;

    atomManager.dragAtom(draggingAtomIdRef.current, pos.x, pos.y);
  };

  const handleCanvasMouseUp = () => {
    if (!draggingAtomIdRef.current) return;
    const atomManager = atomManagerRef.current;
    if (!atomManager) return;

    atomManager.endDrag(draggingAtomIdRef.current);
    draggingAtomIdRef.current = null;
  };

  const handleCanvasMouseLeave = () => {
    handleCanvasMouseUp();
  };

  const handleDelete = () => {
    const atomManager = atomManagerRef.current;
    if (!atomManager) return;

    const selected = atomManager.getSelectedAtom();
    if (selected) {
      atomManager.removeAtom(selected.id);
      updateStats();
    }
  };

  const handleReset = () => {
    const atomManager = atomManagerRef.current;
    if (!atomManager) return;

    atomManager.reset();
    updateStats();
  };

  const handleToggleRunning = () => {
    setIsRunning((prev) => !prev);
  };

  return (
    <div style={styles.app}>
      <Toolbar
        selectedAtomType={selectedAtomType}
        onSelectAtomType={setSelectedAtomType}
        onDelete={handleDelete}
        onReset={handleReset}
        isRunning={isRunning}
        onToggleRunning={handleToggleRunning}
        stats={stats}
        hasSelectedAtom={hasSelectedAtom}
        fps={fps}
        particleCount={particleCount}
      />
      <div style={styles.mainContent}>
        <div style={styles.canvasWrapper}>
          <canvas
            ref={canvas2DRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={styles.canvas2D}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseLeave}
          />
          <div
            ref={container3DRef}
            style={{
              ...styles.container3D,
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
            }}
          />
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  app: {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    background: '#1a1a1a',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    overflow: 'auto',
  },
  canvasWrapper: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
  },
  canvas2D: {
    display: 'block',
    cursor: 'crosshair',
    position: 'relative',
    zIndex: 1,
    borderRadius: 12,
  },
  container3D: {
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'none',
    zIndex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
};

export default App;

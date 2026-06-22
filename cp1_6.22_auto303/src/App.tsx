import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CompassCore } from './compass/CompassCore';
import { MazeGenerator } from './maze/MazeGenerator';
import { GameBoard } from './components/GameBoard';
import { CompassUI } from './components/CompassUI';
import { CompassState, Direction, PathMarker } from './types';

export default function App() {
  const generatorRef = useRef<MazeGenerator>(new MazeGenerator(10, 10));
  const compassRef = useRef<CompassCore | null>(null);
  const [compassState, setCompassState] = useState<CompassState | null>(null);
  const [markers, setMarkers] = useState<PathMarker[]>([]);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showBacktrackConfirm, setShowBacktrackConfirm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [maze, setMaze] = useState(() => generatorRef.current.generate());

  useEffect(() => {
    const compass = new CompassCore(maze, generatorRef.current);
    compassRef.current = compass;
    setCompassState(compass.getState());
    setMarkers(compass.getMarkers());

    const unsubscribe = compass.subscribe((state) => {
      setCompassState(state);
      setMarkers(compass.getMarkers());
    });

    return () => unsubscribe();
  }, [maze]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMove = useCallback((direction: Direction) => {
    const compass = compassRef.current;
    if (!compass || !compassState) return;
    if (compass.getState().isBacktracking) return;
    if (compass.move(direction)) {
      if (compass.isAtExit()) {
        setTimeout(() => setShowWinModal(true), 200);
      }
    }
  }, [compassState]);

  const handleAddMarker = useCallback(() => {
    const compass = compassRef.current;
    if (!compass || !compassState) return;
    if (compass.getState().isBacktracking) return;
    compass.addMarker();
    setMarkers(compass.getMarkers());
  }, [compassState]);

  const doBacktrack = useCallback(async () => {
    const compass = compassRef.current;
    if (!compass || !compass.canBacktrack()) return;
    setShowBacktrackConfirm(false);
    await compass.backtrack(200);
  }, []);

  const handleBacktrack = useCallback(() => {
    setShowBacktrackConfirm(true);
  }, []);

  const handleRestart = useCallback(() => {
    const newMaze = generatorRef.current.generate();
    setMaze(newMaze);
    setShowWinModal(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showWinModal || showBacktrackConfirm) {
        if (e.key === 'Escape') {
          setShowBacktrackConfirm(false);
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          e.preventDefault();
          handleMove('up');
          break;
        case 's':
        case 'arrowdown':
          e.preventDefault();
          handleMove('down');
          break;
        case 'a':
        case 'arrowleft':
          e.preventDefault();
          handleMove('left');
          break;
        case 'd':
        case 'arrowright':
          e.preventDefault();
          handleMove('right');
          break;
        case ' ':
          e.preventDefault();
          handleAddMarker();
          break;
        case 'r':
          e.preventDefault();
          handleBacktrack();
          break;
        case 'escape':
          setShowBacktrackConfirm(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove, handleAddMarker, handleBacktrack, showWinModal, showBacktrackConfirm]);

  const canBacktrack = useMemo(() => {
    const compass = compassRef.current;
    return compass ? compass.canBacktrack() : false;
  }, [compassState]);

  const containerStyle: CSSProperties = {
    minHeight: '100vh',
    width: '100%',
    background:
      'radial-gradient(ellipse at center, #1a1a2e 0%, #0d0d18 70%, #05050a 100%)',
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: isMobile ? '16px' : '32px',
    padding: isMobile ? '16px' : '32px',
    fontFamily:
      '"Segoe UI", "PingFang SC", "Microsoft YaHei", -apple-system, sans-serif',
    position: 'relative',
    overflow: 'auto',
  };

  const headerStyle: CSSProperties = {
    position: isMobile ? 'relative' : 'absolute',
    top: isMobile ? undefined : '20px',
    left: isMobile ? undefined : '32px',
    color: '#c9a96e',
    fontSize: isMobile ? '18px' : '22px',
    fontWeight: 'bold',
    letterSpacing: '2px',
    textShadow: '0 0 20px rgba(201, 169, 110, 0.5)',
    zIndex: 10,
  };

  if (!compassState) return null;

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        ⛏ 迷途矿工 · 地下城指南针 🧭
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isMobile ? '16px' : '32px',
          marginTop: isMobile ? 0 : '40px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: isMobile ? 'center' : 'flex-start',
            gap: '16px',
          }}
        >
          {!isMobile && (
            <GameBoard
              maze={maze}
              compassState={compassState}
              markers={markers}
              cellSize={52}
            />
          )}
          {isMobile && (
            <GameBoard
              maze={maze}
              compassState={compassState}
              markers={markers}
              cellSize={32}
            />
          )}
        </div>

        <CompassUI
          maze={maze}
          compassState={compassState}
          markers={markers}
          canBacktrack={canBacktrack}
          isBacktracking={compassState.isBacktracking}
          onBacktrack={handleBacktrack}
          minimapSize={isMobile ? 120 : 200}
        />
      </div>

      {showBacktrackConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowBacktrackConfirm(false)}
        >
          <div
            style={{
              background:
                'linear-gradient(135deg, #2a2a3a 0%, #1e1e2e 100%)',
              borderRadius: '16px',
              padding: '32px',
              border: '1px solid rgba(201, 169, 110, 0.4)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
              textAlign: 'center',
              maxWidth: '360px',
              animation: 'modalIn 0.3s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                fontSize: '48px',
                marginBottom: '16px',
              }}
            >
              ↩️
            </div>
            <h3
              style={{
                margin: 0,
                marginBottom: '12px',
                color: '#c9a96e',
                fontSize: '20px',
              }}
            >
              确认路径回溯
            </h3>
            <p
              style={{
                color: '#a0a0b8',
                fontSize: '14px',
                lineHeight: '1.6',
                margin: 0,
                marginBottom: '24px',
              }}
            >
              将沿已探索路径 {compassState.pathStack.length - 1} 步返回到入口。
              <br />
              是否继续？
            </p>
            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
              }}
            >
              <button
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: '1px solid #555566',
                  background: 'transparent',
                  color: '#a0a0b8',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                }}
                onClick={() => setShowBacktrackConfirm(false)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                取消
              </button>
              <button
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background:
                    'linear-gradient(135deg, #d4b07a 0%, #c9a96e 50%, #a88b4d 100%)',
                  color: '#2a1a0a',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s',
                }}
                onClick={doBacktrack}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    '0 0 20px rgba(201, 169, 110, 0.8)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                确认回溯
              </button>
            </div>
          </div>
        </div>
      )}

      {showWinModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              background:
                'linear-gradient(135deg, #2d5a3d 0%, #1e3a2e 100%)',
              borderRadius: '20px',
              padding: '40px',
              border: '2px solid rgba(76, 175, 80, 0.5)',
              boxShadow:
                '0 20px 60px rgba(0,0,0,0.7), 0 0 80px rgba(76, 175, 80, 0.2)',
              textAlign: 'center',
              maxWidth: '420px',
              animation: 'winModal 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <div
              style={{
                fontSize: '72px',
                marginBottom: '16px',
                animation: 'bounce 1s ease-in-out infinite',
              }}
            >
              🏆
            </div>
            <h2
              style={{
                margin: 0,
                marginBottom: '8px',
                color: '#81c784',
                fontSize: '28px',
                textShadow: '0 0 20px rgba(76, 175, 80, 0.5)',
              }}
            >
              成功抵达出口！
            </h2>
            <p
              style={{
                color: '#b0e0b0',
                fontSize: '14px',
                margin: 0,
                marginBottom: '28px',
              }}
            >
              你在迷宫中找到了出路，勇敢的矿工！
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '28px',
                padding: '20px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '12px',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', color: '#80c080' }}>总步数</div>
                <div
                  style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: '#ffd700',
                  }}
                >
                  {compassState.steps}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#80c080' }}>标记数量</div>
                <div
                  style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: '#ff9800',
                  }}
                >
                  {markers.length}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#80c080' }}>探索率</div>
                <div
                  style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: '#5c9eff',
                  }}
                >
                  {Math.round(
                    (compassState.exploredCells.size / (10 * 10)) * 100
                  )}
                  %
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#80c080' }}>路径深度</div>
                <div
                  style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: '#e91e63',
                  }}
                >
                  {compassState.pathStack.length}
                </div>
              </div>
            </div>

            <button
              style={{
                padding: '14px 40px',
                borderRadius: '12px',
                border: 'none',
                background:
                  'linear-gradient(135deg, #d4b07a 0%, #c9a96e 50%, #a88b4d 100%)',
                color: '#2a1a0a',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.2s',
              }}
              onClick={handleRestart}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  '0 0 30px rgba(201, 169, 110, 0.8)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              🎮 再来一局
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

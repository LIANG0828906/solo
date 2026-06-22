import { useEffect, useRef, useState, useCallback } from 'react';
import { RenderEngine, drawPieceThumbnail } from './engine/renderEngine';
import {
  PuzzlePiece,
  PIECE_WIDTH,
  PIECE_HEIGHT,
  GRID_COLS,
  GRID_ROWS,
  generateAbstractArt,
  checkSnap,
} from './engine/puzzleEngine';
import { usePuzzleStore } from './stores/puzzleStore';

const CANVAS_WIDTH = GRID_COLS * PIECE_WIDTH;
const CANVAS_HEIGHT = GRID_ROWS * PIECE_HEIGHT;
const THUMB_SIZE = 60;
const ART_WIDTH = CANVAS_WIDTH;
const ART_HEIGHT = CANVAS_HEIGHT;

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  const renderEngineRef = useRef<RenderEngine | null>(null);
  const artCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0, pieceX: 0, pieceY: 0 });
  const [showSuccess, setShowSuccess] = useState(false);
  const [trayHoverId, setTrayHoverId] = useState<number | null>(null);
  const [, forceUpdate] = useState(0);

  const {
    pieces,
    selectedPieceId,
    isComplete,
    undoStack,
    init,
    selectPiece,
    setPiecePosition,
    dropAndSnap,
    rotatePiece,
    undoMove,
    checkComplete,
    reset,
    pushUndo,
  } = usePuzzleStore();

  useEffect(() => {
    artCanvasRef.current = generateAbstractArt(ART_WIDTH, ART_HEIGHT);
    init();
  }, [init]);

  useEffect(() => {
    if (!canvasRef.current || !artCanvasRef.current) return;

    const engine = new RenderEngine(canvasRef.current, artCanvasRef.current);
    renderEngineRef.current = engine;
    engine.resize(CANVAS_WIDTH, CANVAS_HEIGHT);
    engine.start(() => {
      forceUpdate((n) => n + 1);
    });

    return () => {
      engine.stop();
    };
  }, []);

  useEffect(() => {
    if (renderEngineRef.current) {
      renderEngineRef.current.setState({ pieces, selectedPieceId });
    }
  }, [pieces, selectedPieceId]);

  useEffect(() => {
    if (isComplete && renderEngineRef.current) {
      renderEngineRef.current.startWaveAnimation(
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2
      );
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isComplete]);

  const getCanvasCoords = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const scaleX = canvasRef.current!.width / rect.width;
      const scaleY = canvasRef.current!.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    const piece = renderEngineRef.current?.getPieceAtPosition(coords.x, coords.y);

    if (piece && piece.isPlaced) {
      pushUndo();
      isDraggingRef.current = true;
      dragStartPosRef.current = {
        x: coords.x,
        y: coords.y,
        pieceX: piece.currentX,
        pieceY: piece.currentY,
      };
      selectPiece(piece.id);

      if (renderEngineRef.current) {
        renderEngineRef.current.setState({
          draggingPieceId: piece.id,
          dragOffsetX: coords.x - piece.currentX,
          dragOffsetY: coords.y - piece.currentY,
          mouseX: coords.x,
          mouseY: coords.y,
        });
      }
    } else {
      selectPiece(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || !renderEngineRef.current) return;

    const coords = getCanvasCoords(e);
    renderEngineRef.current.setState({
      mouseX: coords.x,
      mouseY: coords.y,
    });
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || !renderEngineRef.current) return;

    const coords = getCanvasCoords(e);
    const draggingId = renderEngineRef.current.getState().draggingPieceId;

    if (draggingId !== null) {
      const piece = pieces.find((p) => p.id === draggingId);
      if (piece) {
        const offsetX = renderEngineRef.current.getState().dragOffsetX;
        const offsetY = renderEngineRef.current.getState().dragOffsetY;
        const finalX = coords.x - offsetX;
        const finalY = coords.y - offsetY;

        const snapResult = checkSnap(finalX, finalY);
        if (snapResult.snapped) {
          renderEngineRef.current.startPieceSnapAnimation(
            draggingId,
            finalX,
            finalY,
            snapResult.targetX,
            snapResult.targetY
          );
          dropAndSnap(draggingId, finalX, finalY);
        } else {
          setPiecePosition(draggingId, finalX, finalY, true);
        }
      }
    }

    isDraggingRef.current = false;
    if (renderEngineRef.current) {
      renderEngineRef.current.setState({
        draggingPieceId: null,
      });
    }
    checkComplete();
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    const piece = renderEngineRef.current?.getPieceAtPosition(coords.x, coords.y);
    if (piece && piece.isPlaced) {
      pushUndo();
      if (renderEngineRef.current) {
        renderEngineRef.current.startPieceRotateAnimation(
          piece.id,
          piece.rotation,
          (piece.rotation + 90) % 360
        );
      }
      rotatePiece(piece.id);
    }
  };

  const handleCanvasContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCanvasCoords(e);
    const piece = renderEngineRef.current?.getPieceAtPosition(coords.x, coords.y);
    if (piece && piece.isPlaced) {
      pushUndo();
      if (renderEngineRef.current) {
        renderEngineRef.current.startPieceRotateAnimation(
          piece.id,
          piece.rotation,
          (piece.rotation + 90) % 360
        );
      }
      rotatePiece(piece.id);
    }
  };

  const handleTrayPieceClick = (piece: PuzzlePiece) => {
    if (isComplete) return;
    pushUndo();

    const placedCount = pieces.filter((p) => p.isPlaced).length;
    const col = placedCount % GRID_COLS;
    const row = Math.floor(placedCount / GRID_COLS) % GRID_ROWS;
    const startX = col * PIECE_WIDTH;
    const startY = row * PIECE_HEIGHT;

    setPiecePosition(piece.id, startX, startY, true);
    selectPiece(piece.id);
    checkComplete();
  };

  const handleTrayPieceCanvas = (
    canvas: HTMLCanvasElement,
    piece: PuzzlePiece
  ) => {
    if (!canvas || !artCanvasRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, THUMB_SIZE, THUMB_SIZE);
    drawPieceThumbnail(ctx, artCanvasRef.current, piece, 0, 0, THUMB_SIZE);
  };

  const trayPieces = pieces.filter((p) => !p.isPlaced);
  const canUndo = undoStack.length > 0;

  const styles = {
    app: {
      display: 'flex',
      flexDirection: 'column' as const,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#1E1E2E',
      minWidth: '768px',
    },
    toolbar: {
      height: '48px',
      backgroundColor: '#1E1E2E',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: '12px',
      borderBottom: '1px solid #2A2A3E',
    },
    title: {
      color: '#FFFFFF',
      fontSize: '16px',
      fontWeight: 600,
      marginRight: 'auto',
      letterSpacing: '1px',
    },
    button: {
      backgroundColor: 'transparent',
      color: '#FFFFFF',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'background-color 0.2s',
      fontFamily: 'inherit',
    },
    buttonDisabled: {
      opacity: 0.4,
      cursor: 'not-allowed',
    },
    main: {
      display: 'flex',
      flex: 1,
      overflow: 'hidden',
    },
    workspace: {
      width: '70%',
      minWidth: 0,
      backgroundColor: '#F0F0F0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      overflow: 'auto',
      position: 'relative' as const,
    },
    canvasContainer: {
      position: 'relative' as const,
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      borderRadius: '8px',
      overflow: 'hidden',
    },
    canvas: {
      display: 'block',
      maxWidth: '100%',
      height: 'auto',
      cursor: isDraggingRef.current ? 'grabbing' : 'grab',
    },
    tray: {
      width: '30%',
      minWidth: '240px',
      backgroundColor: '#2C2C3E',
      padding: '16px',
      overflowY: 'auto' as const,
      borderLeft: '1px solid #3A3A4E',
    },
    trayTitle: {
      color: '#FFFFFF',
      fontSize: '14px',
      fontWeight: 500,
      marginBottom: '12px',
      opacity: 0.8,
    },
    trayGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, 60px)',
      gap: '10px',
      justifyContent: 'center',
    },
    trayItem: {
      position: 'relative' as const,
      border: '2px solid #3A3A4E',
      borderRadius: '4px',
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'border-color 0.2s, transform 0.2s',
    },
    successToast: {
      position: 'fixed' as const,
      top: '72px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '220px',
      backgroundColor: '#4A90D9',
      color: '#FFFFFF',
      padding: '12px 16px',
      borderRadius: '8px',
      textAlign: 'center' as const,
      fontSize: '15px',
      fontWeight: 500,
      boxShadow: '0 4px 16px rgba(74, 144, 217, 0.4)',
      animation: 'fadeInOut 2s ease-in-out forwards',
      zIndex: 1000,
    },
  };

  return (
    <div style={styles.app}>
      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          15% { opacity: 1; transform: translateX(-50%) translateY(0); }
          85% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
        }
        button:hover:not(:disabled) {
          background-color: #3A3A4E !important;
        }
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #2C2C3E;
        }
        ::-webkit-scrollbar-thumb {
          background: #4A4A6E;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #6C6C8E;
        }
      `}</style>

      <div style={styles.toolbar}>
        <span style={styles.title}>🎨 像素碎片漂流记</span>
        <button
          style={{
            ...styles.button,
            ...(canUndo ? {} : styles.buttonDisabled),
          }}
          onClick={undoMove}
          disabled={!canUndo}
        >
          ↩ 撤回 ({undoStack.length})
        </button>
        <button style={styles.button} onClick={reset}>
          ↻ 重置
        </button>
      </div>

      <div style={styles.main}>
        <div style={styles.workspace}>
          {showSuccess && <div style={styles.successToast}>拼合成功！</div>}
          <div style={styles.canvasContainer}>
            <canvas
              ref={canvasRef}
              style={styles.canvas}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              onDoubleClick={handleCanvasDoubleClick}
              onContextMenu={handleCanvasContextMenu}
            />
          </div>
        </div>

        <div style={styles.tray} ref={trayRef}>
          <div style={styles.trayTitle}>
            碎片托盘 ({trayPieces.length})
          </div>
          <div style={styles.trayGrid}>
            {trayPieces.map((piece) => {
              const isHover = trayHoverId === piece.id;
              return (
                <div
                  key={piece.id}
                  style={{
                    ...styles.trayItem,
                    borderColor: isHover ? '#6C6C8E' : '#3A3A4E',
                    transform: isHover ? 'scale(1.05)' : 'scale(1)',
                  }}
                  onClick={() => handleTrayPieceClick(piece)}
                  onMouseEnter={() => setTrayHoverId(piece.id)}
                  onMouseLeave={() => setTrayHoverId(null)}
                >
                  <canvas
                    width={THUMB_SIZE}
                    height={THUMB_SIZE}
                    ref={(canvas) => {
                      if (canvas) handleTrayPieceCanvas(canvas, piece);
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

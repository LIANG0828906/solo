import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Timer, { TimerHandle } from './components/Timer';
import { PuzzlePiece, Difficulty, PieceShape, cutPuzzle, getGridSize } from './utils/puzzleCutter';
import {
  checkSnap,
  getEventCoordinates,
  isClick,
  playSnapSound,
  playCompleteSound,
  createInitialDragState,
  DragState,
} from './utils/dragEngine';

const GAP = 20;

function App() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [pieceShape, setPieceShape] = useState<PieceShape>('polygon');
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [steps, setSteps] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [boardSize, setBoardSize] = useState({ width: 480, height: 480 });
  const [traySize, setTraySize] = useState({ width: 400, height: 480 });

  const timerRef = useRef<TimerHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState>(createInitialDragState());
  const piecesRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const piecesStateRef = useRef<PuzzlePiece[]>([]);
  const boardPositionRef = useRef({ x: 0, y: 0 });
  const trayPositionRef = useRef({ x: 0, y: 0 });
  const snapAnimationRef = useRef<Set<number>>(new Set());
  const [, forceUpdate] = useState(0);

  const gridSize = getGridSize(difficulty);

  const updateLayout = useCallback(() => {
    if (!containerRef.current || !image) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const imgRatio = image.naturalWidth / image.naturalHeight;

    let boardHeight = Math.min(containerHeight - 40, 520);
    let boardWidth = boardHeight * imgRatio;

    if (boardWidth > containerWidth * 0.5) {
      boardWidth = containerWidth * 0.5;
      boardHeight = boardWidth / imgRatio;
    }

    const trayWidth = containerWidth - boardWidth - GAP * 2;
    const trayHeight = boardHeight;

    setBoardSize({ width: boardWidth, height: boardHeight });
    setTraySize({ width: trayWidth, height: trayHeight });
  }, [image]);

  useEffect(() => {
    const handleResize = () => {
      updateLayout();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateLayout]);

  useEffect(() => {
    updateLayout();
  }, [image, updateLayout]);

  useEffect(() => {
    if (!image || !containerRef.current) return;

    const generate = () => {
      setIsGenerating(true);
      
      requestAnimationFrame(() => {
        const boardRect = containerRef.current?.querySelector('.puzzle-board')?.getBoundingClientRect();
        const trayRect = containerRef.current?.querySelector('.puzzle-tray')?.getBoundingClientRect();
        const containerRect = containerRef.current?.getBoundingClientRect();

        if (boardRect && trayRect && containerRect) {
          boardPositionRef.current = {
            x: boardRect.left - containerRect.left,
            y: boardRect.top - containerRect.top,
          };
          trayPositionRef.current = {
            x: trayRect.left - containerRect.left,
            y: trayRect.top - containerRect.top,
          };
        }

        const newPieces = cutPuzzle(
          image,
          difficulty,
          pieceShape,
          boardSize.width,
          boardSize.height,
          traySize.width,
          traySize.height
        );

        newPieces.forEach((piece) => {
          piece.currentX += trayPositionRef.current.x;
          piece.currentY += trayPositionRef.current.y;
        });

        setPieces(newPieces);
        piecesStateRef.current = newPieces;
        setSteps(0);
        setIsComplete(false);
        setIsTimerRunning(false);
        timerRef.current?.reset();
        setIsGenerating(false);
      });
    };

    if (boardSize.width > 0 && boardSize.height > 0) {
      generate();
    }
  }, [image, difficulty, pieceShape, boardSize, traySize]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setImageUrl(event.target?.result as string);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    
    e.target.value = '';
  }, []);

  const handleDifficultyChange = useCallback((newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
  }, []);

  const handleShapeChange = useCallback((newShape: PieceShape) => {
    setPieceShape(newShape);
  }, []);

  const bringToFront = useCallback((pieceId: number) => {
    const piece = piecesStateRef.current.find((p) => p.id === pieceId);
    if (!piece) return;

    const index = piecesStateRef.current.indexOf(piece);
    if (index > -1) {
      piecesStateRef.current.splice(index, 1);
      piecesStateRef.current.push(piece);
      forceUpdate((n) => n + 1);
    }
  }, []);

  const handlePieceMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent, piece: PuzzlePiece) => {
      if (piece.isPlaced) return;

      e.preventDefault();
      e.stopPropagation();

      const container = containerRef.current;
      if (!container) return;

      const coords = getEventCoordinates(e as any, container);

      dragStateRef.current = {
        isDragging: true,
        activePieceId: piece.id,
        offsetX: coords.x - piece.currentX,
        offsetY: coords.y - piece.currentY,
        startX: coords.x,
        startY: coords.y,
        hasMoved: false,
      };

      bringToFront(piece.id);

      const el = piecesRef.current.get(piece.id);
      if (el) {
        el.classList.add('dragging');
      }
    },
    [bringToFront]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState.isDragging || dragState.activePieceId === null) return;

      const container = containerRef.current;
      if (!container) return;

      const coords = getEventCoordinates(e as any, container);

      const piece = piecesStateRef.current.find((p) => p.id === dragState.activePieceId);
      if (!piece) return;

      const newX = coords.x - dragState.offsetX;
      const newY = coords.y - dragState.offsetY;

      const moveDist = Math.sqrt(
        Math.pow(coords.x - dragState.startX, 2) + Math.pow(coords.y - dragState.startY, 2)
      );
      if (moveDist > 5) {
        dragState.hasMoved = true;
      }

      piece.currentX = newX;
      piece.currentY = newY;

      const el = piecesRef.current.get(piece.id);
      if (el) {
        el.style.transform = `translate(${newX}px, ${newY}px) rotate(${piece.rotation}deg) scale(1.05)`;
        el.style.transition = 'none';
      }
    };

    const handleMouseUp = (e: MouseEvent | TouchEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState.isDragging || dragState.activePieceId === null) return;

      const piece = piecesStateRef.current.find((p) => p.id === dragState.activePieceId);
      if (!piece) return;

      const el = piecesRef.current.get(piece.id);
      if (el) {
        el.classList.remove('dragging');
        el.style.transition = '';
      }

      if (!dragState.hasMoved) {
        piece.rotation = piece.rotation + 90;
        if (el) {
          el.style.transform = `translate(${piece.currentX}px, ${piece.currentY}px) rotate(${piece.rotation}deg)`;
        }
        dragStateRef.current = createInitialDragState();
        setSteps((s) => s + 1);
        return;
      }

      const snapResult = checkSnap(
        piece,
        piece.currentX - boardPositionRef.current.x,
        piece.currentY - boardPositionRef.current.y,
        piece.width,
        piece.height
      );

      if (snapResult.snapped) {
        const snappedX = snapResult.x + boardPositionRef.current.x;
        const snappedY = snapResult.y + boardPositionRef.current.y;

        const rotationNormalized = ((piece.rotation % 360) + 360) % 360;
        const isRotationCorrect = rotationNormalized < 5 || rotationNormalized > 355;

        if (isRotationCorrect) {
          piece.currentX = snappedX;
          piece.currentY = snappedY;
          piece.isPlaced = true;

          if (el) {
            el.style.transform = `translate(${snappedX}px, ${snappedY}px) rotate(0deg)`;
            el.classList.add('snap-animation');
            setTimeout(() => {
              el?.classList.remove('snap-animation');
            }, 300);
          }

          playSnapSound();
          snapAnimationRef.current.add(piece.id);

          const placedCount = piecesStateRef.current.filter((p) => p.isPlaced).length;
          if (placedCount === piecesStateRef.current.length) {
            setIsComplete(true);
            setIsTimerRunning(false);
            playCompleteSound();
          }
        } else {
          if (el) {
            el.style.transform = `translate(${piece.currentX}px, ${piece.currentY}px) rotate(${piece.rotation}deg)`;
          }
        }
      } else {
        if (el) {
          el.style.transform = `translate(${piece.currentX}px, ${piece.currentY}px) rotate(${piece.rotation}deg)`;
        }
      }

      setSteps((s) => s + 1);
      dragStateRef.current = createInitialDragState();

      if (!isTimerRunning && pieces.some((p) => !p.isPlaced)) {
        setIsTimerRunning(true);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isTimerRunning, pieces]);

  const handleRestart = useCallback(() => {
    if (!image) return;

    setIsGenerating(true);
    setIsComplete(false);

    requestAnimationFrame(() => {
      const newPieces = cutPuzzle(
        image,
        difficulty,
        pieceShape,
        boardSize.width,
        boardSize.height,
        traySize.width,
        traySize.height
      );

      newPieces.forEach((piece) => {
        piece.currentX += trayPositionRef.current.x;
        piece.currentY += trayPositionRef.current.y;
      });

      setPieces(newPieces);
      piecesStateRef.current = newPieces;
      setSteps(0);
      setIsTimerRunning(false);
      timerRef.current?.reset();
      setIsGenerating(false);
    });
  }, [image, difficulty, pieceShape, boardSize, traySize]);

  const renderGrid = useMemo(() => {
    const cells = [];
    const cellWidth = boardSize.width / gridSize;
    const cellHeight = boardSize.height / gridSize;

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        cells.push(
          <div
            key={`${row}-${col}`}
            className="grid-cell"
            style={{
              left: col * cellWidth,
              top: row * cellHeight,
              width: cellWidth,
              height: cellHeight,
            }}
          />
        );
      }
    }
    return cells;
  }, [boardSize, gridSize]);

  const formatTime = (ms: number): string => {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toFixed(1).padStart(4, '0')}`;
  };

  const finalTime = timerRef.current?.getTime() || 0;

  return (
    <div className="app">
      <header className="header">
        <h1 className="header-title">🧩 专属拼图挑战</h1>
        <div className="controls">
          <label className="btn btn-upload">
            📷 上传图片
            <input type="file" accept="image/*" onChange={handleImageUpload} />
          </label>

          <div className="control-group">
            <span className="control-label">难度:</span>
            <button
              className={`btn ${difficulty === 'easy' ? 'active' : ''}`}
              onClick={() => handleDifficultyChange('easy')}
              disabled={!image}
            >
              简单 (4×4)
            </button>
            <button
              className={`btn ${difficulty === 'hard' ? 'active' : ''}`}
              onClick={() => handleDifficultyChange('hard')}
              disabled={!image}
            >
              困难 (6×6)
            </button>
          </div>

          <div className="control-group">
            <span className="control-label">形状:</span>
            <button
              className={`btn ${pieceShape === 'rectangle' ? 'active' : ''}`}
              onClick={() => handleShapeChange('rectangle')}
              disabled={!image}
            >
              矩形
            </button>
            <button
              className={`btn ${pieceShape === 'polygon' ? 'active' : ''}`}
              onClick={() => handleShapeChange('polygon')}
              disabled={!image}
            >
              多边形
            </button>
          </div>

          <button className="btn" onClick={handleRestart} disabled={!image}>
            🔄 重新开始
          </button>
        </div>
      </header>

      <div className="main-content">
        <div className="puzzle-area" ref={containerRef}>
          <div
            className="puzzle-board"
            style={{
              width: boardSize.width,
              height: boardSize.height,
            }}
          >
            <div className="grid-overlay">{renderGrid}</div>
          </div>

          <div
            className="puzzle-tray"
            style={{
              width: traySize.width,
              height: traySize.height,
            }}
          >
            <div className="tray-label">碎片区</div>
          </div>

          {isGenerating && (
            <div className="loading-state" style={{ position: 'absolute', inset: 0, zIndex: 50 }}>
              <div className="spinner" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'var(--color-secondary)' }}></div>
              <span>生成碎片中...</span>
            </div>
          )}

          {piecesStateRef.current.map((piece) => {
            const padding = Math.max(piece.width, piece.height) * 0.2 * 1.2;
            return (
              <div
                key={piece.id}
                className={`piece ${piece.isPlaced ? 'placed' : ''}`}
                ref={(el) => {
                  if (el) piecesRef.current.set(piece.id, el);
                }}
                style={{
                  left: -padding,
                  top: -padding,
                  width: piece.canvas.width,
                  height: piece.canvas.height,
                  transform: `translate(${piece.currentX}px, ${piece.currentY}px) rotate(${piece.rotation}deg)`,
                  transformOrigin: `${padding + piece.width / 2}px ${padding + piece.height / 2}px`,
                }}
                onMouseDown={(e) => handlePieceMouseDown(e, piece)}
                onTouchStart={(e) => handlePieceMouseDown(e, piece)}
              >
                <canvas
                  width={piece.canvas.width}
                  height={piece.canvas.height}
                  ref={(canvas) => {
                    if (canvas) {
                      const ctx = canvas.getContext('2d');
                      if (ctx) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(piece.canvas, 0, 0);
                      }
                    }
                  }}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            );
          })}

          {!image && (
            <div className="empty-state" style={{ position: 'absolute', inset: 0 }}>
              <div className="empty-state-icon">🖼️</div>
              <div className="empty-state-text">上传一张图片开始拼图挑战吧！</div>
            </div>
          )}
        </div>
      </div>

      <div className="info-panel">
        <div className="info-card">
          <Timer ref={timerRef} isRunning={isTimerRunning} />
        </div>
        <div className="info-card steps">
          <span className="steps-icon">👆</span>
          <span className="steps-value">{steps} 步</span>
        </div>
        <button
          className="btn preview-btn"
          onClick={() => setShowPreview(true)}
          disabled={!image}
        >
          👁 预览
        </button>
      </div>

      {showPreview && imageUrl && (
        <div className="preview-overlay" onClick={() => setShowPreview(false)}>
          <img src={imageUrl} alt="预览" className="preview-image" />
        </div>
      )}

      {isComplete && imageUrl && (
        <div className="complete-overlay">
          <h2 className="complete-title">🎉 恭喜完成！</h2>
          <div className="complete-image-container">
            <img src={imageUrl} alt="完成图" />
          </div>
          <div className="complete-stats">
            <div className="complete-stat">
              <div className="complete-stat-label">用时</div>
              <div className="complete-stat-value">{formatTime(finalTime)}</div>
            </div>
            <div className="complete-stat">
              <div className="complete-stat-label">步数</div>
              <div className="complete-stat-value">{steps}</div>
            </div>
          </div>
          <button className="restart-btn" onClick={handleRestart}>
            再来一局
          </button>
        </div>
      )}
    </div>
  );
}

export default App;

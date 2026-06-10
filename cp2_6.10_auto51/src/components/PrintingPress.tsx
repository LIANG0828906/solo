import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { getCurrentLevel } from '../data/levels';
import { TRAY_ROWS, TRAY_COLS, TRAY_SIZE } from '../types';
import { calculateScore } from '../store/gameStore';
import type { TrayCell } from '../types';

interface InkPoint {
  x: number;
  y: number;
}

const PrintingPress: React.FC = () => {
  const {
    currentLevel,
    trayContent,
    errorCount,
    maxErrors,
    inkCoverage,
    isInking,
    isPrinting,
    gamePhase,
    score,
    highlightIndex,
    placeCharacter,
    setInkCoverage,
    setIsInking,
    startPrinting,
    finishPrinting,
    resetGame,
    goToMenu
  } = useGameStore();

  const levelData = getCurrentLevel(currentLevel);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  const [inkPoints, setInkPoints] = useState<InkPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [printProgress, setPrintProgress] = useState(0);
  const [printedChars, setPrintedChars] = useState<boolean[]>([]);
  const inkedCellsRef = useRef<Set<number>>(new Set());

  const placedCount = trayContent.filter(c => c.char !== null).length;
  const totalChars = levelData.targetChars.length;
  const isComplete = placedCount >= totalChars;

  useEffect(() => {
    if (gamePhase === 'printing') {
      setPrintProgress(0);
      setPrintedChars(new Array(TRAY_SIZE).fill(false));
      
      const interval = setInterval(() => {
        setPrintProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            const finalScore = calculateScore(errorCount, inkCoverage, maxErrors);
            setTimeout(() => finishPrinting(finalScore), 800);
            return 100;
          }
          const newProgress = prev + 2;
          const charsToShow = Math.floor((newProgress / 100) * TRAY_SIZE);
          setPrintedChars(prev => {
            const newArr = [...prev];
            for (let i = 0; i < charsToShow && i < TRAY_SIZE; i++) {
              newArr[i] = true;
            }
            return newArr;
          });
          return newProgress;
        });
      }, 20);
      
      return () => clearInterval(interval);
    }
  }, [gamePhase, errorCount, inkCoverage, maxErrors, finishPrinting]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (gamePhase !== 'typesetting') return;
    
    const char = e.dataTransfer.getData('text/plain');
    if (char) {
      placeCharacter(index, char);
    }
  };

  const handleInkMouseDown = (e: React.MouseEvent) => {
    if (!isInking || gamePhase !== 'inking') return;
    setIsDrawing(true);
    addInkPoint(e);
  };

  const handleInkMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !isInking) return;
    addInkPoint(e);
  };

  const handleInkMouseUp = () => {
    setIsDrawing(false);
  };

  const addInkPoint = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current || !trayRef.current) return;
    
    const canvas = canvasRef.current;
    const tray = trayRef.current;
    const rect = tray.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const col = Math.floor(x / (rect.width / TRAY_COLS));
    const row = Math.floor(y / (rect.height / TRAY_ROWS));
    const cellIndex = row * TRAY_COLS + col;
    
    if (cellIndex >= 0 && cellIndex < TRAY_SIZE && trayContent[cellIndex].char !== null) {
      inkedCellsRef.current.add(cellIndex);
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 20);
        gradient.addColorStop(0, 'rgba(26, 26, 26, 0.9)');
        gradient.addColorStop(0.5, 'rgba(26, 26, 26, 0.5)');
        gradient.addColorStop(1, 'rgba(26, 26, 26, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();
      }
      
      const filledCells = trayContent.filter((c, i) => c.char !== null).length;
      const inkedTargetCells = Array.from(inkedCellsRef.current).filter(
        i => i < levelData.targetChars.length
      ).length;
      
      const coverage = filledCells > 0 ? Math.min(100, (inkedTargetCells / filledCells) * 100) : 0;
      setInkCoverage(Math.round(coverage));
    }
    
    setInkPoints(prev => [...prev, { x, y }]);
  }, [isInking, trayContent, levelData.targetChars.length, setInkCoverage]);

  const startInking = () => {
    if (!isComplete) return;
    setIsInking(true);
    inkedCellsRef.current.clear();
    setInkPoints([]);
    setInkCoverage(0);
    
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  const handlePrint = () => {
    if (inkCoverage >= 90) {
      startPrinting();
    }
  };

  const renderTrayCell = (cell: TrayCell, index: number) => {
    const isHighlighted = index === highlightIndex && cell.char === null;
    
    return (
      <motion.div
        key={index}
        className={`tray-cell ${cell.char ? 'filled' : ''} ${cell.isError ? 'error' : ''} ${cell.isCorrect ? 'correct' : ''} ${isHighlighted ? 'highlighted' : ''}`}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, index)}
        initial={{ scale: 1 }}
        animate={{ 
          scale: cell.isCorrect ? [1, 1.05, 1] : 1,
          boxShadow: cell.isCorrect ? ['0 0 0 #ffd700', '0 0 10px #ffd700', '0 0 0 #ffd700'] : 'none'
        }}
        transition={{ 
          duration: 0.5,
          repeat: cell.isCorrect ? Infinity : 0,
          repeatType: 'reverse'
        }}
      >
        {cell.char && (
          <span className="tray-char">{cell.char}</span>
        )}
        <AnimatePresence>
          {cell.showStain && (
            <motion.div
              className="hand-stain"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const renderPrintedResult = () => {
    return (
      <div className="printed-result">
        <div className="paper">
          {Array(TRAY_ROWS).fill(null).map((_, row) => (
            <div key={row} className="printed-row">
              {Array(TRAY_COLS).fill(null).map((_, col) => {
                const index = row * TRAY_COLS + col;
                const cell = trayContent[index];
                const isPrinted = printedChars[index] && cell.char;
                
                return (
                  <motion.span
                    key={index}
                    className="printed-char"
                    initial={{ color: '#ffffff' }}
                    animate={{ 
                      color: isPrinted ? '#1a1a1a' : '#ffffff',
                      opacity: isPrinted ? 1 : 0
                    }}
                    transition={{ duration: 0.8 }}
                  >
                    {cell.char || ''}
                  </motion.span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (gamePhase === 'menu') return null;

  return (
    <div className="printing-press-wrapper">
      <div className="article-display">
        <h3 className="article-title">{levelData.title}</h3>
        <div className="article-content">
          {levelData.content.split('').map((char, idx) => (
            <span key={idx} className={`article-char ${char === '\n' ? 'newline' : ''}`}>
              {char === '\n' ? <br /> : char}
            </span>
          ))}
        </div>
        <div className="progress-info">
          <div className="error-count">
            错误次数: {errorCount} / {maxErrors}
          </div>
          <div className="ink-coverage" style={{ display: gamePhase === 'inking' || gamePhase === 'printing' || gamePhase === 'result' ? 'block' : 'none' }}>
            刷墨覆盖率: {inkCoverage}%
          </div>
        </div>
        <div className="progress-bar-container">
          <div 
            className="progress-bar" 
            style={{ width: `${(placedCount / totalChars) * 100}%` }}
          />
        </div>
        <div className="progress-text">
          进度: {placedCount} / {totalChars}
        </div>
      </div>

      <div 
        className="tray-container"
        ref={trayRef}
        onMouseDown={handleInkMouseDown}
        onMouseMove={handleInkMouseMove}
        onMouseUp={handleInkMouseUp}
        onMouseLeave={handleInkMouseUp}
      >
        <div 
          className="tray-grid"
          style={{ 
            gridTemplateColumns: `repeat(${TRAY_COLS}, 1fr)`,
            gridTemplateRows: `repeat(${TRAY_ROWS}, 1fr)`
          }}
        >
          {trayContent.map((cell, index) => renderTrayCell(cell, index))}
        </div>
        
        {isInking && (
          <canvas 
            ref={canvasRef}
            className="ink-canvas"
            width={trayRef.current?.offsetWidth || 600}
            height={trayRef.current?.offsetHeight || 400}
          />
        )}
        
        {isInking && isDrawing && (
          <div 
            className="ink-roller"
            style={{
              left: inkPoints.length > 0 ? inkPoints[inkPoints.length - 1].x - 40 : 0,
              top: inkPoints.length > 0 ? inkPoints[inkPoints.length - 1].y - 15 : 0
            }}
          />
        )}

        <AnimatePresence>
          {isPrinting && (
            <motion.div
              className="printing-paper"
              initial={{ y: -400, opacity: 0 }}
              animate={{ 
                y: 0, 
                opacity: 1,
                x: [0, 2, -2, 1, -1, 0]
              }}
              transition={{ 
                y: { duration: 2, ease: 'easeOut' },
                opacity: { duration: 0.5 },
                x: { duration: 0.3, repeat: 5, repeatDelay: 0.2 }
              }}
            >
              {printProgress < 100 ? (
                <div className="printing-overlay">
                  <div className="printing-progress-text">印刷中... {printProgress}%</div>
                </div>
              ) : (
                renderPrintedResult()
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="controls">
        {gamePhase === 'typesetting' && (
          <>
            <button 
              className="control-btn reset-btn"
              onClick={resetGame}
            >
              重置排版
            </button>
            <button 
              className={`control-btn ink-btn ${!isComplete ? 'disabled' : ''}`}
              onClick={startInking}
              disabled={!isComplete}
            >
              上墨
            </button>
          </>
        )}
        
        {gamePhase === 'inking' && (
          <>
            <button 
              className="control-btn reset-btn"
              onClick={resetGame}
            >
              重新排版
            </button>
            <button 
              className={`control-btn print-btn ${inkCoverage < 90 ? 'disabled' : ''}`}
              onClick={handlePrint}
              disabled={inkCoverage < 90}
            >
              印刷 {inkCoverage >= 90 ? '' : `(需≥90%)`}
            </button>
          </>
        )}
        
        {gamePhase === 'result' && score && (
          <div className="result-panel">
            <div className="result-title">印刷完成！</div>
            <div className="result-score">
              <div className="score-item">
                <span className="score-label">综合评分</span>
                <span className="score-value">{score.totalScore}分</span>
              </div>
              <div className="score-item">
                <span className="score-label">等级</span>
                <span className={`grade grade-${score.grade}`}>{score.grade}等</span>
              </div>
              <div className="score-item">
                <span className="score-label">错误次数</span>
                <span className="score-value">{score.errors}次</span>
              </div>
              <div className="score-item">
                <span className="score-label">刷墨覆盖率</span>
                <span className="score-value">{score.inkCoverage}%</span>
              </div>
            </div>
            <div className="result-actions">
              <button className="control-btn menu-btn" onClick={goToMenu}>
                返回主菜单
              </button>
              <button className="control-btn retry-btn" onClick={resetGame}>
                再试一次
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .printing-press-wrapper {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
          box-sizing: border-box;
        }
        
        .article-display {
          background: linear-gradient(180deg, #f5e6cc 0%, #ebe0c4 100%);
          border: 3px solid #8b5a2a;
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 2px 8px rgba(139, 90, 42, 0.2);
        }
        
        .article-title {
          margin: 0 0 8px 0;
          color: #8b5a2a;
          font-size: 16px;
          font-weight: bold;
          text-align: center;
          letter-spacing: 2px;
        }
        
        .article-content {
          font-size: 18px;
          line-height: 1.8;
          color: #5a3e1a;
          letter-spacing: 1px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          min-height: 60px;
        }
        
        .article-char {
          display: inline;
        }
        
        .progress-info {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          font-size: 13px;
          color: #8b5a2a;
        }
        
        .error-count {
          color: #b22222;
          font-weight: bold;
        }
        
        .ink-coverage {
          color: #3a5a3a;
          font-weight: bold;
        }
        
        .progress-bar-container {
          height: 8px;
          background: #c8a46e;
          border-radius: 4px;
          margin-top: 8px;
          overflow: hidden;
        }
        
        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #c8a46e 0%, #8b5a2a 100%);
          transition: width 0.3s ease;
        }
        
        .progress-text {
          text-align: center;
          font-size: 12px;
          color: #8b5a2a;
          margin-top: 4px;
        }
        
        .tray-container {
          flex: 1;
          position: relative;
          background: #d2b48c;
          border: 3px solid #8b7355;
          border-radius: 8px;
          padding: 8px;
          overflow: hidden;
          cursor: default;
        }
        
        .tray-grid {
          display: grid;
          gap: 2px;
          width: 100%;
          height: 100%;
        }
        
        .tray-cell {
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px dashed #8b7355;
          border-radius: 2px;
          background: transparent;
          transition: background 0.2s ease, border-color 0.2s ease;
          position: relative;
          min-height: 20px;
        }
        
        .tray-cell:hover:not(.filled) {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .tray-cell.filled {
          background: #a08060;
          border: 1px solid #5a3e1a;
        }
        
        .tray-cell.highlighted {
          background: rgba(255, 215, 0, 0.3);
          border-color: #ffd700;
        }
        
        .tray-cell.error {
          border: 2px solid #ff4444;
          animation: errorFlash 0.5s ease-in-out 3;
        }
        
        @keyframes errorFlash {
          0%, 100% { border-color: #ff4444; }
          50% { border-color: #ffaaaa; }
        }
        
        .tray-cell.correct {
          border: 1px solid #5a3e1a;
        }
        
        .tray-char {
          color: #1a1a1a;
          font-size: 14px;
          font-weight: bold;
          font-family: 'KaiTi', 'STKaiti', serif;
        }
        
        .hand-stain {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle, rgba(204, 51, 51, 0.8) 0%, rgba(204, 51, 51, 0.4) 40%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
          z-index: 10;
        }
        
        .ink-canvas {
          position: absolute;
          top: 8px;
          left: 8px;
          right: 8px;
          bottom: 8px;
          pointer-events: none;
          z-index: 5;
        }
        
        .ink-roller {
          position: absolute;
          width: 80px;
          height: 30px;
          background: linear-gradient(180deg, #4a6a4a 0%, #3a5a3a 50%, #2a4a2a 100%);
          border-radius: 15px;
          pointer-events: none;
          z-index: 6;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
        }
        
        .ink-roller::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 70px;
          height: 20px;
          background: linear-gradient(90deg, transparent 0%, rgba(26, 26, 26, 0.5) 50%, transparent 100%);
          border-radius: 10px;
        }
        
        .printing-paper {
          position: absolute;
          top: 8px;
          left: 8px;
          right: 8px;
          bottom: 8px;
          background: #ffffff;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        
        .printing-overlay {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.9);
        }
        
        .printing-progress-text {
          font-size: 24px;
          color: #8b5a2a;
          font-weight: bold;
        }
        
        .printed-result {
          width: 100%;
          height: 100%;
          padding: 16px;
          box-sizing: border-box;
        }
        
        .paper {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .printed-row {
          display: flex;
          gap: 4px;
          flex: 1;
        }
        
        .printed-char {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-family: 'KaiTi', 'STKaiti', serif;
          font-weight: bold;
        }
        
        .controls {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .control-btn {
          padding: 10px 24px;
          font-size: 15px;
          font-family: 'KaiTi', 'STKaiti', serif;
          font-weight: bold;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: 2px;
        }
        
        .control-btn:hover:not(.disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        
        .control-btn:active:not(.disabled) {
          transform: translateY(0);
        }
        
        .control-btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .ink-btn {
          background: linear-gradient(180deg, #4a6a4a 0%, #3a5a3a 100%);
          color: #f5e6cc;
        }
        
        .print-btn {
          background: linear-gradient(180deg, #c8352d 0%, #a8251d 100%);
          color: #ffffff;
        }
        
        .reset-btn {
          background: linear-gradient(180deg, #8b7355 0%, #6b5335 100%);
          color: #f5e6cc;
        }
        
        .menu-btn {
          background: linear-gradient(180deg, #8b5a2a 0%, #6b3a0a 100%);
          color: #f5e6cc;
        }
        
        .retry-btn {
          background: linear-gradient(180deg, #b22222 0%, #921212 100%);
          color: #ffffff;
        }
        
        .result-panel {
          width: 100%;
          background: linear-gradient(135deg, #f5e6cc 0%, #ebe0c4 100%);
          border: 3px solid #8b5a2a;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
        }
        
        .result-title {
          font-size: 20px;
          font-weight: bold;
          color: #8b5a2a;
          margin-bottom: 12px;
          letter-spacing: 4px;
        }
        
        .result-score {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }
        
        .score-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }
        
        .score-label {
          font-size: 12px;
          color: #8b5a2a;
        }
        
        .score-value {
          font-size: 18px;
          font-weight: bold;
          color: #5a3e1a;
        }
        
        .grade {
          font-size: 24px;
          font-weight: bold;
        }
        
        .grade-甲 { color: #ffd700; }
        .grade-乙 { color: #c0c0c0; }
        .grade-丙 { color: #cd7f32; }
        .grade-丁 { color: #8b4513; }
        
        .result-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }
        
        @media (max-width: 768px) {
          .printing-press-wrapper {
            padding: 8px;
            gap: 8px;
          }
          
          .article-content {
            font-size: 14px;
          }
          
          .tray-char {
            font-size: 10px;
          }
          
          .control-btn {
            padding: 8px 16px;
            font-size: 13px;
          }
          
          .result-score {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default React.memo(PrintingPress);

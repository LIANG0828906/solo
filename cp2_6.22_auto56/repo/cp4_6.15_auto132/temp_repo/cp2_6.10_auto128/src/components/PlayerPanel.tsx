import React, { useState, useEffect, useRef } from 'react';
import { StoneColor, MoveEntry, Position } from '../types';

interface PlayerPanelProps {
  currentTurn: StoneColor;
  gameOver: boolean;
  winner: StoneColor | null;
  isReplaying: boolean;
  moves: MoveEntry[];
  currentMoveIndex: number;
  elapsedTime: number;
  onReset: () => void;
  onJumpToMove: (index: number) => void;
  onResume: () => void;
  onExport: () => void;
  onToggleAnnotation: (index: number, annotation: string) => void;
}

const COORD_LABELS = 'ABCDEFGHIJKLMNO';

export const PlayerPanel: React.FC<PlayerPanelProps> = ({
  currentTurn,
  gameOver,
  winner,
  isReplaying,
  moves,
  currentMoveIndex,
  elapsedTime,
  onReset,
  onJumpToMove,
  onResume,
  onExport,
  onToggleAnnotation
}) => {
  const [displayTime, setDisplayTime] = useState(elapsedTime);
  const listRef = useRef<HTMLDivElement>(null);
  const [annotationInput, setAnnotationInput] = useState('');
  const [annotatingIndex, setAnnotatingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (gameOver) {
      setDisplayTime(elapsedTime);
      return;
    }

    const interval = setInterval(() => {
      setDisplayTime(prev => prev + 1000);
    }, 1000);

    return () => clearInterval(interval);
  }, [gameOver, elapsedTime]);

  useEffect(() => {
    if (listRef.current && currentMoveIndex >= 0) {
      const items = listRef.current.querySelectorAll('.record-item');
      const currentItem = items[currentMoveIndex];
      if (currentItem) {
        currentItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentMoveIndex]);

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const secs = seconds % 60;
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPosition = (pos: Position): string => {
    return `${COORD_LABELS[pos.x]}${15 - pos.y}`;
  };

  const getTurnText = (): string => {
    if (gameOver) {
      return winner === StoneColor.Black ? '黑方胜' : '白方胜';
    }
    return currentTurn === StoneColor.Black ? '黑方走棋' : '白方走棋';
  };

  const handleMoveClick = (index: number) => {
    onJumpToMove(index);
  };

  const handleAnnotationSubmit = (e: React.FormEvent, index: number) => {
    e.preventDefault();
    if (annotationInput.trim()) {
      onToggleAnnotation(index, annotationInput.trim());
    }
    setAnnotationInput('');
    setAnnotatingIndex(null);
  };

  const handleRightClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    setAnnotatingIndex(annotatingIndex === index ? null : index);
    if (moves[index].annotation) {
      onToggleAnnotation(index, '');
      setAnnotatingIndex(null);
    }
  };

  return (
    <div className="player-panel">
      <h2 className="panel-title">◆ 棋 谱 ◆</h2>

      <div className="status-section">
        <div className="status-row">
          <span className="status-label">当前回合</span>
          <span className="status-value current-turn">
            <span
              className={`turn-indicator ${currentTurn === StoneColor.Black ? 'black' : 'white'}`}
            />
            {getTurnText()}
          </span>
        </div>
        <div className="status-row">
          <span className="status-label">对局步数</span>
          <span className="status-value">{moves.length} 手</span>
        </div>
        <div className="status-row">
          <span className="status-label">对局时长</span>
          <span className="status-value time-display">{formatTime(displayTime)}</span>
        </div>
        {isReplaying && (
          <div className="status-row">
            <span className="status-label">当前状态</span>
            <span className="status-value" style={{ color: '#8b0000' }}>复盘模式</span>
          </div>
        )}
      </div>

      <div className="controls-section">
        <div className="control-buttons">
          <button className="btn btn-primary" onClick={onReset}>
            重新开始
          </button>
          {isReplaying && (
            <button className="btn btn-secondary" onClick={onResume}>
              继续对弈
            </button>
          )}
          <button className="btn btn-secondary" onClick={onExport}>
            导出棋谱
          </button>
        </div>
      </div>

      <div className="record-section">
        <div className="panel-title" style={{ fontSize: '16px', marginBottom: '10px', paddingBottom: '5px' }}>
          着 法 记 录
        </div>
        <div className="record-list" ref={listRef}>
          {moves.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#8d6e63' }}>
              暂无棋谱记录
            </div>
          ) : (
            moves.map((move, index) => (
              <React.Fragment key={index}>
                <div
                  className={`record-item ${index === currentMoveIndex ? 'current' : ''}`}
                  onClick={() => handleMoveClick(index)}
                  onContextMenu={(e) => handleRightClick(e, index)}
                  title="右键点击可添加/移除标注"
                >
                  <span className="record-move-num">{move.moveNumber}.</span>
                  <span className="record-position">
                    {formatPosition(move.position)}
                    {move.annotation && (
                      <span style={{ color: '#8b0000', marginLeft: '8px', fontSize: '11px' }}>
                        ★{move.annotation}
                      </span>
                    )}
                  </span>
                  <span className="record-stone">
                    <span className={`stone-dot ${move.color === StoneColor.Black ? 'black' : 'white'}`} />
                  </span>
                </div>
                {annotatingIndex === index && (
                  <form
                    onSubmit={(e) => handleAnnotationSubmit(e, index)}
                    style={{
                      padding: '8px',
                      backgroundColor: 'rgba(139, 0, 0, 0.05)',
                      display: 'flex',
                      gap: '8px'
                    }}
                  >
                    <input
                      type="text"
                      value={annotationInput}
                      onChange={(e) => setAnnotationInput(e.target.value)}
                      placeholder="输入标注内容..."
                      autoFocus
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        border: '1px solid #c8a96e',
                        borderRadius: '4px',
                        fontFamily: 'inherit',
                        fontSize: '12px'
                      }}
                    />
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ minWidth: '60px', padding: '6px 10px', fontSize: '12px' }}
                    >
                      添加
                    </button>
                  </form>
                )}
              </React.Fragment>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

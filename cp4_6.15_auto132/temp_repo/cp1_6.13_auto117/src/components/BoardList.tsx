import { memo } from 'react';
import { Board } from '../types';

interface BoardListProps {
  boards: Board[];
  onEnter: (board: Board) => void;
  onCreate: () => void;
  onEdit: (board: Board) => void;
  onDelete: (board: Board) => void;
}

function BoardList({ boards, onEnter, onCreate, onEdit, onDelete }: BoardListProps) {
  return (
    <div className="board-list-section">
      <div className="section-header">
        <h2 className="section-title">📚 主题板</h2>
        <button className="btn btn-primary create-board-btn" onClick={onCreate}>
          + 新建主题板
        </button>
      </div>
      {boards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📖</div>
          <p className="empty-text">还没有主题板，点击「新建主题板」开始你的书摘之旅吧！</p>
        </div>
      ) : (
        <div className="board-grid">
          {boards.map((board, index) => (
            <div
              key={board.id}
              className="board-card board-card-enter"
              style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
              onClick={() => onEnter(board)}
            >
              <div className="board-card-header">
                <span className="board-card-icon">📒</span>
                <div className="board-card-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="icon-btn"
                    title="编辑"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(board);
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    className="icon-btn"
                    title="删除"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(board);
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className="board-card-body">
                <h3 className="board-card-name" title={board.name}>
                  {board.name}
                </h3>
                <div className="board-card-count">
                  <span className="count-number">{board.cardCount ?? 0}</span>
                  <span className="count-label">张卡片</span>
                </div>
              </div>
              <div className="board-card-footer">
                <span className="enter-hint">点击进入 →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(BoardList);

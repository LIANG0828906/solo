import React from 'react';
import type { DrawRecord } from './App';
import './WinnerList.css';

interface Props {
  history: DrawRecord[];
}

const WinnerList: React.FC<Props> = ({ history }) => {
  return (
    <div className="winner-list-panel">
      <h2 className="panel-title">🏆 中奖记录</h2>
      <div className="winner-count">
        已抽出 <span className="count-num">{history.length}</span> 人
      </div>
      <div className="winner-list">
        {history.length === 0 ? (
          <div className="empty-text">暂无中奖记录</div>
        ) : (
          history.map((record) => (
            <div key={record.id} className="winner-card scale-in">
              <div className="winner-round">第 {record.round} 轮</div>
              <div className="winner-info">
                <span className="winner-card-avatar">👤</span>
                <span className="winner-card-name">{record.name}</span>
              </div>
              <div className="winner-time">{record.time}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WinnerList;

import { useState } from 'react';
import type { Trip } from '../types';
import '../styles/trip-board.css';

interface TripBoardProps {
  trips: Trip[];
  loading: boolean;
  searchQuery: string;
  onSelectTrip: (trip: Trip) => void;
  onCreateTrip: (tripData: Partial<Trip>) => void;
  onDeleteTrip: (tripId: string) => void;
}

function TripBoard({
  trips,
  loading,
  searchQuery,
  onSelectTrip,
  onCreateTrip,
  onDeleteTrip
}: TripBoardProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTrip, setNewTrip] = useState({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    description: '',
    coverImage: ''
  });

  const handleCreateSubmit = () => {
    if (!newTrip.title || !newTrip.destination) return;
    onCreateTrip(newTrip);
    setShowCreateModal(false);
    setNewTrip({
      title: '',
      destination: '',
      startDate: '',
      endDate: '',
      description: '',
      coverImage: ''
    });
  };

  const handleDeleteClick = (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这个旅行计划吗？')) {
      onDeleteTrip(tripId);
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="highlight">{part}</mark>
      ) : (
        part
      )
    );
  };

  if (loading) {
    return (
      <div className="board-loading">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="trip-board">
      <div className="board-header">
        <h2 className="board-title">我的旅行计划</h2>
        <button
          className="create-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <span className="plus-icon">+</span>
          新建旅行
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="empty-state fade-in">
          <div className="empty-state-card">
            <div className="empty-icon-wrap">
              <span className="empty-icon">🧳</span>
            </div>
            <h3>开始你的第一段旅程吧</h3>
            <p>还没有任何旅行计划？点击下方按钮，开启你的旅行规划之旅，记录每一段精彩的冒险。</p>
            <button
              className="empty-create-btn"
              onClick={() => setShowCreateModal(true)}
            >
              <span className="btn-icon">✈️</span>
              创建第一个旅行计划
            </button>
            <div className="empty-tips">
              <span className="tip-item">🗺️ 记录旅行目的地</span>
              <span className="tip-item">📅 规划每日行程</span>
              <span className="tip-item">📍 地图标注地点</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="trip-grid">
          {trips.map((trip, index) => (
            <div
              key={trip.id}
              className="trip-card fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => onSelectTrip(trip)}
            >
              <div className="card-cover">
                {trip.coverImage ? (
                  <img src={trip.coverImage} alt={trip.title} className="cover-img" />
                ) : (
                  <div className="cover-placeholder">
                    <div className="cover-gradient"></div>
                    <span className="cover-icon">🗺️</span>
                  </div>
                )}
                <button
                  className="delete-btn"
                  onClick={(e) => handleDeleteClick(e, trip.id)}
                >
                  🗑️
                </button>
              </div>
              <div className="card-content">
                <h3 className="card-title">
                  {highlightText(trip.title, searchQuery)}
                </h3>
                <p className="card-destination">
                  <span className="dest-icon">📍</span>
                  <span className="dest-text">{highlightText(trip.destination, searchQuery)}</span>
                </p>
                <div className="card-dates">
                  <svg className="cal-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span className="date-range">{trip.startDate}</span>
                  <span className="date-sep">—</span>
                  <span className="date-range">{trip.endDate}</span>
                </div>
                {trip.description && (
                  <p className="card-desc">{trip.description}</p>
                )}
                <div className="card-footer">
                  <span className="activity-count">
                    {trip.days.reduce((sum, day) => sum + day.activities.length, 0)} 个行程
                  </span>
                  <span className="card-arrow">→</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay scale-in" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">创建新旅行</h3>
            <div className="form-group">
              <label>旅行名称 *</label>
              <input
                type="text"
                value={newTrip.title}
                onChange={(e) => setNewTrip(prev => ({ ...prev, title: e.target.value }))}
                placeholder="例如：东京五日游"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>目的地 *</label>
              <input
                type="text"
                value={newTrip.destination}
                onChange={(e) => setNewTrip(prev => ({ ...prev, destination: e.target.value }))}
                placeholder="例如：日本东京"
                className="form-input"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>开始日期</label>
                <input
                  type="date"
                  value={newTrip.startDate}
                  onChange={(e) => setNewTrip(prev => ({ ...prev, startDate: e.target.value }))}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>结束日期</label>
                <input
                  type="date"
                  value={newTrip.endDate}
                  onChange={(e) => setNewTrip(prev => ({ ...prev, endDate: e.target.value }))}
                  className="form-input"
                />
              </div>
            </div>
            <div className="form-group">
              <label>封面图片URL</label>
              <input
                type="text"
                value={newTrip.coverImage}
                onChange={(e) => setNewTrip(prev => ({ ...prev, coverImage: e.target.value }))}
                placeholder="输入图片链接（可选）"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>旅行描述</label>
              <textarea
                value={newTrip.description}
                onChange={(e) => setNewTrip(prev => ({ ...prev, description: e.target.value }))}
                placeholder="简单描述一下这次旅行..."
                className="form-textarea"
                rows={3}
              />
            </div>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowCreateModal(false)}
              >
                取消
              </button>
              <button
                className="submit-btn"
                onClick={handleCreateSubmit}
                disabled={!newTrip.title || !newTrip.destination}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TripBoard;

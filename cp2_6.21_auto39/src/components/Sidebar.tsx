import { useState } from 'react';
import { useStore } from '../store';
import CreateCardDialog from './CreateCardDialog';
import type { CardCreate } from '../types';

const TYPE_FILTERS = [
  { value: 'all', label: '全部' },
  { value: 'text', label: '文本' },
  { value: 'image', label: '图片' },
  { value: 'todo', label: '待办' },
];

const PRESET_COLORS = [
  '#ff6b6b',
  '#4ecdc4',
  '#ffe66d',
  '#95e1d3',
  '#a29bfe',
  '#fd79a8',
];

function Sidebar() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const {
    cards,
    searchKeyword,
    selectedColors,
    setSearchKeyword,
    toggleColorFilter,
    addCard,
  } = useStore();

  const handleCreateCard = (cardData: Omit<CardCreate, 'x' | 'y' | 'z_index'>) => {
    const newCard = {
      ...cardData,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      z_index: cards.length,
    };
    addCard(newCard);
  };

  const textCount = cards.filter((c) => c.type === 'text').length;
  const imageCount = cards.filter((c) => c.type === 'image').length;
  const todoCount = cards.filter((c) => c.type === 'todo').length;

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">✦</div>
          <h1>灵感卡片</h1>
        </div>

        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="搜索卡片..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>

        <div className="filter-section">
          <div className="filter-title">类型筛选</div>
          <div className="filter-buttons">
            {TYPE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                className={`filter-btn ${typeFilter === filter.value ? 'active' : ''}`}
                onClick={() => setTypeFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-title">颜色筛选</div>
          <div className="color-picker">
            {PRESET_COLORS.map((color) => (
              <div
                key={color}
                className={`color-option ${selectedColors.includes(color) ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => toggleColorFilter(color)}
              />
            ))}
          </div>
        </div>

        <div className="stats-section">
          <div className="stat-item">
            <span>全部卡片</span>
            <span className="stat-badge">{cards.length}</span>
          </div>
          <div className="stat-item">
            <span>文本卡片</span>
            <span className="stat-badge">{textCount}</span>
          </div>
          <div className="stat-item">
            <span>图片卡片</span>
            <span className="stat-badge">{imageCount}</span>
          </div>
          <div className="stat-item">
            <span>待办清单</span>
            <span className="stat-badge">{todoCount}</span>
          </div>
        </div>

        <button className="create-btn" onClick={() => setShowCreateDialog(true)}>
          <span>+</span>
          <span>新建卡片</span>
        </button>
      </aside>

      {showCreateDialog && (
        <CreateCardDialog
          onClose={() => setShowCreateDialog(false)}
          onCreate={handleCreateCard}
        />
      )}
    </>
  );
}

export default Sidebar;

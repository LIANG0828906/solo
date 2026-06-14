import React, { useState, useMemo } from 'react';
import { Plus, Filter } from 'lucide-react';
import type { TableRequest, User } from '@/types';
import TableCard from './TableCard';
import CreateTableModal from './CreateTableModal';

interface HallProps {
  tables: TableRequest[];
  currentUser: User;
  onSelectTable: (id: string) => void;
  onCreateTable: (table: TableRequest) => void;
}

type FilterType = 'all' | 'open' | 'today' | 'nearby';

const Hall: React.FC<HallProps> = ({ tables, currentUser, onSelectTable, onCreateTable }) => {
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredTables = useMemo(() => {
    const now = new Date();
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    return tables.filter((t) => {
      if (filter === 'all') return true;
      if (filter === 'open') return t.status === 'open';
      if (filter === 'today') return t.time <= todayEnd;
      if (filter === 'nearby') return t.host.community === currentUser.community;
      return true;
    }).sort((a, b) => a.time.getTime() - b.time.getTime());
  }, [tables, filter, currentUser.community]);

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'open', label: '可加入' },
    { key: 'today', label: '今天' },
    { key: 'nearby', label: '同小区' },
  ];

  const openCount = tables.filter((t) => t.status === 'open').length;
  const totalPeople = tables.reduce((sum, t) => sum + t.participants.length, 0);

  return (
    <div className="view-wrapper">
      <div className="hall-hero">
        <div className="hall-hero-content">
          <h1 className="hall-hero-title">嗨，{currentUser.nickname} {currentUser.avatar}</h1>
          <p className="hall-hero-subtitle">
            和邻居一起吃顿热乎饭，聊聊家常，认识新朋友
          </p>
          <div className="hall-hero-stats">
            <div className="hall-stat">
              <span className="hall-stat-num">{tables.length}</span>
              <span className="hall-stat-label">进行中的拼桌</span>
            </div>
            <div className="hall-stat">
              <span className="hall-stat-num">{openCount}</span>
              <span className="hall-stat-label">可加入</span>
            </div>
            <div className="hall-stat">
              <span className="hall-stat-num">{totalPeople}</span>
              <span className="hall-stat-label">邻居已加入</span>
            </div>
          </div>
        </div>
      </div>

      <div className="hall-body">
        <div className="hall-header">
          <h2 className="hall-title">
            <Filter size={20} style={{ display: 'inline', marginRight: 8, color: 'var(--coral)' }} strokeWidth={2} />
            拼桌大厅
          </h2>
          <div className="hall-filter">
            {filters.map((f) => (
              <button
                key={f.key}
                className={`filter-chip ${filter === f.key ? 'active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredTables.length === 0 ? (
          <div className="empty-state">
            <span className="empty-emoji">🍽️</span>
            <div className="empty-text">
              暂时没有拼桌，点击右下角按钮发起第一桌吧~
            </div>
          </div>
        ) : (
          <div className="tables-grid">
            {filteredTables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                onClick={() => onSelectTable(table.id)}
                onJoin={() => onSelectTable(table.id)}
              />
            ))}
          </div>
        )}
      </div>

      <button className="fab" onClick={() => setShowModal(true)}>
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {showModal && (
        <CreateTableModal
          currentUser={currentUser}
          onClose={() => setShowModal(false)}
          onCreate={(t) => {
            onCreateTable(t);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

export default Hall;

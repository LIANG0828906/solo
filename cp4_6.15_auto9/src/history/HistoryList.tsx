import React, { useState, useMemo, useRef } from 'react';
import { Search, Filter, Trash2, ChevronRight, Leaf } from 'lucide-react';
import { useAppStore } from '@/shared/store';
import { DiagnosisRecord, DiagnosisStatus } from '@/shared/types';

const statusLabels: Record<DiagnosisStatus, string> = {
  healthy: '健康',
  diseased: '病害',
  nutrient_deficiency: '营养不足',
};

const statusColors: Record<DiagnosisStatus, string> = {
  healthy: '#4CAF50',
  diseased: '#E53935',
  nutrient_deficiency: '#FBC02D',
};

interface HistoryItemProps {
  record: DiagnosisRecord;
  onView: (record: DiagnosisRecord) => void;
  onDelete: (id: string) => void;
}

function HistoryItem({ record, onView, onDelete }: HistoryItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [dragX, setDragX] = useState(0);
  const startXRef = useRef(0);
  const itemRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const diff = e.touches[0].clientX - startXRef.current;
    if (diff < 0) {
      setDragX(Math.max(diff, -100));
    }
  };

  const handleTouchEnd = () => {
    if (dragX < -60) {
      setIsDeleting(true);
      setTimeout(() => onDelete(record.id), 300);
    } else {
      setDragX(0);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    setTimeout(() => onDelete(record.id), 300);
  };

  const date = new Date(record.createdAt);
  const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

  return (
    <div
      ref={itemRef}
      className={`history-item ${isDeleting ? 'deleting' : ''}`}
      style={{
        transform: `translateX(${dragX}px)`,
        transition: dragX === 0 ? 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none',
      }}
      onClick={() => onView(record)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="item-delete-bg" onClick={handleDeleteClick}>
        <Trash2 size={20} />
        <span>删除</span>
      </div>
      <div className="item-content">
        <div className="item-thumb">
          <img src={record.imageUrl} alt={record.plantName} />
        </div>
        <div className="item-info">
          <div className="item-header">
            <h4 className="item-plant">{record.plantName}</h4>
            <span
              className="item-status"
              style={{
                backgroundColor: `${statusColors[record.status]}20`,
                color: statusColors[record.status],
              }}
            >
              {statusLabels[record.status]}
            </span>
          </div>
          <p className="item-disease">{record.diseaseName}</p>
          <p className="item-date">{dateStr}</p>
        </div>
        <ChevronRight size={20} className="item-arrow" />
      </div>
    </div>
  );
}

interface HistoryListProps {
  onViewRecord: (record: DiagnosisRecord) => void;
}

export default function HistoryList({ onViewRecord }: HistoryListProps) {
  const { state, dispatch } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<DiagnosisStatus | 'all'>('all');

  const filteredRecords = useMemo(() => {
    let result = [...state.records].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) => r.plantName.toLowerCase().includes(q));
    }
    if (filterStatus !== 'all') {
      result = result.filter((r) => r.status === filterStatus);
    }
    return result;
  }, [state.records, searchQuery, filterStatus]);

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_RECORD', payload: id });
  };

  return (
    <div className="history-wrapper">
      <div className="history-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="搜索植物名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <Filter size={16} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as DiagnosisStatus | 'all')}
          >
            <option value="all">全部类型</option>
            <option value="healthy">健康</option>
            <option value="diseased">病害</option>
            <option value="nutrient_deficiency">营养不足</option>
          </select>
        </div>
      </div>

      <div className="history-stats">
        共 {filteredRecords.length} 条记录
      </div>

      {filteredRecords.length === 0 ? (
        <div className="empty-state">
          <Leaf size={48} className="empty-icon" />
          <p className="empty-title">暂无诊断记录</p>
          <p className="empty-desc">上传植物叶片照片开始诊断</p>
        </div>
      ) : (
        <div className="history-list">
          {filteredRecords.map((record) => (
            <HistoryItem
              key={record.id}
              record={record}
              onView={onViewRecord}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

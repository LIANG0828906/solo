import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
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

const spring = {
  type: 'spring' as const,
  stiffness: 350,
  damping: 30,
};

function useDebounced<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

interface HistoryItemProps {
  record: DiagnosisRecord;
  isDeleting: boolean;
  onView: (record: DiagnosisRecord) => void;
  onDelete: (id: string) => void;
}

function HistoryItem({ record, isDeleting, onView, onDelete }: HistoryItemProps) {
  const [dragX, setDragX] = useState(0);
  const startXRef = useRef(0);
  const draggingRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    draggingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggingRef.current) return;
    const diff = e.touches[0].clientX - startXRef.current;
    if (diff < 0) setDragX(Math.max(diff, -110));
  };

  const handleTouchEnd = () => {
    draggingRef.current = false;
    if (dragX < -60) {
      onDelete(record.id);
    } else {
      setDragX(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startXRef.current = e.clientX;
    draggingRef.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingRef.current) return;
    const diff = e.clientX - startXRef.current;
    if (diff < 0) setDragX(Math.max(diff, -110));
  };

  const handleMouseUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (dragX < -60) {
      onDelete(record.id);
    } else {
      setDragX(0);
    }
  };

  const handleMouseLeave = () => {
    if (draggingRef.current) {
      draggingRef.current = false;
      if (dragX < -60) {
        onDelete(record.id);
      } else {
        setDragX(0);
      }
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(record.id);
  };

  const date = new Date(record.createdAt);
  const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, height: 0 }}
      animate={{
        opacity: isDeleting ? 0 : 1,
        y: 0,
        height: 'auto',
        x: isDeleting ? -400 : dragX,
        transition: isDeleting ? { duration: 0.32 } : spring,
      }}
      exit={{ opacity: 0, x: -400, height: 0, transition: { duration: 0.32 } }}
      className="history-item"
      onClick={() => !isDeleting && onView(record)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: 'pointer' }}
    >
      <div className="item-delete-bg" onClick={handleDeleteClick}>
        <Trash2 size={20} />
        <span>删除</span>
      </div>
      <div className="item-content">
        <div className="item-thumb">
          <img src={record.thumbnailUrl || record.imageUrl} alt={record.plantName} />
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
    </motion.div>
  );
}

interface HistoryListProps {
  onViewRecord: (record: DiagnosisRecord) => void;
}

export default function HistoryList({ onViewRecord }: HistoryListProps) {
  const { state, deleteRecordWithAnimation } = useAppStore();
  const [searchInput, setSearchInput] = useState('');
  const [filterStatus, setFilterStatus] = useState<DiagnosisStatus | 'all'>('all');
  const debouncedSearch = useDebounced(searchInput, 180);

  const filteredRecords = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const result: DiagnosisRecord[] = [];
    for (let i = 0; i < state.records.length; i++) {
      const r = state.records[i];
      if (q && !r.plantName.toLowerCase().includes(q)) continue;
      if (filterStatus !== 'all' && r.status !== filterStatus) continue;
      result.push(r);
    }
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return result;
  }, [state.records, debouncedSearch, filterStatus]);

  const handleDelete = useCallback(
    (id: string) => {
      deleteRecordWithAnimation(id);
    },
    [deleteRecordWithAnimation],
  );

  return (
    <div className="history-wrapper">
      <motion.div
        className="history-toolbar"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
      >
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="搜索植物名称..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
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
      </motion.div>

      <motion.div
        className="history-stats"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...spring, delay: 0.05 }}
      >
        共 {filteredRecords.length} 条记录
      </motion.div>

      {filteredRecords.length === 0 ? (
        <motion.div
          className="empty-state"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={spring}
        >
          <Leaf size={48} className="empty-icon" />
          <p className="empty-title">暂无诊断记录</p>
          <p className="empty-desc">上传植物叶片照片开始诊断</p>
        </motion.div>
      ) : (
        <LayoutGroup>
          <AnimatePresence mode="popLayout">
            <div className="history-list">
              {filteredRecords.map((record, idx) => (
                <HistoryItem
                  key={record.id}
                  record={record}
                  isDeleting={state.deletingIds.has(record.id)}
                  onView={onViewRecord}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </AnimatePresence>
        </LayoutGroup>
      )}
    </div>
  );
}

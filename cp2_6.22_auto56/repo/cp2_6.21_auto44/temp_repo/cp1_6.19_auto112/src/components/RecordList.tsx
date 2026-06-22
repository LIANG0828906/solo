import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiList, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { ReadingRecord, MOOD_CONFIG } from '../types';

interface Props {
  records: ReadingRecord[];
  highlightId: string | null;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string | null) => void;
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min}分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}小时前`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}天前`;
  const d = new Date(ts);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n) + '...';
}

export default function RecordList({
  records,
  highlightId,
  selectedId,
  onHover,
  onSelect,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...records].sort((a, b) => b.timestamp - a.timestamp),
    [records]
  );

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (sorted.length === 0) {
    return (
      <section className="list-section">
        <div className="list-header">
          <FiList />
          <span>阅读动态</span>
          <span className="list-count">0</span>
        </div>
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <div className="empty-title">还没有阅读记录</div>
          <div className="empty-hint">
            在左侧填写你的第一条阅读心情，让它化作知识星河里的一颗星星吧～
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="list-section">
      <div className="list-header">
        <FiList />
        <span>阅读动态</span>
        <span className="list-count">{sorted.length}</span>
      </div>
      <div className="record-list">
        <AnimatePresence initial={false}>
          {sorted.map((r) => {
            const mood = MOOD_CONFIG[r.mood];
            const isExpanded = expandedId === r.id;
            const isSelected = selectedId === r.id;
            const showFull = isExpanded && r.thought.length > 30;
            return (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`record-item ${isSelected ? 'selected' : ''}`}
                onMouseEnter={() => onHover(r.id)}
                onMouseLeave={() =>
                  onHover(highlightId === r.id ? null : highlightId)
                }
                onClick={() => onSelect(r.id)}
              >
                <div
                  className="record-color"
                  style={{ backgroundColor: mood.color }}
                />
                <div className="record-content">
                  <div className="record-meta">
                    <span className="record-book" title={r.bookName}>
                      {r.bookName}
                    </span>
                    <div className="record-info">
                      <span>{mood.emoji}</span>
                      <span className="record-page">p.{r.page}</span>
                      <span>{formatTime(r.timestamp)}</span>
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {!showFull && (
                      <motion.div
                        key="preview"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="record-thought-preview"
                      >
                        {truncate(r.thought, 30)}
                      </motion.div>
                    )}
                    {showFull && (
                      <motion.div
                        key="full"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="record-thought-full">{r.thought}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {r.thought.length > 30 && (
                    <div
                      className="record-expand-hint"
                      onClick={(e) => toggleExpand(r.id, e)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {isExpanded ? (
                        <>
                          收起 <FiChevronUp size={12} />
                        </>
                      ) : (
                        <>
                          展开完整感想 <FiChevronDown size={12} />
                        </>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}

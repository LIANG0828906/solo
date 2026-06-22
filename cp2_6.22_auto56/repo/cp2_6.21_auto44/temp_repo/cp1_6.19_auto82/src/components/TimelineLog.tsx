import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LogEntry, LogActionType } from '@types/index';
import { FiDroplet, FiZap, FiBug, FiScissors, FiEye, FiPlus } from 'react-icons/fi';

interface TimelineLogProps {
  logs: LogEntry[];
  onAddLog: (log: Omit<LogEntry, 'id'>) => void;
}

const ACTION_TYPES: LogActionType[] = ['浇水', '施肥', '除虫', '修剪', '观察'];

const actionConfig: Record<LogActionType, { icon: React.ReactNode; color: string; bg: string }> = {
  浇水: { icon: <FiDroplet size={12} />, color: '#1976D2', bg: 'rgba(25, 118, 210, 0.12)' },
  施肥: { icon: <FiZap size={12} />, color: '#F57C00', bg: 'rgba(245, 124, 0, 0.12)' },
  除虫: { icon: <FiBug size={12} />, color: '#C62828', bg: 'rgba(198, 40, 40, 0.12)' },
  修剪: { icon: <FiScissors size={12} />, color: '#6A1B9A', bg: 'rgba(106, 27, 154, 0.12)' },
  观察: { icon: <FiEye size={12} />, color: '#2E7D32', bg: 'rgba(46, 125, 50, 0.12)' },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

const TimelineLog: React.FC<TimelineLogProps> = ({ logs, onAddLog }) => {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<LogActionType>('浇水');
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onAddLog({
      type,
      content: content.trim(),
      date: new Date().toISOString(),
    });
    setContent('');
    setShowForm(false);
  };

  const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700 }}>养护日志</div>
        <button
          className="btn btn-primary"
          style={{ padding: '6px 12px', fontSize: 13, gap: 4 }}
          onClick={() => setShowForm((v) => !v)}
        >
          <FiPlus size={14} />
          {showForm ? '取消' : '新增'}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit}
            style={{
              backgroundColor: '#FBF8F0',
              borderRadius: 10,
              padding: 14,
              marginBottom: 16,
              border: '1px solid var(--color-card-border)',
              overflow: 'hidden',
            }}
          >
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                操作类型
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {ACTION_TYPES.map((at) => (
                  <button
                    key={at}
                    type="button"
                    onClick={() => setType(at)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 500,
                      transition: 'all 0.2s ease',
                      ...(type === at
                        ? { backgroundColor: actionConfig[at].color, color: 'white' }
                        : { backgroundColor: actionConfig[at].bg, color: actionConfig[at].color }),
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {actionConfig[at].icon}
                      {at}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <textarea
                className="form-input"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="记录养护内容或观察结果..."
                rows={2}
                style={{ resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                取消
              </button>
              <button type="submit" className="btn btn-primary" disabled={!content.trim()}>
                保存
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {sortedLogs.length === 0 ? (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
            fontSize: 13,
            backgroundColor: '#FBF8F0',
            borderRadius: 10,
            border: '1px dashed var(--color-card-border)',
          }}
        >
          暂无日志，点击"新增"记录第一次养护吧 🌱
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: 4, maxHeight: 300, overflowY: 'auto' }}>
          <div
            style={{
              position: 'absolute',
              left: 12,
              top: 6,
              bottom: 6,
              width: 2,
              backgroundColor: '#EADFC9',
              borderRadius: 1,
            }}
          />
          <AnimatePresence initial={false}>
            {sortedLogs.map((log, index) => {
              const cfg = actionConfig[log.type];
              return (
                <motion.div
                  key={log.id}
                  layout
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index === 0 ? 0.05 : 0 }}
                  style={{
                    position: 'relative',
                    marginBottom: 14,
                    paddingLeft: 30,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 2,
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      backgroundColor: cfg.bg,
                      border: `2px solid ${cfg.color}`,
                      color: cfg.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1,
                    }}
                  >
                    {cfg.icon}
                  </div>
                  <div
                    style={{
                      backgroundColor: 'white',
                      borderRadius: 8,
                      padding: '10px 12px',
                      border: '1px solid #F0E8D8',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: cfg.color,
                          backgroundColor: cfg.bg,
                          padding: '2px 8px',
                          borderRadius: 999,
                        }}
                      >
                        {log.type}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                        {formatDate(log.date)}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.5 }}>
                      {log.content}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default TimelineLog;

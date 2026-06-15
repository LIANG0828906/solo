import { useState } from 'react';
import type { GrowthLog } from '../types';

interface PlantLogProps {
  plotId: string;
  logs: GrowthLog[];
  onAdd: (log: Omit<GrowthLog, 'id'>) => Promise<void>;
  onUpdate: (logId: string, log: Partial<GrowthLog>) => Promise<void>;
  onDelete: (logId: string) => Promise<void>;
}

const healthColors: Record<GrowthLog['healthStatus'], string> = {
  good: '#4CAF50',
  pests: '#E53935',
  thirsty: '#2196F3',
};

const healthLabels: Record<GrowthLog['healthStatus'], string> = {
  good: '良好',
  pests: '有虫害',
  thirsty: '缺水',
};

export default function PlantLog({ plotId, logs, onAdd, onUpdate, onDelete }: PlantLogProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    photoUrl: '',
    height: '',
    note: '',
    healthStatus: 'good' as GrowthLog['healthStatus'],
  });

  const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const resetForm = () => {
    setForm({
      date: new Date().toISOString().split('T')[0],
      photoUrl: '',
      height: '',
      note: '',
      healthStatus: 'good',
    });
  };

  const openAddForm = () => {
    resetForm();
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (log: GrowthLog) => {
    setForm({
      date: log.date,
      photoUrl: log.photoUrl,
      height: String(log.height),
      note: log.note,
      healthStatus: log.healthStatus,
    });
    setEditingId(log.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.height) {
      alert('请输入生长高度');
      return;
    }

    const logData = {
      date: form.date,
      photoUrl: form.photoUrl,
      height: Number(form.height),
      note: form.note,
      healthStatus: form.healthStatus,
    };

    if (editingId) {
      await onUpdate(editingId, logData);
    } else {
      await onAdd(logData);
    }
    setShowForm(false);
    resetForm();
  };

  const handleDelete = async (logId: string) => {
    if (!confirm('确定要删除这条记录吗？')) return;
    setDeletingIds((prev) => new Set(prev).add(logId));
    setTimeout(async () => {
      await onDelete(logId);
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(logId);
        return next;
      });
    }, 300);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>🌿 生长日志</h3>
        <button onClick={openAddForm} style={styles.addBtn}>
          + 添加记录
        </button>
      </div>

      {showForm && (
        <div style={styles.formCard}>
          <h4 style={styles.formTitle}>{editingId ? '编辑记录' : '新记录'}</h4>
          <div style={styles.formGrid}>
            <div style={styles.formItem}>
              <label style={styles.label}>日期</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                style={styles.input}
              />
            </div>
            <div style={styles.formItem}>
              <label style={styles.label}>高度(cm)</label>
              <input
                type="number"
                value={form.height}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
                placeholder="请输入高度"
                style={styles.input}
              />
            </div>
            <div style={styles.formItem}>
              <label style={styles.label}>健康状态</label>
              <select
                value={form.healthStatus}
                onChange={(e) =>
                  setForm({ ...form, healthStatus: e.target.value as GrowthLog['healthStatus'] })
                }
                style={styles.input}
              >
                <option value="good">良好</option>
                <option value="pests">有虫害</option>
                <option value="thirsty">缺水</option>
              </select>
            </div>
            <div style={styles.formItem}>
              <label style={styles.label}>照片URL</label>
              <input
                type="text"
                value={form.photoUrl}
                onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                placeholder="可选"
                style={styles.input}
              />
            </div>
          </div>
          <div style={styles.formItem}>
            <label style={styles.label}>备注</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="记录今日观察..."
              rows={3}
              style={{ ...styles.input, resize: 'vertical' }}
            />
          </div>
          <div style={styles.formActions}>
            <button onClick={() => setShowForm(false)} style={styles.cancelBtn}>
              取消
            </button>
            <button onClick={handleSubmit} style={styles.submitBtn}>
              {editingId ? '保存修改' : '添加记录'}
            </button>
          </div>
        </div>
      )}

      {sortedLogs.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📝</div>
          <div style={{ color: '#999' }}>暂无生长记录，点击上方按钮添加第一条</div>
        </div>
      ) : (
        <div style={styles.timeline}>
          {sortedLogs.map((log, index) => (
            <div
              key={log.id}
              style={{
                ...styles.timelineItem,
                animation: deletingIds.has(log.id) ? 'shrinkFade 0.3s ease forwards' : undefined,
                opacity: deletingIds.has(log.id) ? 0 : 1,
              }}
            >
              <div style={styles.timelineLeft}>
                <div style={styles.timelineDot} />
                {index < sortedLogs.length - 1 && <div style={styles.timelineLine} />}
              </div>
              <div style={styles.logCard}>
                <div style={styles.logHeader}>
                  <div style={styles.logDate}>
                    <span style={{ marginRight: '12px', fontWeight: 600 }}>{log.date}</span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                      }}
                    >
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: healthColors[log.healthStatus],
                        }}
                      />
                      <span style={{ color: healthColors[log.healthStatus], fontWeight: 500 }}>
                        {healthLabels[log.healthStatus]}
                      </span>
                    </span>
                  </div>
                  <div style={styles.logActions}>
                    <button onClick={() => openEditForm(log)} style={styles.actionBtn}>
                      ✏️
                    </button>
                    <button onClick={() => handleDelete(log.id)} style={styles.actionBtn}>
                      🗑️
                    </button>
                  </div>
                </div>

                {log.photoUrl && (
                  <div style={styles.logPhotoWrap}>
                    <img src={log.photoUrl} alt="植物照片" style={styles.logPhoto} />
                  </div>
                )}

                <div style={styles.logContent}>
                  <div style={styles.logHeight}>
                    📏 高度: <strong>{log.height} cm</strong>
                  </div>
                  {log.note && <div style={styles.logNote}>💬 {log.note}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: 'var(--border-radius)',
    boxShadow: 'var(--shadow)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '18px',
    margin: 0,
    color: '#333',
  },
  addBtn: {
    backgroundColor: 'var(--primary-green)',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
  },
  formCard: {
    backgroundColor: '#FAF8F3',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px',
    border: '1px solid #E8D4B0',
    animation: 'fadeIn 0.3s ease',
  },
  formTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    color: '#333',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '16px',
  },
  formItem: {
    marginBottom: '12px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    color: '#666',
    marginBottom: '6px',
    fontWeight: 500,
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: '#fff',
    transition: 'border-color 0.2s',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '8px',
  },
  cancelBtn: {
    padding: '8px 20px',
    backgroundColor: '#f0f0f0',
    color: '#666',
    borderRadius: '6px',
    fontSize: '14px',
  },
  submitBtn: {
    padding: '8px 20px',
    backgroundColor: 'var(--primary-green)',
    color: '#fff',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#999',
  },
  timeline: {
    position: 'relative',
  },
  timelineItem: {
    display: 'flex',
    gap: '16px',
    paddingBottom: '20px',
    overflow: 'hidden',
  },
  timelineLeft: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '20px',
    flexShrink: 0,
  },
  timelineDot: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary-green)',
    border: '3px solid #E8F5E9',
    flexShrink: 0,
    marginTop: '6px',
  },
  timelineLine: {
    width: '2px',
    flex: 1,
    backgroundColor: '#E0E0E0',
    marginTop: '8px',
    marginBottom: '-20px',
  },
  logCard: {
    flex: 1,
    backgroundColor: '#fafafa',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #eee',
    transition: 'var(--transition)',
  },
  logHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  logDate: {
    fontSize: '14px',
    color: '#333',
  },
  logActions: {
    display: 'flex',
    gap: '8px',
  },
  actionBtn: {
    padding: '4px 8px',
    backgroundColor: 'transparent',
    borderRadius: '4px',
    fontSize: '14px',
    opacity: 0.7,
  },
  logPhotoWrap: {
    marginBottom: '12px',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  logPhoto: {
    width: '100%',
    maxHeight: '200px',
    objectFit: 'cover',
    borderRadius: '6px',
    display: 'block',
  },
  logContent: {},
  logHeight: {
    fontSize: '14px',
    color: '#555',
    marginBottom: '8px',
  },
  logNote: {
    fontSize: '14px',
    color: '#666',
    lineHeight: 1.6,
    padding: '10px 12px',
    backgroundColor: '#fff',
    borderRadius: '6px',
    borderLeft: '3px solid var(--primary-green)',
  },
};

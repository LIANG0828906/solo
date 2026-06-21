import React, { useState } from 'react';
import axios from 'axios';

interface AdVersion {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  trafficPercentage: number;
  createdAt: number;
  history: VersionHistory[];
}

interface VersionHistory {
  id: string;
  timestamp: number;
  data: Partial<AdVersion>;
  note: string;
}

interface Metrics {
  impressions: number;
  clicks: number;
  conversions: number;
}

interface ExperimentState {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'completed';
  versions: AdVersion[];
  metrics: Record<string, Metrics>;
  historyData: Record<string, { timestamp: number; metrics: Metrics }[]>;
  startTime: number | null;
  durationHours: number;
}

interface VersionPanelProps {
  experiment: ExperimentState;
  onUpdate: () => void;
}

interface FormState {
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
}

const emptyForm: FormState = {
  title: '',
  description: '',
  imageUrl: '',
  ctaText: '',
  ctaLink: ''
};

const VersionPanel: React.FC<VersionPanelProps> = ({ experiment, onUpdate }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showHistoryFor, setShowHistoryFor] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isCreating, setIsCreating] = useState(false);

  const startEdit = (v: AdVersion) => {
    setEditingId(v.id);
    setIsCreating(false);
    setForm({
      title: v.title,
      description: v.description,
      imageUrl: v.imageUrl,
      ctaText: v.ctaText,
      ctaLink: v.ctaLink
    });
    setShowHistoryFor(null);
  };

  const startCreate = () => {
    setEditingId(null);
    setIsCreating(true);
    setForm(emptyForm);
    setShowHistoryFor(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      alert('请输入广告标题');
      return;
    }
    try {
      if (isCreating) {
        await axios.post('/api/versions', form);
      } else if (editingId) {
        await axios.put(`/api/versions/${editingId}`, form);
      }
      cancelEdit();
      onUpdate();
    } catch (err) {
      console.error('保存失败:', err);
    }
  };

  const handleCopy = async (id: string) => {
    try {
      await axios.post(`/api/versions/${id}/copy`);
      onUpdate();
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此广告版本吗？')) return;
    try {
      await axios.delete(`/api/versions/${id}`);
      if (editingId === id) cancelEdit();
      if (showHistoryFor === id) setShowHistoryFor(null);
      onUpdate();
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  const handleRollback = async (versionId: string, historyId: string) => {
    if (!confirm('确定要回滚到此历史版本吗？')) return;
    try {
      await axios.post(`/api/versions/${versionId}/rollback`, { historyId });
      setShowHistoryFor(null);
      onUpdate();
    } catch (err) {
      console.error('回滚失败:', err);
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h2 style={styles.sectionTitle}>广告创意工坊</h2>
        {!isCreating && !editingId && (
          <button style={styles.createBtn} onClick={startCreate}>
            ➕ 新建版本
          </button>
        )}
      </div>

      {(isCreating || editingId) && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>
            {isCreating ? '✨ 创建新广告版本' : '✏️ 编辑广告版本'}
          </h3>

          <div style={styles.formGrid}>
            <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
              <label style={styles.label}>广告标题 *</label>
              <input
                style={styles.input}
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="输入吸引人的广告标题..."
                maxLength={60}
              />
              <span style={styles.charCount}>{form.title.length}/60</span>
            </div>

            <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
              <label style={styles.label}>广告描述</label>
              <textarea
                style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="描述广告的核心卖点..."
                maxLength={160}
              />
              <span style={styles.charCount}>{form.description.length}/160</span>
            </div>

            <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
              <label style={styles.label}>图片 URL</label>
              <input
                style={styles.input}
                value={form.imageUrl}
                onChange={e => setForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {form.imageUrl && (
              <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
                <label style={styles.label}>图片预览</label>
                <img
                  src={form.imageUrl}
                  alt="预览"
                  style={styles.imagePreview}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}

            <div style={styles.formGroup}>
              <label style={styles.label}>CTA 按钮文案</label>
              <input
                style={styles.input}
                value={form.ctaText}
                onChange={e => setForm(prev => ({ ...prev, ctaText: e.target.value }))}
                placeholder="如：立即购买"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>CTA 跳转链接</label>
              <input
                style={styles.input}
                value={form.ctaLink}
                onChange={e => setForm(prev => ({ ...prev, ctaLink: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>

          <div style={styles.formActions}>
            <button style={styles.cancelBtn} onClick={cancelEdit}>取消</button>
            <button style={styles.saveBtn} onClick={handleSave}>💾 保存</button>
          </div>
        </div>
      )}

      <div style={styles.versionsList}>
        {experiment.versions.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={{ color: '#94a3b8' }}>暂无广告版本，点击上方按钮创建第一个版本</p>
          </div>
        ) : (
          experiment.versions.map((v, idx) => (
            <div
              key={v.id}
              style={{
                ...styles.versionCard,
                ...(editingId === v.id ? styles.versionCardActive : {}),
                ...(showHistoryFor === v.id ? styles.versionCardExpanded : {})
              }}
            >
              <div style={styles.versionHeader}>
                <div style={styles.versionBadge}>V{idx + 1}</div>
                <div style={styles.versionMain}>
                  <h4 style={styles.versionTitle}>{v.title}</h4>
                  <p style={styles.versionDesc}>{v.description || '无描述'}</p>
                </div>
                {v.imageUrl && (
                  <img src={v.imageUrl} alt={v.title} style={styles.versionThumb} />
                )}
              </div>

              <div style={styles.versionMeta}>
                <span style={styles.metaItem}>
                  <span style={styles.metaLabel}>CTA:</span> {v.ctaText || '未设置'}
                </span>
                {v.ctaLink && (
                  <span style={styles.metaItem}>
                    <span style={styles.metaLabel}>链接:</span> {v.ctaLink.slice(0, 30)}{v.ctaLink.length > 30 ? '...' : ''}
                  </span>
                )}
                <span style={styles.metaItem}>
                  <span style={styles.metaLabel}>创建:</span> {formatTime(v.createdAt)}
                </span>
              </div>

              <div style={styles.versionActions}>
                <button style={styles.actionBtn} onClick={() => startEdit(v)}>✏️ 编辑</button>
                <button style={styles.actionBtn} onClick={() => handleCopy(v.id)}>📋 复制</button>
                <button
                  style={{ ...styles.actionBtn, ...(v.history.length > 0 ? {} : styles.btnDisabled) }}
                  onClick={() => setShowHistoryFor(showHistoryFor === v.id ? null : v.id)}
                  disabled={v.history.length === 0}
                >
                  🕐 历史 ({v.history.length})
                </button>
                <button
                  style={{ ...styles.actionBtn, ...styles.dangerBtn }}
                  onClick={() => handleDelete(v.id)}
                >
                  🗑️ 删除
                </button>
              </div>

              {showHistoryFor === v.id && v.history.length > 0 && (
                <div style={styles.historyTimeline}>
                  <h5 style={styles.historyTitle}>修改历史（点击可回滚）</h5>
                  <div style={styles.timelineContainer}>
                    {[...v.history].reverse().map((h, hIdx) => (
                      <div key={h.id} style={styles.timelineItem}>
                        <div style={styles.timelineDot} />
                        <div style={styles.timelineLine} />
                        <div style={styles.timelineContent}>
                          <div style={styles.timelineHeader}>
                            <span style={styles.timestamp}>{formatTime(h.timestamp)}</span>
                            <span style={styles.historyNote}>{h.note}</span>
                          </div>
                          <div style={styles.historyDiff}>
                            {h.data.title && <div style={styles.diffItem}><strong>标题:</strong> {h.data.title}</div>}
                            {h.data.description && <div style={styles.diffItem}><strong>描述:</strong> {h.data.description.slice(0, 50)}...</div>}
                            {h.data.imageUrl && <div style={styles.diffItem}><strong>图片:</strong> {h.data.imageUrl.slice(0, 40)}...</div>}
                            {h.data.ctaText && <div style={styles.diffItem}><strong>CTA:</strong> {h.data.ctaText}</div>}
                          </div>
                          <button
                            style={styles.rollbackBtn}
                            onClick={() => handleRollback(v.id, h.id)}
                          >
                            ↩️ 回滚到此版本
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '900px',
    margin: '0 auto'
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem'
  },
  sectionTitle: {
    margin: 0,
    fontSize: '1.25rem',
    color: '#22d3ee'
  },
  createBtn: {
    padding: '0.625rem 1.25rem',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #22d3ee, #34d399)',
    color: '#0a1628',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer'
  },
  formCard: {
    background: 'rgba(15, 40, 71, 0.6)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(34, 211, 238, 0.2)',
    borderRadius: '16px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    animation: 'fadeIn 0.3s ease'
  },
  formTitle: {
    margin: '0 0 1.25rem 0',
    color: '#7dd3fc',
    fontSize: '1.05rem'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem'
  },
  formGroup: {
    position: 'relative'
  },
  label: {
    display: 'block',
    marginBottom: '0.375rem',
    fontSize: '0.8rem',
    color: '#94a3b8',
    fontWeight: 500
  },
  input: {
    width: '100%',
    padding: '0.625rem 0.875rem',
    borderRadius: '8px',
    border: '1px solid rgba(34, 211, 238, 0.2)',
    background: 'rgba(10, 22, 40, 0.6)',
    color: '#e2e8f0',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  },
  charCount: {
    position: 'absolute',
    right: '8px',
    bottom: '-18px',
    fontSize: '0.7rem',
    color: '#64748b'
  },
  imagePreview: {
    width: '100%',
    maxHeight: '180px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '1px solid rgba(34, 211, 238, 0.2)'
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '1.5rem'
  },
  cancelBtn: {
    padding: '0.625rem 1.25rem',
    borderRadius: '8px',
    border: '1px solid rgba(148, 163, 184, 0.3)',
    background: 'transparent',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '0.875rem'
  },
  saveBtn: {
    padding: '0.625rem 1.5rem',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #22d3ee, #34d399)',
    color: '#0a1628',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer'
  },
  versionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  emptyState: {
    padding: '3rem',
    textAlign: 'center',
    background: 'rgba(15, 40, 71, 0.4)',
    borderRadius: '16px',
    border: '1px dashed rgba(34, 211, 238, 0.2)'
  },
  versionCard: {
    background: 'rgba(15, 40, 71, 0.6)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(34, 211, 238, 0.15)',
    borderRadius: '14px',
    padding: '1.25rem',
    animation: 'fadeIn 0.3s ease'
  },
  versionCardActive: {
    borderColor: '#22d3ee',
    boxShadow: '0 0 20px rgba(34, 211, 238, 0.15)'
  },
  versionCardExpanded: {
    borderColor: '#a78bfa'
  },
  versionHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem'
  },
  versionBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #22d3ee, #0ea5e9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#0a1628',
    fontWeight: 700,
    fontSize: '0.9rem',
    flexShrink: 0
  },
  versionMain: {
    flex: 1,
    minWidth: 0
  },
  versionTitle: {
    margin: 0,
    color: '#e2e8f0',
    fontSize: '1rem',
    fontWeight: 600
  },
  versionDesc: {
    margin: '0.375rem 0 0 0',
    color: '#94a3b8',
    fontSize: '0.8rem',
    lineHeight: 1.4
  },
  versionThumb: {
    width: '60px',
    height: '60px',
    borderRadius: '8px',
    objectFit: 'cover',
    flexShrink: 0
  },
  versionMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    marginTop: '0.875rem',
    paddingTop: '0.875rem',
    borderTop: '1px solid rgba(148, 163, 184, 0.1)'
  },
  metaItem: {
    fontSize: '0.75rem',
    color: '#94a3b8'
  },
  metaLabel: {
    color: '#64748b',
    marginRight: '0.25rem'
  },
  versionActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginTop: '0.875rem'
  },
  actionBtn: {
    padding: '0.4rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid rgba(34, 211, 238, 0.2)',
    background: 'rgba(34, 211, 238, 0.08)',
    color: '#7dd3fc',
    fontSize: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  dangerBtn: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    background: 'rgba(239, 68, 68, 0.08)',
    color: '#f87171'
  },
  btnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed'
  },
  historyTimeline: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid rgba(167, 139, 250, 0.3)'
  },
  historyTitle: {
    margin: '0 0 1rem 0',
    color: '#a78bfa',
    fontSize: '0.9rem'
  },
  timelineContainer: {
    position: 'relative',
    paddingLeft: '8px'
  },
  timelineItem: {
    position: 'relative',
    paddingLeft: '24px',
    paddingBottom: '1.25rem'
  },
  timelineDot: {
    position: 'absolute',
    left: 0,
    top: '6px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #a78bfa, #6366f1)',
    boxShadow: '0 0 10px rgba(167, 139, 250, 0.5)',
    zIndex: 1
  },
  timelineLine: {
    position: 'absolute',
    left: '5px',
    top: '18px',
    bottom: 0,
    width: '2px',
    background: 'linear-gradient(to bottom, rgba(167, 139, 250, 0.5), rgba(167, 139, 250, 0.05))'
  },
  timelineContent: {
    background: 'rgba(167, 139, 250, 0.08)',
    border: '1px solid rgba(167, 139, 250, 0.2)',
    borderRadius: '10px',
    padding: '0.875rem'
  },
  timelineHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem'
  },
  timestamp: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    fontFamily: 'ui-monospace, monospace'
  },
  historyNote: {
    fontSize: '0.75rem',
    color: '#a78bfa',
    fontWeight: 500
  },
  historyDiff: {
    marginBottom: '0.75rem'
  },
  diffItem: {
    fontSize: '0.75rem',
    color: '#cbd5e1',
    marginBottom: '0.25rem',
    lineHeight: 1.4
  },
  rollbackBtn: {
    padding: '0.375rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid rgba(167, 139, 250, 0.4)',
    background: 'rgba(167, 139, 250, 0.15)',
    color: '#c4b5fd',
    fontSize: '0.75rem',
    cursor: 'pointer'
  }
};

export default VersionPanel;

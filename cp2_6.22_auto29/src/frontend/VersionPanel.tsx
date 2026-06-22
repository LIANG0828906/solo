import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import type { AdVersion, HistoryEntry } from '../types';

interface Props {
  mode: 'edit' | 'history';
  onVersionsChange: () => void;
}

const emptyForm = {
  title: '',
  description: '',
  imageUrl: '',
  ctaText: '',
  ctaLink: '',
};

export default function VersionPanel({ mode, onVersionsChange }: Props) {
  const [versions, setVersions] = useState<AdVersion[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [rollbackNote, setRollbackNote] = useState('');
  const [rollbackEntryId, setRollbackEntryId] = useState<string | null>(null);
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');

  const fetchVersions = useCallback(async () => {
    try {
      const res = await axios.get('/api/versions');
      setVersions(res.data);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleCreate = async () => {
    if (!form.title || !form.ctaText) return;
    try {
      await axios.post('/api/versions', form);
      setForm(emptyForm);
      setShowForm(false);
      fetchVersions();
      onVersionsChange();
    } catch {
      // silent
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !form.title || !form.ctaText) return;
    try {
      await axios.put(`/api/versions/${editingId}`, form);
      setEditingId(null);
      setForm(emptyForm);
      setShowForm(false);
      fetchVersions();
      onVersionsChange();
    } catch {
      // silent
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/versions/${id}`);
      fetchVersions();
      onVersionsChange();
    } catch {
      // silent
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await axios.post(`/api/versions/${id}/duplicate`);
      fetchVersions();
      onVersionsChange();
    } catch {
      // silent
    }
  };

  const handleRollback = async (versionId: string, historyEntryId: string) => {
    try {
      await axios.post(`/api/versions/${versionId}/rollback`, {
        historyEntryId,
        note: rollbackNote || `回滚到历史版本`,
      });
      setRollbackEntryId(null);
      setRollbackNote('');
      fetchVersions();
      onVersionsChange();
    } catch {
      // silent
    }
  };

  const startEdit = (v: AdVersion) => {
    setEditingId(v.id);
    setForm({
      title: v.title,
      description: v.description,
      imageUrl: v.imageUrl,
      ctaText: v.ctaText,
      ctaLink: v.ctaLink,
    });
    setShowForm(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((f) => ({ ...f, imageUrl: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={styles.container}>
      {mode === 'edit' && (
        <>
          <div style={styles.header}>
            <div>
              <h2 style={styles.title}>广告创意工坊</h2>
              <p style={styles.subtitle}>创建和管理广告版本，每个版本包含标题、描述、图片和CTA按钮。</p>
            </div>
            <button
              onClick={() => {
                setShowForm(!showForm);
                if (showForm) {
                  setEditingId(null);
                  setForm(emptyForm);
                }
              }}
              style={styles.addBtn}
            >
              {showForm ? '取消' : '+ 新建版本'}
            </button>
          </div>

          {showForm && (
            <div style={styles.formCard}>
              <h3 style={styles.formTitle}>
                {editingId ? '编辑版本' : '创建新版本'}
              </h3>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>标题 *</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="广告标题"
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>描述</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="广告描述文案"
                    style={{ ...styles.formInput, minHeight: 60, resize: 'vertical' }}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>图片</label>
                  <div style={styles.imageModeTabs}>
                    <button
                      onClick={() => setImageMode('url')}
                      style={{
                        ...styles.imageModeTab,
                        ...(imageMode === 'url' ? styles.imageModeTabActive : {}),
                      }}
                    >
                      URL引用
                    </button>
                    <button
                      onClick={() => setImageMode('upload')}
                      style={{
                        ...styles.imageModeTab,
                        ...(imageMode === 'upload' ? styles.imageModeTabActive : {}),
                      }}
                    >
                      上传图片
                    </button>
                  </div>
                  {imageMode === 'url' ? (
                    <input
                      value={form.imageUrl}
                      onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                      placeholder="图片URL地址"
                      style={styles.formInput}
                    />
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={styles.fileInput}
                    />
                  )}
                  {form.imageUrl && (
                    <div style={styles.imagePreviewWrap}>
                      <img src={form.imageUrl} alt="预览" style={styles.imagePreview} />
                    </div>
                  )}
                </div>
                <div style={styles.formRow}>
                  <div style={{ ...styles.formGroup, flex: 1 }}>
                    <label style={styles.formLabel}>CTA按钮文案 *</label>
                    <input
                      value={form.ctaText}
                      onChange={(e) => setForm((f) => ({ ...f, ctaText: e.target.value }))}
                      placeholder="如：立即购买"
                      style={styles.formInput}
                    />
                  </div>
                  <div style={{ ...styles.formGroup, flex: 1 }}>
                    <label style={styles.formLabel}>CTA链接</label>
                    <input
                      value={form.ctaLink}
                      onChange={(e) => setForm((f) => ({ ...f, ctaLink: e.target.value }))}
                      placeholder="https://..."
                      style={styles.formInput}
                    />
                  </div>
                </div>
              </div>
              <div style={styles.formActions}>
                <button
                  onClick={editingId ? handleUpdate : handleCreate}
                  disabled={!form.title || !form.ctaText}
                  style={{
                    ...styles.submitBtn,
                    ...((!form.title || !form.ctaText) ? styles.submitBtnDisabled : {}),
                  }}
                >
                  {editingId ? '保存修改' : '创建版本'}
                </button>
              </div>
            </div>
          )}

          <div style={styles.versionList}>
            {versions.map((v) => (
              <div key={v.id} style={styles.versionCard}>
                <div style={styles.versionCardContent}>
                  {v.imageUrl && (
                    <div style={styles.versionCardImage}>
                      <img src={v.imageUrl} alt="" style={styles.versionCardImg} />
                    </div>
                  )}
                  <div style={styles.versionCardInfo}>
                    <div style={styles.versionCardTitle}>{v.title}</div>
                    <div style={styles.versionCardDesc}>{v.description}</div>
                    <div style={styles.versionCardCta}>
                      <span style={styles.ctaBadge}>{v.ctaText}</span>
                      {v.ctaLink && <span style={styles.ctaLink}>{v.ctaLink}</span>}
                    </div>
                  </div>
                </div>
                <div style={styles.versionCardActions}>
                  <button onClick={() => startEdit(v)} style={styles.actionBtn}>编辑</button>
                  <button onClick={() => handleDuplicate(v.id)} style={styles.actionBtn}>复制</button>
                  <button onClick={() => setExpandedHistory(expandedHistory === v.id ? null : v.id)} style={styles.actionBtn}>
                    历史({v.history.length})
                  </button>
                  <button onClick={() => handleDelete(v.id)} style={styles.actionBtnDelete}>删除</button>
                </div>
                {expandedHistory === v.id && (
                  <div style={styles.timeline}>
                    {v.history.slice().reverse().map((entry, idx) => (
                      <div key={entry.id} style={styles.timelineItem}>
                        <div style={styles.timelineDot} />
                        <div style={styles.timelineContent}>
                          <div style={styles.timelineTime}>{formatTime(entry.timestamp)}</div>
                          <div style={styles.timelineNote}>{entry.note || '无备注'}</div>
                          <div style={styles.timelineSnapshot}>
                            <span style={styles.snapshotField}>
                              标题: {entry.snapshot.title}
                            </span>
                            <span style={styles.snapshotField}>
                              CTA: {entry.snapshot.ctaText}
                            </span>
                          </div>
                          {idx > 0 && (
                            <div style={styles.timelineActions}>
                              {rollbackEntryId === entry.id ? (
                                <div style={styles.rollbackInline}>
                                  <input
                                    value={rollbackNote}
                                    onChange={(e) => setRollbackNote(e.target.value)}
                                    placeholder="回滚备注..."
                                    style={styles.rollbackInput}
                                  />
                                  <button
                                    onClick={() => handleRollback(v.id, entry.id)}
                                    style={styles.rollbackConfirmBtn}
                                  >
                                    确认
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRollbackEntryId(null);
                                      setRollbackNote('');
                                    }}
                                    style={styles.rollbackCancelBtn}
                                  >
                                    取消
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setRollbackEntryId(entry.id);
                                    setRollbackNote('');
                                  }}
                                  style={styles.rollbackBtn}
                                >
                                  回滚到此版本
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {mode === 'history' && (
        <>
          <h2 style={styles.title}>版本历史</h2>
          <p style={styles.subtitle}>查看所有广告版本的修改历史，支持回滚到任意历史版本。</p>
          <div style={styles.versionList}>
            {versions.map((v) => (
              <div key={v.id} style={styles.versionCard}>
                <div
                  style={styles.versionCardHeader}
                  onClick={() => setExpandedHistory(expandedHistory === v.id ? null : v.id)}
                >
                  <div style={styles.versionCardTitle}>{v.title}</div>
                  <span style={styles.historyCount}>{v.history.length} 条记录</span>
                </div>
                {expandedHistory === v.id && (
                  <div style={styles.timeline}>
                    {v.history.slice().reverse().map((entry, idx) => (
                      <div key={entry.id} style={styles.timelineItem}>
                        <div style={styles.timelineDot} />
                        <div style={styles.timelineContent}>
                          <div style={styles.timelineTime}>{formatTime(entry.timestamp)}</div>
                          <div style={styles.timelineNote}>{entry.note || '无备注'}</div>
                          <div style={styles.timelineSnapshotGrid}>
                            <div style={styles.snapshotCard}>
                              <div style={styles.snapshotLabel}>标题</div>
                              <div style={styles.snapshotValue}>{entry.snapshot.title}</div>
                            </div>
                            <div style={styles.snapshotCard}>
                              <div style={styles.snapshotLabel}>描述</div>
                              <div style={styles.snapshotValue}>{entry.snapshot.description || '-'}</div>
                            </div>
                            <div style={styles.snapshotCard}>
                              <div style={styles.snapshotLabel}>CTA文案</div>
                              <div style={styles.snapshotValue}>{entry.snapshot.ctaText}</div>
                            </div>
                            <div style={styles.snapshotCard}>
                              <div style={styles.snapshotLabel}>CTA链接</div>
                              <div style={styles.snapshotValue}>{entry.snapshot.ctaLink || '-'}</div>
                            </div>
                          </div>
                          {idx > 0 && (
                            <div style={styles.timelineActions}>
                              {rollbackEntryId === entry.id ? (
                                <div style={styles.rollbackInline}>
                                  <input
                                    value={rollbackNote}
                                    onChange={(e) => setRollbackNote(e.target.value)}
                                    placeholder="回滚备注（如：回滚到版本3的图片）"
                                    style={styles.rollbackInput}
                                  />
                                  <button
                                    onClick={() => handleRollback(v.id, entry.id)}
                                    style={styles.rollbackConfirmBtn}
                                  >
                                    确认回滚
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRollbackEntryId(null);
                                      setRollbackNote('');
                                    }}
                                    style={styles.rollbackCancelBtn}
                                  >
                                    取消
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setRollbackEntryId(entry.id);
                                    setRollbackNote('');
                                  }}
                                  style={styles.rollbackBtn}
                                >
                                  ↩ 回滚到此版本
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    animation: 'fadeIn 0.3s ease',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    marginBottom: 20,
  },
  addBtn: {
    padding: '8px 18px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'var(--accent-gradient)',
    color: '#070d1a',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  formCard: {
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 24,
    marginBottom: 20,
    backdropFilter: 'blur(12px)',
    animation: 'fadeIn 0.3s ease',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 16,
  },
  formGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  formInput: {
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)',
    background: 'rgba(7, 13, 26, 0.6)',
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
  },
  fileInput: {
    padding: '8px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)',
    background: 'rgba(7, 13, 26, 0.6)',
    color: 'var(--text-secondary)',
    fontSize: 12,
  },
  imageModeTabs: {
    display: 'flex',
    gap: 4,
    marginBottom: 4,
  },
  imageModeTab: {
    padding: '4px 12px',
    borderRadius: 4,
    border: '1px solid var(--border-color)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: 11,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  imageModeTabActive: {
    border: '1px solid var(--accent-cyan)',
    background: 'rgba(0, 229, 255, 0.08)',
    color: 'var(--accent-cyan)',
  },
  imagePreviewWrap: {
    width: '100%',
    maxHeight: 140,
    borderRadius: 'var(--radius-sm)',
    overflow: 'hidden',
    border: '1px solid var(--border-color)',
  },
  imagePreview: {
    width: '100%',
    maxHeight: 140,
    objectFit: 'cover' as const,
  },
  formRow: {
    display: 'flex',
    gap: 12,
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  submitBtn: {
    padding: '10px 28px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'var(--accent-gradient)',
    color: '#070d1a',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  submitBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  versionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  versionCard: {
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 16,
    backdropFilter: 'blur(12px)',
    transition: 'all 0.2s',
  },
  versionCardContent: {
    display: 'flex',
    gap: 16,
    marginBottom: 12,
  },
  versionCardImage: {
    width: 120,
    height: 68,
    borderRadius: 'var(--radius-sm)',
    overflow: 'hidden',
    flexShrink: 0,
  },
  versionCardImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  versionCardInfo: {
    flex: 1,
    minWidth: 0,
  },
  versionCardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  versionCardDesc: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginBottom: 8,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  versionCardCta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  ctaBadge: {
    padding: '2px 8px',
    borderRadius: 4,
    background: 'var(--accent-gradient)',
    color: '#070d1a',
    fontSize: 11,
    fontWeight: 600,
  },
  ctaLink: {
    fontSize: 11,
    color: 'var(--text-muted)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  versionCardActions: {
    display: 'flex',
    gap: 8,
    paddingTop: 12,
    borderTop: '1px solid var(--border-color)',
  },
  actionBtn: {
    padding: '4px 12px',
    borderRadius: 4,
    border: '1px solid var(--border-color)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  actionBtnDelete: {
    padding: '4px 12px',
    borderRadius: 4,
    border: '1px solid rgba(255, 82, 82, 0.3)',
    background: 'transparent',
    color: '#ff5252',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  versionCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    padding: '4px 0',
  },
  historyCount: {
    fontSize: 12,
    color: 'var(--text-muted)',
  },
  timeline: {
    marginTop: 12,
    paddingLeft: 16,
    borderLeft: '2px solid rgba(0, 229, 255, 0.15)',
  },
  timelineItem: {
    position: 'relative' as const,
    paddingLeft: 20,
    paddingBottom: 16,
    animation: 'slideIn 0.3s ease',
  },
  timelineDot: {
    position: 'absolute' as const,
    left: -23,
    top: 4,
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: 'var(--accent-cyan)',
    border: '2px solid var(--bg-primary)',
  },
  timelineContent: {},
  timelineTime: {
    fontSize: 11,
    color: 'var(--text-muted)',
    marginBottom: 2,
  },
  timelineNote: {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-primary)',
    marginBottom: 6,
  },
  timelineSnapshot: {
    display: 'flex',
    gap: 16,
    marginBottom: 6,
  },
  snapshotField: {
    fontSize: 11,
    color: 'var(--text-secondary)',
  },
  timelineSnapshotGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 6,
    marginBottom: 8,
  },
  snapshotCard: {
    padding: '6px 10px',
    borderRadius: 4,
    background: 'rgba(7, 13, 26, 0.5)',
    border: '1px solid var(--border-color)',
  },
  snapshotLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    marginBottom: 2,
  },
  snapshotValue: {
    fontSize: 12,
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  timelineActions: {
    marginTop: 4,
  },
  rollbackBtn: {
    padding: '4px 12px',
    borderRadius: 4,
    border: '1px solid rgba(0, 240, 192, 0.3)',
    background: 'rgba(0, 240, 192, 0.06)',
    color: '#00f0c0',
    fontSize: 11,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  rollbackInline: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  rollbackInput: {
    flex: 1,
    padding: '4px 8px',
    borderRadius: 4,
    border: '1px solid var(--border-color)',
    background: 'rgba(7, 13, 26, 0.6)',
    color: 'var(--text-primary)',
    fontSize: 11,
    outline: 'none',
  },
  rollbackConfirmBtn: {
    padding: '4px 10px',
    borderRadius: 4,
    border: 'none',
    background: 'var(--accent-gradient)',
    color: '#070d1a',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  },
  rollbackCancelBtn: {
    padding: '4px 10px',
    borderRadius: 4,
    border: '1px solid var(--border-color)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: 11,
    cursor: 'pointer',
  },
};

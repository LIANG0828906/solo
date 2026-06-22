import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import type { AdVersion } from '../types';
import * as localSim from '../utils/localSimulation';

interface Props {
  mode: 'edit' | 'history';
  onVersionsChange?: () => void;
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
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [rollbackVersionId, setRollbackVersionId] = useState<string | null>(null);
  const [rollbackEntryId, setRollbackEntryId] = useState<string | null>(null);
  const [rollbackNote, setRollbackNote] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchVersions = useCallback(async () => {
    try {
      const res = await axios.get('/api/versions');
      if (res.data && res.data.length > 0) {
        setVersions(res.data);
      } else {
        const localVersions = localSim.getVersions();
        setVersions(localVersions);
      }
    } catch {
      const localVersions = localSim.getVersions();
      setVersions(localVersions);
    }
  }, []);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const notifyChange = () => {
    fetchVersions();
    onVersionsChange?.();
  };

  const handleCreate = async () => {
    if (!form.title || !form.ctaText) return;
    try {
      const res = await axios.post('/api/versions', form);
      if (res.data) {
        setForm(emptyForm);
        setShowForm(false);
        notifyChange();
      }
    } catch {
      const newVersion = localSim.createLocalVersion(form);
      localSim.addVersion(newVersion);
      setForm(emptyForm);
      setShowForm(false);
      notifyChange();
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !form.title || !form.ctaText) return;
    try {
      await axios.put(`/api/versions/${editingId}`, form);
      setEditingId(null);
      setForm(emptyForm);
      setShowForm(false);
      notifyChange();
    } catch {
      localSim.updateVersion(editingId, form);
      setEditingId(null);
      setForm(emptyForm);
      setShowForm(false);
      notifyChange();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个版本吗？')) return;
    try {
      await axios.delete(`/api/versions/${id}`);
      notifyChange();
    } catch {
      localSim.deleteVersion(id);
      notifyChange();
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await axios.post(`/api/versions/${id}/duplicate`);
      if (res.data) {
        notifyChange();
      }
    } catch {
      localSim.duplicateVersion(id);
      notifyChange();
    }
  };

  const handleRollback = async (versionId: string, historyEntryId: string) => {
    try {
      await axios.post(`/api/versions/${versionId}/rollback`, {
        historyEntryId,
        note: rollbackNote || '回滚到历史版本',
      });
      setRollbackVersionId(null);
      setRollbackEntryId(null);
      setRollbackNote('');
      notifyChange();
    } catch {
      localSim.rollbackToHistory(versionId, historyEntryId, rollbackNote);
      setRollbackVersionId(null);
      setRollbackEntryId(null);
      setRollbackNote('');
      notifyChange();
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
    setImageMode(v.imageUrl && v.imageUrl.startsWith('data:') ? 'upload' : 'url');
  };

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(!showForm);
    setImageMode('url');
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
      second: '2-digit',
    });
  };

  const toggleHistory = (vid: string) => {
    setExpandedHistory(expandedHistory === vid ? null : vid);
  };

  const startRollback = (vid: string, eid: string) => {
    setRollbackVersionId(vid);
    setRollbackEntryId(eid);
    setRollbackNote('');
  };

  const cancelRollback = () => {
    setRollbackVersionId(null);
    setRollbackEntryId(null);
    setRollbackNote('');
  };

  return (
    <div style={styles.container}>
      {mode === 'edit' && (
        <>
          <div style={styles.pageHeader}>
            <div>
              <h2 style={styles.pageTitle}>🎨 广告创意工坊</h2>
              <p style={styles.pageSubtitle}>
                创建和管理多个广告版本，每个版本包含标题、描述、图片和CTA按钮。
              </p>
            </div>
            <button onClick={startCreate} style={styles.primaryBtn}>
              {showForm ? '取消' : '+ 新建版本'}
            </button>
          </div>

          {showForm && (
            <div style={styles.formCard}>
              <div style={styles.formHeader}>
                <h3 style={styles.formTitle}>
                  {editingId ? '✏️ 编辑版本' : '✨ 创建新版本'}
                </h3>
                <span style={styles.formHint}>
                  填写广告创意的核心元素
                </span>
              </div>

              <div style={styles.formBody}>
                <div style={styles.formRow}>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>📌 广告标题 <span style={styles.required}>*</span></label>
                    <input
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="输入引人注目的广告标题"
                      style={styles.formInput}
                    />
                  </div>
                </div>

                <div style={styles.formField}>
                  <label style={styles.formLabel}>📝 广告描述</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="描述产品特点和价值主张"
                    style={styles.formTextarea}
                    rows={3}
                  />
                </div>

                <div style={styles.formField}>
                  <label style={styles.formLabel}>🖼️ 广告图片</label>
                  <div style={styles.imageModeSwitch}>
                    <button
                      onClick={() => setImageMode('url')}
                      style={{
                        ...styles.imageModeBtn,
                        ...(imageMode === 'url' ? styles.imageModeBtnActive : {}),
                      }}
                    >
                      🔗 URL引用
                    </button>
                    <button
                      onClick={() => setImageMode('upload')}
                      style={{
                        ...styles.imageModeBtn,
                        ...(imageMode === 'upload' ? styles.imageModeBtnActive : {}),
                      }}
                    >
                      📤 上传图片
                    </button>
                  </div>

                  {imageMode === 'url' ? (
                    <input
                      value={form.imageUrl}
                      onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                      style={styles.formInput}
                    />
                  ) : (
                    <div style={styles.uploadArea}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        style={styles.uploadBtn}
                      >
                        选择图片文件
                      </button>
                    </div>
                  )}

                  {form.imageUrl && (
                    <div style={styles.imagePreview}>
                      <div style={styles.previewLabel}>预览</div>
                      <img src={form.imageUrl} alt="预览" style={styles.previewImage} />
                    </div>
                  )}
                </div>

                <div style={styles.formRow}>
                  <div style={{ ...styles.formField, flex: 1 }}>
                    <label style={styles.formLabel}>🔘 CTA按钮文案 <span style={styles.required}>*</span></label>
                    <input
                      value={form.ctaText}
                      onChange={(e) => setForm((f) => ({ ...f, ctaText: e.target.value }))}
                      placeholder="如：立即购买、了解更多"
                      style={styles.formInput}
                    />
                  </div>
                  <div style={{ ...styles.formField, flex: 1 }}>
                    <label style={styles.formLabel}>🔗 CTA跳转链接</label>
                    <input
                      value={form.ctaLink}
                      onChange={(e) => setForm((f) => ({ ...f, ctaLink: e.target.value }))}
                      placeholder="https://..."
                      style={styles.formInput}
                    />
                  </div>
                </div>
              </div>

              <div style={styles.formFooter}>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setForm(emptyForm);
                  }}
                  style={styles.secondaryBtn}
                >
                  取消
                </button>
                <button
                  onClick={editingId ? handleUpdate : handleCreate}
                  disabled={!form.title || !form.ctaText}
                  style={{
                    ...styles.submitBtn,
                    ...((!form.title || !form.ctaText) ? styles.submitBtnDisabled : {}),
                  }}
                >
                  {editingId ? '💾 保存修改' : '✨ 创建版本'}
                </button>
              </div>
            </div>
          )}

          <div style={styles.versionGrid}>
            {versions.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📭</div>
                <h3 style={styles.emptyTitle}>暂无广告版本</h3>
                <p style={styles.emptyDesc}>点击上方「新建版本」创建你的第一个广告创意</p>
              </div>
            ) : (
              versions.map((v) => (
                <div key={v.id} style={styles.versionCard}>
                <div style={styles.versionHeader}>
                  {v.imageUrl ? (
                    <div style={styles.versionImage}>
                      <img src={v.imageUrl} alt="" style={styles.versionImg} />
                    </div>
                  ) : (
                    <div style={styles.versionImagePlaceholder}>
                      🖼️
                    </div>
                  )}
                  <div style={styles.versionInfo}>
                    <h4 style={styles.versionTitle}>{v.title}</h4>
                    <p style={styles.versionDesc}>{v.description || '暂无描述'}</p>
                    <div style={styles.versionCtaRow}>
                      <span style={styles.ctaBadge}>{v.ctaText}</span>
                      {v.ctaLink && (
                        <span style={styles.ctaLinkText}>
                          🔗 {v.ctaLink.substring(0, 25)}
                          {v.ctaLink.length > 25 ? '...' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={styles.versionActions}>
                  <button onClick={() => startEdit(v)} style={styles.actionBtn}>
                    ✏️ 编辑
                  </button>
                  <button onClick={() => handleDuplicate(v.id)} style={styles.actionBtn}>
                    📋 复制
                  </button>
                  <button onClick={() => toggleHistory(v.id)} style={styles.actionBtn}>
                    📜 历史 ({v.history.length})
                  </button>
                  <button onClick={() => handleDelete(v.id)} style={styles.actionBtnDanger}>
                    🗑️ 删除
                  </button>
                </div>

                {expandedHistory === v.id && (
                  <div style={styles.timelineSection}>
                    <div style={styles.timelineHeader}>
                      <span style={styles.timelineTitle}>📜 修改历史</span>
                      <span style={styles.timelineCount}>{v.history.length} 个版本</span>
                    </div>
                    <div style={styles.timeline}>
                      {v.history.slice().reverse().map((entry, idx) => (
                        <div
                          key={entry.id}
                          style={{
                            ...styles.timelineItem,
                            animation: `slideIn 0.3s ease ${idx * 0.05}s both`,
                          }}
                        >
                          <div style={styles.timelineDot} />
                          <div style={styles.timelineLine} />
                          <div style={styles.timelineContent}>
                            <div style={styles.timelineTop}>
                              <span style={styles.timelineTime}>
                              🕐 {formatTime(entry.timestamp)}
                              </span>
                              {idx === 0 && (
                                <span style={styles.currentBadge}>当前版本</span>
                              )}
                            </div>
                            <div style={styles.timelineNote}>
                              💬 {entry.note || '未命名修改'}
                            </div>
                            <div style={styles.timelineSnapshot}>
                              <div style={styles.snapshotItem}>
                                <span style={styles.snapshotLabel}>标题</span>
                                <span style={styles.snapshotValue}>{entry.snapshot.title}</span>
                              </div>
                              <div style={styles.snapshotItem}>
                                <span style={styles.snapshotLabel}>描述</span>
                                <span style={styles.snapshotValue}>
                                  {entry.snapshot.description || '-'}
                                </span>
                              </div>
                              <div style={styles.snapshotItem}>
                                <span style={styles.snapshotLabel}>CTA</span>
                                <span style={styles.snapshotValue}>{entry.snapshot.ctaText}</span>
                              </div>
                              <div style={styles.snapshotItem}>
                                <span style={styles.snapshotLabel}>链接</span>
                                <span style={styles.snapshotValue}>
                                  {entry.snapshot.ctaLink || '-'}
                                </span>
                              </div>
                            </div>

                            {idx > 0 && (
                              <div style={styles.timelineActions}>
                                {rollbackVersionId === v.id && rollbackEntryId === entry.id ? (
                                  <div style={styles.rollbackForm}>
                                    <input
                                      value={rollbackNote}
                                      onChange={(e) => setRollbackNote(e.target.value)}
                                      placeholder="添加回滚注释（如：回滚到版本3的图片）"
                                      style={styles.rollbackInput}
                                    />
                                    <button
                                      onClick={() => handleRollback(v.id, entry.id)}
                                      style={styles.rollbackConfirmBtn}
                                    >
                                      ✅ 确认回滚
                                    </button>
                                    <button
                                      onClick={cancelRollback}
                                      style={styles.rollbackCancelBtn}
                                    >
                                      取消
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => startRollback(v.id, entry.id)}
                                    style={styles.rollbackBtn}
                                  >
                                    ↩️ 回滚到此版本
                                  </button>
                                )}
                              </div>
                            )}
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
        </>
      )}

      {mode === 'history' && (
        <>
          <div style={styles.pageHeader}>
            <div>
              <h2 style={styles.pageTitle}>📜 版本历史与回滚</h2>
              <p style={styles.pageSubtitle}>
                查看所有广告版本的修改历史，支持回滚到任意历史版本
              </p>
            </div>
          </div>

          <div style={styles.historyList}>
            {versions.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📭</div>
                <h3 style={styles.emptyTitle}>暂无版本数据</h3>
                <p style={styles.emptyDesc}>请先在创意工坊中创建广告版本</p>
              </div>
            ) : (
              versions.map((v) => (
                <div key={v.id} style={styles.historyAccordion}>
                  <div
                    style={styles.historyAccordionHeader}
                    onClick={() => toggleHistory(v.id)}
                  >
                    <div style={styles.historyAccordionLeft}>
                      <span style={styles.historyAccordionIcon}>
                        {expandedHistory === v.id ? '▼' : '▶'}
                      </span>
                      <div>
                        <h4 style={styles.historyAccordionTitle}>{v.title}</h4>
                        <span style={styles.historyAccordionMeta}>
                          {v.history.length} 条历史记录 · 最后更新: {formatTime(v.updatedAt)}
                        </span>
                      </div>
                    </div>
                    <div style={styles.historyAccordionRight}>
                      <span style={styles.historyCountBadge}>
                        {v.history.length}
                      </span>
                    </div>
                  </div>

                  {expandedHistory === v.id && (
                    <div style={styles.historyAccordionBody}>
                      <div style={styles.timeline}>
                        {v.history.slice().reverse().map((entry, idx) => (
                          <div
                            key={entry.id}
                            style={{
                              ...styles.timelineItem,
                              animation: `slideIn 0.3s ease ${idx * 0.05}s both`,
                            }}
                          >
                            <div style={styles.timelineDot} />
                            <div style={styles.timelineLine} />
                            <div style={styles.timelineContent}>
                              <div style={styles.timelineTop}>
                                <span style={styles.timelineTime}>
                                  🕐 {formatTime(entry.timestamp)}
                                </span>
                                {idx === 0 && (
                                  <span style={styles.currentBadge}>当前版本</span>
                                )}
                              </div>
                              <div style={styles.timelineNote}>
                                💬 {entry.note || '未命名修改'}
                              </div>

                              <div style={styles.snapshotCard}>
                                <div style={styles.snapshotCardHeader}>
                                  <span>📋 版本快照</span>
                                </div>
                                <div style={styles.snapshotGrid}>
                                  <div style={styles.snapshotField}>
                                    <span style={styles.snapshotFieldLabel}>标题</span>
                                    <span style={styles.snapshotFieldValue}>
                                      {entry.snapshot.title}
                                    </span>
                                  </div>
                                  <div style={styles.snapshotField}>
                                    <span style={styles.snapshotFieldLabel}>描述</span>
                                    <span style={styles.snapshotFieldValue}>
                                      {entry.snapshot.description || '-'}
                                    </span>
                                  </div>
                                  <div style={styles.snapshotField}>
                                    <span style={styles.snapshotFieldLabel}>CTA文案</span>
                                    <span style={styles.snapshotFieldValue}>
                                      {entry.snapshot.ctaText}
                                    </span>
                                  </div>
                                  <div style={styles.snapshotField}>
                                    <span style={styles.snapshotFieldLabel}>CTA链接</span>
                                    <span style={styles.snapshotFieldValue}>
                                      {entry.snapshot.ctaLink || '-'}
                                    </span>
                                  </div>
                                </div>
                                {entry.snapshot.imageUrl && (
                                  <div style={styles.snapshotImage}>
                                    <img
                                      src={entry.snapshot.imageUrl}
                                      alt=""
                                      style={styles.snapshotImageImg}
                                    />
                                  </div>
                                )}
                              </div>

                              {idx > 0 && (
                                <div style={styles.timelineActions}>
                                  {rollbackVersionId === v.id && rollbackEntryId === entry.id ? (
                                    <div style={styles.rollbackForm}>
                                      <input
                                        value={rollbackNote}
                                        onChange={(e) => setRollbackNote(e.target.value)}
                                        placeholder="添加回滚注释（如：回滚到版本3的图片）"
                                        style={styles.rollbackInput}
                                      />
                                      <button
                                        onClick={() => handleRollback(v.id, entry.id)}
                                        style={styles.rollbackConfirmBtn}
                                      >
                                        ✅ 确认回滚
                                      </button>
                                      <button
                                        onClick={cancelRollback}
                                        style={styles.rollbackCancelBtn}
                                      >
                                        取消
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => startRollback(v.id, entry.id)}
                                      style={styles.rollbackBtn}
                                    >
                                      ↩️ 回滚到此版本
                                    </button>
                                  )}
                                </div>
                              )}
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
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    animation: 'fadeIn 0.3s ease',
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 16,
    flexWrap: 'wrap' as const,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 13,
    color: 'var(--text-secondary)',
  },
  primaryBtn: {
    padding: '10px 22px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'var(--accent-gradient)',
    color: '#070d1a',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'transform 0.2s',
  },
  secondaryBtn: {
    padding: '10px 20px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  submitBtn: {
    padding: '10px 24px',
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
  formCard: {
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-xl)',
    backdropFilter: 'blur(16px)',
    marginBottom: 24,
    overflow: 'hidden',
    animation: 'fadeIn 0.3s ease',
    boxShadow: 'var(--shadow-glow)',
  },
  formHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid var(--border-color)',
    background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.05), transparent)',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 4,
  },
  formHint: {
    fontSize: 12,
    color: 'var(--text-muted)',
  },
  formBody: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  formRow: {
    display: 'flex',
    gap: 16,
  },
  formField: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    flex: 1,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    letterSpacing: '0.02em',
  },
  required: {
    color: '#ff5252',
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
  formTextarea: {
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)',
    background: 'rgba(7, 13, 26, 0.6)',
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    minHeight: 72,
  },
  imageModeSwitch: {
    display: 'flex',
    gap: 6,
    marginBottom: 4,
  },
  imageModeBtn: {
    padding: '6px 14px',
    borderRadius: 6,
    border: '1px solid var(--border-color)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  imageModeBtnActive: {
    border: '1px solid var(--accent-cyan)',
    background: 'rgba(0, 229, 255, 0.1)',
    color: 'var(--accent-cyan)',
  },
  uploadArea: {
    padding: 16,
    border: '2px dashed var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    textAlign: 'center' as const,
  },
  uploadBtn: {
    padding: '8px 20px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)',
    background: 'rgba(0, 229, 255, 0.05)',
    color: 'var(--accent-cyan)',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
  },
  imagePreview: {
    marginTop: 12,
  },
  previewLabel: {
    fontSize: 11,
    color: 'var(--text-muted)',
    marginBottom: 6,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: 180,
    borderRadius: 'var(--radius-sm)',
    objectFit: 'cover' as const,
    border: '1px solid var(--border-color)',
  },
  formFooter: {
    padding: '16px 24px',
    borderTop: '1px solid var(--border-color)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    background: 'rgba(0, 0, 0, 0.2)',
  },
  versionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: 16,
  },
  versionCard: {
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    backdropFilter: 'blur(12px)',
    overflow: 'hidden',
    transition: 'all 0.3s',
  },
  versionHeader: {
    padding: 16,
    display: 'flex',
    gap: 14,
  },
  versionImage: {
    width: 120,
    height: 80,
    borderRadius: 'var(--radius-sm)',
    overflow: 'hidden',
    flexShrink: 0,
  },
  versionImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  versionImagePlaceholder: {
    width: 120,
    height: 80,
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(0, 229, 255, 0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    flexShrink: 0,
  },
  versionInfo: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  versionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  versionDesc: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginBottom: 8,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    lineHeight: 1.4,
  },
  versionCtaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  ctaBadge: {
    padding: '3px 10px',
    borderRadius: 4,
    background: 'var(--accent-gradient)',
    color: '#070d1a',
    fontSize: 11,
    fontWeight: 600,
  },
  ctaLinkText: {
    fontSize: 11,
    color: 'var(--text-muted)',
  },
  versionActions: {
    padding: '10px 16px',
    borderTop: '1px solid var(--border-color)',
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap' as const,
  },
  actionBtn: {
    padding: '6px 12px',
    borderRadius: 6,
    border: '1px solid var(--border-color)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 0.2s',
    flex: 1,
    minWidth: 70,
  },
  actionBtnDanger: {
    padding: '6px 12px',
    borderRadius: 6,
    border: '1px solid rgba(255, 82, 82, 0.3)',
    background: 'transparent',
    color: '#ff5252',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  timelineSection: {
    padding: '0 16px 16px',
    borderTop: '1px solid var(--border-color)',
    marginTop: 4,
  },
  timelineHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  timelineCount: {
    fontSize: 11,
    color: 'var(--text-muted)',
  },
  timeline: {
    position: 'relative' as const,
    paddingLeft: 20,
  },
  timelineItem: {
    position: 'relative' as const,
    paddingBottom: 18,
  },
  timelineDot: {
    position: 'absolute' as const,
    left: -20,
    top: 4,
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: 'var(--accent-cyan)',
    border: '2px solid var(--bg-secondary)',
    zIndex: 1,
    boxShadow: '0 0 8px rgba(0, 229, 255, 0.5)',
  },
  timelineLine: {
    position: 'absolute' as const,
    left: -15,
    top: 16,
    bottom: 0,
    width: 2,
    background: 'rgba(0, 229, 255, 0.15)',
  },
  timelineContent: {
    background: 'rgba(7, 13, 26, 0.5)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    padding: 12,
  },
  timelineTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timelineTime: {
    fontSize: 11,
    color: 'var(--text-muted)',
  },
  currentBadge: {
    padding: '2px 8px',
    borderRadius: 10,
    background: 'rgba(0, 240, 192, 0.1)',
    border: '1px solid rgba(0, 240, 192, 0.3)',
    color: '#00f0c0',
    fontSize: 10,
    fontWeight: 600,
  },
  timelineNote: {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-primary)',
    marginBottom: 10,
  },
  timelineSnapshot: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 6,
    marginBottom: 10,
  },
  snapshotItem: {
    padding: '4px 8px',
    background: 'rgba(0, 229, 255, 0.04)',
    borderRadius: 4,
  },
  snapshotLabel: {
    display: 'block',
    fontSize: 10,
    color: 'var(--text-muted)',
    marginBottom: 2,
  },
  snapshotValue: {
    display: 'block',
    fontSize: 12,
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  timelineActions: {
    marginTop: 8,
  },
  rollbackBtn: {
    padding: '6px 14px',
    borderRadius: 6,
    border: '1px solid rgba(0, 240, 192, 0.3)',
    background: 'rgba(0, 240, 192, 0.06)',
    color: '#00f0c0',
    fontSize: 11,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  rollbackForm: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  rollbackInput: {
    flex: 1,
    minWidth: 160,
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid var(--border-color)',
    background: 'rgba(7, 13, 26, 0.6)',
    color: 'var(--text-primary)',
    fontSize: 12,
    outline: 'none',
  },
  rollbackConfirmBtn: {
    padding: '6px 14px',
    borderRadius: 6,
    border: 'none',
    background: 'var(--accent-gradient)',
    color: '#070d1a',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  },
  rollbackCancelBtn: {
    padding: '6px 14px',
    borderRadius: 6,
    border: '1px solid var(--border-color)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: 11,
    cursor: 'pointer',
  },
  emptyState: {
    gridColumn: '1 / -1',
    padding: '60px 20px',
    textAlign: 'center' as const,
    background: 'var(--glass-bg)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--glass-border)',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: 'var(--text-secondary)',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  historyAccordion: {
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    backdropFilter: 'blur(12px)',
    overflow: 'hidden',
  },
  historyAccordionHeader: {
    padding: '14px 20px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'background 0.2s',
  },
  historyAccordionLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  historyAccordionIcon: {
    fontSize: 10,
    color: 'var(--text-muted)',
    transition: 'transform 0.2s',
  },
  historyAccordionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 2,
  },
  historyAccordionMeta: {
    fontSize: 12,
    color: 'var(--text-muted)',
  },
  historyAccordionRight: {},
  historyCountBadge: {
    padding: '4px 10px',
    borderRadius: 12,
    background: 'rgba(0, 229, 255, 0.1)',
    color: 'var(--accent-cyan)',
    fontSize: 12,
    fontWeight: 600,
  },
  historyAccordionBody: {
    padding: '0 20px 20px',
    borderTop: '1px solid var(--border-color)',
    animation: 'fadeIn 0.3s ease',
  },
  snapshotCard: {
    background: 'rgba(7, 13, 26, 0.4)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    padding: 12,
    marginBottom: 10,
  },
  snapshotCardHeader: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: 10,
  },
  snapshotGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginBottom: 10,
  },
  snapshotField: {
    padding: '6px 10px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 4,
  },
  snapshotFieldLabel: {
    display: 'block',
    fontSize: 10,
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    marginBottom: 3,
  },
  snapshotFieldValue: {
    display: 'block',
    fontSize: 12,
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  snapshotImage: {
    width: '100%',
    maxHeight: 120,
    overflow: 'hidden',
    borderRadius: 4,
  },
  snapshotImageImg: {
    width: '100%',
    height: 120,
    objectFit: 'cover' as const,
  },
};

import { useState } from 'react';
import axios from 'axios';
import {
  Plus,
  Copy,
  Edit3,
  Save,
  X,
  RotateCcw,
  History,
  Upload,
  Link as LinkIcon,
  Clock,
  Send,
  Image,
} from 'lucide-react';
import { ExperimentData, AdVersion, VersionHistory } from './types';

interface VersionPanelProps {
  experiment: ExperimentData;
  onPublish: (
    versions: AdVersion[],
    allocation: Record<string, number>,
    duration: number,
  ) => void;
  onUpdate: () => void;
}

const emptyVersion = (): Omit<AdVersion, 'id' | 'createdAt' | 'history'> => ({
  title: '',
  description: '',
  imageUrl: '',
  ctaText: '',
  ctaLink: '',
});

const VersionPanel = ({ experiment, onPublish, onUpdate }: VersionPanelProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyVersion());
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState(emptyVersion());
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [rollbackComment, setRollbackComment] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(
    experiment.versions.slice(0, Math.min(3, experiment.versions.length)).map((v) => v.id),
  );
  const [allocation, setAllocation] = useState<Record<string, number>>({ ...experiment.trafficAllocation });
  const [duration, setDuration] = useState(experiment.durationHours);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startEdit = (v: AdVersion) => {
    setEditingId(v.id);
    setEditForm({
      title: v.title,
      description: v.description,
      imageUrl: v.imageUrl,
      ctaText: v.ctaText,
      ctaLink: v.ctaLink,
    });
  };

  const saveEdit = async () => {
    if (!editingId || !editForm.title.trim()) return;
    setSaving(true);
    try {
      await axios.put(`/api/experiment/${experiment.id}/version/${editingId}`, editForm);
      setEditingId(null);
      onUpdate();
    } catch (err) {
      console.error('Failed to update version:', err);
    } finally {
      setSaving(false);
    }
  };

  const createVersion = async () => {
    if (!newForm.title.trim()) return;
    setSaving(true);
    try {
      await axios.post(`/api/experiment/${experiment.id}/version`, newForm);
      setShowNewForm(false);
      setNewForm(emptyVersion());
      onUpdate();
    } catch (err) {
      console.error('Failed to create version:', err);
    } finally {
      setSaving(false);
    }
  };

  const duplicateVersion = async (v: AdVersion) => {
    setSaving(true);
    try {
      await axios.post(`/api/experiment/${experiment.id}/version`, {
        ...v,
        title: v.title + ' (副本)',
      });
      onUpdate();
    } catch (err) {
      console.error('Failed to duplicate:', err);
    } finally {
      setSaving(false);
    }
  };

  const rollbackVersion = async (versionId: string, historyId: string) => {
    try {
      await axios.post(`/api/experiment/${experiment.id}/version/${versionId}/rollback`, {
        historyId,
        comment: rollbackComment || '回滚到历史版本',
      });
      setRollbackComment('');
      setSelectedVersionId(null);
      onUpdate();
    } catch (err) {
      console.error('Failed to rollback:', err);
    }
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  };

  const adjustAllocation = (id: string, val: number) => {
    setAllocation((prev) => ({ ...prev, [id]: Math.max(0, Math.min(100, val)) }));
  };

  const totalAllocation = selectedIds.reduce((sum, id) => sum + (allocation[id] || 0), 0);

  const handlePublish = () => {
    if (selectedIds.length < 2 || selectedIds.length > 5) return;
    if (totalAllocation !== 100) return;
    const versions = experiment.versions.filter((v) => selectedIds.includes(v.id));
    const alloc: Record<string, number> = {};
    selectedIds.forEach((id) => {
      alloc[id] = allocation[id] || 0;
    });
    onPublish(versions, alloc, duration);
  };

  const selectedVersion = selectedVersionId
    ? experiment.versions.find((v) => v.id === selectedVersionId)
    : null;

  return (
    <div style={styles.container}>
      <div style={styles.mainGrid}>
        <div style={styles.leftCol}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              <Image size={20} style={{ color: '#00e5ff' }} />
              广告版本列表
            </h2>
            {!showNewForm && (
              <button onClick={() => setShowNewForm(true)} style={styles.addBtn}>
                <Plus size={16} />
                新建版本
              </button>
            )}
          </div>

          {showNewForm && (
            <div style={styles.formCard}>
              <div style={styles.formHeader}>
                <span style={styles.formTitle}>新建广告版本</span>
                <button onClick={() => setShowNewForm(false)} style={styles.closeBtn}>
                  <X size={16} />
                </button>
              </div>
              <VersionForm
                data={newForm}
                onChange={setNewForm}
                onImageUpload={(url) => setNewForm((p) => ({ ...p, imageUrl: url }))}
              />
              <div style={styles.formActions}>
                <button onClick={() => setShowNewForm(false)} style={styles.cancelBtn}>
                  取消
                </button>
                <button onClick={createVersion} style={styles.primaryBtn} disabled={saving || !newForm.title.trim()}>
                  <Save size={14} />
                  {saving ? '保存中...' : '创建版本'}
                </button>
              </div>
            </div>
          )}

          <div style={styles.versionList}>
            {experiment.versions.map((version, idx) => (
              <div key={version.id} style={styles.versionCard}>
                {editingId === version.id ? (
                  <>
                    <div style={styles.formHeader}>
                      <span style={styles.formTitle}>编辑版本 {String.fromCharCode(65 + idx)}</span>
                      <button onClick={() => setEditingId(null)} style={styles.closeBtn}>
                        <X size={16} />
                      </button>
                    </div>
                    <VersionForm
                      data={editForm}
                      onChange={setEditForm}
                      onImageUpload={(url) => setEditForm((p) => ({ ...p, imageUrl: url }))}
                    />
                    <div style={styles.formActions}>
                      <button onClick={() => setEditingId(null)} style={styles.cancelBtn}>
                        取消
                      </button>
                      <button onClick={saveEdit} style={styles.primaryBtn} disabled={saving || !editForm.title.trim()}>
                        <Save size={14} />
                        {saving ? '保存中...' : '保存修改'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={styles.versionHeader}>
                      <div style={styles.versionInfo}>
                        <span style={styles.versionBadge}>版本 {String.fromCharCode(65 + idx)}</span>
                        <h4 style={styles.versionName}>{version.title}</h4>
                      </div>
                      <div style={styles.versionActions}>
                        <button onClick={() => startEdit(version)} style={styles.iconBtn} title="编辑">
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => duplicateVersion(version)} style={styles.iconBtn} title="复制">
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() =>
                            setSelectedVersionId(selectedVersionId === version.id ? null : version.id)
                          }
                          style={{
                            ...styles.iconBtn,
                            ...(selectedVersionId === version.id ? styles.iconBtnActive : {}),
                          }}
                          title="查看历史"
                        >
                          <History size={14} />
                        </button>
                      </div>
                    </div>
                    <div style={styles.versionPreview}>
                      {version.imageUrl && (
                        <img
                          src={version.imageUrl}
                          alt={version.title}
                          style={styles.versionImg}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div style={styles.versionMeta}>
                        <p style={styles.versionDesc}>{version.description}</p>
                        <div style={styles.ctaRow}>
                          <span style={styles.ctaTag}>{version.ctaText}</span>
                          <span style={styles.ctaLink}>
                            <LinkIcon size={10} />
                            {version.ctaLink.length > 30
                              ? version.ctaLink.slice(0, 30) + '...'
                              : version.ctaLink}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedVersionId === version.id && version.history.length > 0 && (
                      <div style={styles.historySection}>
                        <div style={styles.historyHeader}>
                          <History size={14} style={{ color: '#00e5ff' }} />
                          <span>修改历史（{version.history.length}条）</span>
                        </div>
                        <div style={styles.timeline}>
                          {version.history.map((h, hi) => (
                            <HistoryItem
                              key={h.id}
                              history={h}
                              index={version.history.length - hi}
                              comment={rollbackComment}
                              onCommentChange={setRollbackComment}
                              onRollback={() => rollbackVersion(version.id, h.id)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedVersionId === version.id && version.history.length === 0 && (
                      <div style={styles.noHistory}>
                        <History size={20} style={{ opacity: 0.3 }} />
                        <span>暂无历史记录</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={styles.rightCol}>
          <div style={styles.publishCard}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>
                <Send size={20} style={{ color: '#00d4aa' }} />
                实验配置与发布
              </h2>
            </div>

            <div style={styles.publishSection}>
              <label style={styles.label}>
                选择广告版本（{selectedIds.length}/5，至少2个）
              </label>
              <div style={styles.checkboxList}>
                {experiment.versions.map((v, idx) => (
                  <label
                    key={v.id}
                    style={{
                      ...styles.checkboxItem,
                      ...(selectedIds.includes(v.id) ? styles.checkboxItemActive : {}),
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(v.id)}
                      onChange={() => toggleSelected(v.id)}
                      style={styles.checkbox}
                    />
                    <span style={styles.checkboxBadge}>{String.fromCharCode(65 + idx)}</span>
                    <span style={styles.checkboxLabel}>{v.title}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={styles.publishSection}>
              <label style={styles.label}>
                流量分配比例（总计: {totalAllocation}%
                {totalAllocation !== 100 && <span style={{ color: '#ef4444' }}> 需要等于100%</span>}）
              </label>
              <div style={styles.allocationList}>
                {selectedIds.map((id, idx) => {
                  const v = experiment.versions.find((x) => x.id === id);
                  if (!v) return null;
                  return (
                    <div key={id} style={styles.allocationRow}>
                      <span style={styles.allocationLabel}>
                        版本 {String.fromCharCode(65 + experiment.versions.findIndex((x) => x.id === id))}
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={allocation[id] || 0}
                        onChange={(e) => adjustAllocation(id, parseInt(e.target.value))}
                        style={styles.slider}
                      />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={allocation[id] || 0}
                        onChange={(e) => adjustAllocation(id, parseInt(e.target.value) || 0)}
                        style={styles.allocationInput}
                      />
                      <span style={styles.percentSign}>%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={styles.publishSection}>
              <label style={styles.label}>
                <Clock size={14} />
                实验持续时间（小时）
              </label>
              <input
                type="number"
                min={1}
                max={720}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 24)}
                style={styles.durationInput}
              />
            </div>

            <button
              onClick={handlePublish}
              style={{
                ...styles.publishBtn,
                ...((selectedIds.length < 2 || selectedIds.length > 5 || totalAllocation !== 100)
                  ? styles.publishBtnDisabled
                  : {}),
              }}
              disabled={selectedIds.length < 2 || selectedIds.length > 5 || totalAllocation !== 100}
            >
              <Send size={16} />
              发布实验
            </button>

            {(selectedIds.length < 2 || selectedIds.length > 5) && (
              <p style={styles.hint}>请选择 2-5 个广告版本</p>
            )}
            {totalAllocation !== 100 && selectedIds.length >= 2 && (
              <p style={styles.hint}>流量分配总和必须等于 100%</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface VersionFormProps {
  data: Omit<AdVersion, 'id' | 'createdAt' | 'history'>;
  onChange: (d: Omit<AdVersion, 'id' | 'createdAt' | 'history'>) => void;
  onImageUpload: (url: string) => void;
}

const VersionForm = ({ data, onChange, onImageUpload }: VersionFormProps) => {
  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  return (
  <div style={styles.formBody}>
    <div style={styles.formField}>
      <label style={styles.fieldLabel}>标题 *</label>
      <input
        type="text"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
        placeholder="输入广告标题"
        style={styles.textInput}
      />
    </div>
    <div style={styles.formField}>
      <label style={styles.fieldLabel}>描述</label>
      <textarea
        value={data.description}
        onChange={(e) => onChange({ ...data, description: e.target.value })}
        placeholder="输入广告描述"
        rows={2}
        style={styles.textArea}
      />
    </div>
    <div style={styles.formField}>
      <label style={styles.fieldLabel}>图片</label>
      <div style={styles.imageRow}>
        <input
          type="text"
          value={data.imageUrl}
          onChange={(e) => onChange({ ...data, imageUrl: e.target.value })}
          placeholder="输入图片URL"
          style={styles.textInput}
        />
        <label style={styles.uploadBtn}>
          <Upload size={14} />
          上传
          <input
            type="file"
            accept="image/*"
            onChange={handleLocalImageUpload}
            style={{ display: 'none' }}
          />
        </label>
      </div>
      {data.imageUrl && (
        <img
          src={data.imageUrl}
          alt="preview"
          style={styles.previewImg}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      )}
    </div>
    <div style={styles.formRow}>
      <div style={{ ...styles.formField, flex: 1 }}>
        <label style={styles.fieldLabel}>CTA 按钮文案</label>
        <input
          type="text"
          value={data.ctaText}
          onChange={(e) => onChange({ ...data, ctaText: e.target.value })}
          placeholder="如：立即购买"
          style={styles.textInput}
        />
      </div>
      <div style={{ ...styles.formField, flex: 1 }}>
        <label style={styles.fieldLabel}>CTA 链接</label>
        <input
          type="text"
          value={data.ctaLink}
          onChange={(e) => onChange({ ...data, ctaLink: e.target.value })}
          placeholder="https://..."
          style={styles.textInput}
        />
      </div>
    </div>
  </div>
  );
};

interface HistoryItemProps {
  history: VersionHistory;
  index: number;
  comment: string;
  onCommentChange: (s: string) => void;
  onRollback: () => void;
}

const HistoryItem = ({ history, index, comment, onCommentChange, onRollback }: HistoryItemProps) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={styles.timelineItem}>
      <div style={styles.timelineDot} />
      <div style={styles.timelineLine} />
      <div style={styles.timelineContent}>
        <div style={styles.timelineHeader}>
          <span style={styles.timelineIndex}>v{index}</span>
          <span style={styles.timelineTime}>
            {new Date(history.timestamp).toLocaleString('zh-CN')}
          </span>
          <button onClick={() => setExpanded(!expanded)} style={styles.timelineToggle}>
            {expanded ? '收起' : '详情'}
          </button>
        </div>
        <p style={styles.timelineComment}>{history.comment}</p>
        {expanded && (
          <div style={styles.timelineSnapshot}>
            {Object.entries(history.snapshot).map(([k, v]) => (
              <div key={k} style={styles.snapshotRow}>
                <span style={styles.snapshotKey}>{k}:</span>
                <span style={styles.snapshotValue}>
                  {typeof v === 'string' && v.length > 50 ? v.slice(0, 50) + '...' : String(v)}
                </span>
              </div>
            ))}
          </div>
        )}
        <div style={styles.rollbackRow}>
          <input
            type="text"
            placeholder="回滚注释（可选）"
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            style={styles.rollbackInput}
          />
          <button onClick={onRollback} style={styles.rollbackBtn}>
            <RotateCcw size={12} />
            回滚到此版本
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: '20px',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  rightCol: {
    position: 'sticky',
    top: '20px',
    alignSelf: 'flex-start',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '17px',
    fontWeight: 600,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: 0,
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(0,212,170,0.1))',
    border: '1px solid rgba(0,229,255,0.25)',
    color: '#00e5ff',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  formCard: {
    background: 'rgba(15, 31, 56, 0.5)',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid rgba(0, 229, 255, 0.1)',
    marginBottom: '12px',
  },
  formHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  formTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#00e5ff',
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.05)',
    border: 'none',
    color: '#94a3b8',
    padding: '4px',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
  },
  formBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  formRow: {
    display: 'flex',
    gap: '12px',
  },
  formField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  fieldLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: 500,
  },
  textInput: {
    background: 'rgba(10, 22, 40, 0.8)',
    border: '1px solid rgba(255,255,255,0.06)',
    color: '#fff',
    padding: '10px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    outline: 'none',
  },
  textArea: {
    background: 'rgba(10, 22, 40, 0.8)',
    border: '1px solid rgba(255,255,255,0.06)',
    color: '#fff',
    padding: '10px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  imageRow: {
    display: 'flex',
    gap: '8px',
  },
  uploadBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 14px',
    background: 'rgba(0,229,255,0.1)',
    border: '1px solid rgba(0,229,255,0.2)',
    color: '#00e5ff',
    borderRadius: '8px',
    fontSize: '12px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  previewImg: {
    marginTop: '8px',
    maxHeight: '100px',
    borderRadius: '8px',
    objectFit: 'cover',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '14px',
  },
  cancelBtn: {
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#94a3b8',
    borderRadius: '8px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  primaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 18px',
    background: 'linear-gradient(135deg, #00d4aa, #00b4d8)',
    border: 'none',
    color: '#0a1628',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  versionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  versionCard: {
    background: 'rgba(15, 31, 56, 0.4)',
    borderRadius: '14px',
    padding: '16px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  versionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  versionInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  versionBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    background: 'rgba(0,229,255,0.1)',
    color: '#00e5ff',
    fontSize: '11px',
    fontWeight: 600,
    borderRadius: '4px',
    width: 'fit-content',
  },
  versionName: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#fff',
    margin: 0,
  },
  versionActions: {
    display: 'flex',
    gap: '6px',
  },
  iconBtn: {
    width: '30px',
    height: '30px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
    color: '#94a3b8',
    borderRadius: '7px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    background: 'rgba(0,229,255,0.1)',
    borderColor: 'rgba(0,229,255,0.25)',
    color: '#00e5ff',
  },
  versionPreview: {
    display: 'flex',
    gap: '12px',
  },
  versionImg: {
    width: '90px',
    height: '68px',
    borderRadius: '8px',
    objectFit: 'cover',
    flexShrink: 0,
  },
  versionMeta: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minWidth: 0,
  },
  versionDesc: {
    fontSize: '12px',
    color: '#64748b',
    margin: 0,
    lineHeight: 1.5,
  },
  ctaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  ctaTag: {
    padding: '3px 10px',
    background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(0,212,170,0.1))',
    border: '1px solid rgba(0,229,255,0.2)',
    color: '#00e5ff',
    fontSize: '11px',
    fontWeight: 600,
    borderRadius: '6px',
  },
  ctaLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    color: '#64748b',
    fontFamily: 'monospace',
  },
  historySection: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
  },
  historyHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#94a3b8',
    marginBottom: '12px',
  },
  noHistory: {
    marginTop: '16px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    color: '#64748b',
    fontSize: '12px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
  },
  timeline: {
    position: 'relative',
    paddingLeft: '18px',
  },
  timelineItem: {
    position: 'relative',
    paddingBottom: '16px',
  },
  timelineDot: {
    position: 'absolute',
    left: '-18px',
    top: '6px',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #00d4aa, #00b4d8)',
    boxShadow: '0 0 8px rgba(0,229,255,0.4)',
  },
  timelineLine: {
    position: 'absolute',
    left: '-14px',
    top: '20px',
    bottom: '0',
    width: '2px',
    background: 'rgba(255,255,255,0.06)',
  },
  timelineContent: {
    background: 'rgba(10, 22, 40, 0.6)',
    borderRadius: '10px',
    padding: '12px',
    border: '1px solid rgba(255,255,255,0.04)',
  },
  timelineHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '6px',
  },
  timelineIndex: {
    padding: '2px 8px',
    background: 'rgba(139,92,246,0.15)',
    color: '#a78bfa',
    fontSize: '11px',
    fontWeight: 700,
    borderRadius: '4px',
    fontFamily: 'monospace',
  },
  timelineTime: {
    fontSize: '11px',
    color: '#64748b',
    flex: 1,
  },
  timelineToggle: {
    background: 'none',
    border: 'none',
    color: '#00e5ff',
    fontSize: '11px',
    cursor: 'pointer',
    padding: 0,
  },
  timelineComment: {
    fontSize: '12px',
    color: '#e2e8f0',
    margin: '0 0 8px 0',
  },
  timelineSnapshot: {
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '6px',
    padding: '10px',
    marginBottom: '10px',
  },
  snapshotRow: {
    display: 'flex',
    gap: '8px',
    fontSize: '11px',
    padding: '3px 0',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
  },
  snapshotKey: {
    color: '#94a3b8',
    fontWeight: 600,
    minWidth: '80px',
  },
  snapshotValue: {
    color: '#cbd5e1',
    fontFamily: 'monospace',
    wordBreak: 'break-all',
  },
  rollbackRow: {
    display: 'flex',
    gap: '8px',
  },
  rollbackInput: {
    flex: 1,
    background: 'rgba(10, 22, 40, 0.8)',
    border: '1px solid rgba(255,255,255,0.06)',
    color: '#fff',
    padding: '7px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    outline: 'none',
  },
  rollbackBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '7px 12px',
    background: 'rgba(251,146,60,0.12)',
    border: '1px solid rgba(251,146,60,0.25)',
    color: '#fb923c',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  publishCard: {
    background: 'rgba(15, 31, 56, 0.5)',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid rgba(0, 229, 255, 0.1)',
    backdropFilter: 'blur(20px)',
  },
  publishSection: {
    marginBottom: '18px',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#94a3b8',
    fontWeight: 500,
    marginBottom: '10px',
  },
  checkboxList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  checkboxItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    background: 'rgba(10, 22, 40, 0.6)',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  checkboxItemActive: {
    borderColor: 'rgba(0,229,255,0.25)',
    background: 'rgba(0,229,255,0.05)',
  },
  checkbox: {
    accentColor: '#00e5ff',
    width: '16px',
    height: '16px',
  },
  checkboxBadge: {
    padding: '2px 8px',
    background: 'rgba(0,229,255,0.1)',
    color: '#00e5ff',
    fontSize: '11px',
    fontWeight: 700,
    borderRadius: '4px',
  },
  checkboxLabel: {
    fontSize: '13px',
    color: '#e2e8f0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flex: 1,
  },
  allocationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  allocationRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  allocationLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    width: '54px',
    flexShrink: 0,
  },
  slider: {
    flex: 1,
    accentColor: '#00e5ff',
    height: '4px',
  },
  allocationInput: {
    width: '48px',
    background: 'rgba(10, 22, 40, 0.8)',
    border: '1px solid rgba(255,255,255,0.06)',
    color: '#fff',
    padding: '6px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    textAlign: 'center',
    outline: 'none',
    fontFamily: 'monospace',
  },
  percentSign: {
    fontSize: '13px',
    color: '#00e5ff',
    fontWeight: 600,
  },
  durationInput: {
    width: '100%',
    background: 'rgba(10, 22, 40, 0.8)',
    border: '1px solid rgba(255,255,255,0.06)',
    color: '#fff',
    padding: '10px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'monospace',
  },
  publishBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #00d4aa, #00b4d8)',
    border: 'none',
    color: '#0a1628',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '8px',
  },
  publishBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  hint: {
    fontSize: '11px',
    color: '#fb923c',
    textAlign: 'center',
    marginTop: '10px',
    margin: 0,
  },
};

export default VersionPanel;

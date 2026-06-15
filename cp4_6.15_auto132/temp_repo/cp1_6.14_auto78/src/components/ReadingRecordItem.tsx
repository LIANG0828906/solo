import React, { useState, useRef, useEffect } from 'react';
import { ReadingRecord } from '../types';
import { updateRecord, deleteRecord } from '../apiService';

interface ReadingRecordItemProps {
  record: ReadingRecord;
  bookTitle?: string;
  onUpdate?: (record: ReadingRecord) => void;
  onDelete?: (id: string) => void;
}

const PRESET_TAGS = ['专注', '理解困难', '有趣', '枯燥', '启发', '实用', '感动', '难懂'];

const ReadingRecordItem: React.FC<ReadingRecordItemProps> = ({
  record,
  bookTitle,
  onUpdate,
  onDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<ReadingRecord>(record);
  const [customTag, setCustomTag] = useState('');
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [isExpanded, isEditing]);

  useEffect(() => {
    setEditForm(record);
  }, [record]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.action-btn') || (e.target as HTMLElement).closest('.edit-field')) {
      return;
    }
    setIsExpanded(!isExpanded);
  };

  const handleEdit = () => {
    setEditForm(record);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditForm(record);
    setIsEditing(false);
    setCustomTag('');
  };

  const handleSaveEdit = async () => {
    try {
      const { id, ...data } = editForm;
      const updatedRecord = await updateRecord(id, data);
      onUpdate?.(updatedRecord);
      setIsEditing(false);
      setCustomTag('');
    } catch (error) {
      console.error('Update record failed:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('确定要删除这条阅读记录吗？')) {
      try {
        await deleteRecord(record.id);
        onDelete?.(record.id);
      } catch (error) {
        console.error('Delete record failed:', error);
      }
    }
  };

  const handleTagToggle = (tag: string) => {
    setEditForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleAddCustomTag = () => {
    const trimmedTag = customTag.trim();
    if (trimmedTag && !editForm.tags.includes(trimmedTag)) {
      setEditForm((prev) => ({
        ...prev,
        tags: [...prev.tags, trimmedTag],
      }));
      setCustomTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setEditForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const visibleTags = record.tags.slice(0, 3);
  const hiddenTagCount = record.tags.length - 3;

  const tagStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 12px',
    borderRadius: '20px',
    backgroundColor: 'rgba(139, 90, 43, 0.12)',
    color: 'var(--color-accent)',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  return (
    <div
      className="list-item"
      style={{ cursor: 'pointer', overflow: 'hidden' }}
      onClick={handleToggleExpand}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '200px' }}>
          <div
            style={{
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease',
              fontSize: '12px',
              color: 'var(--color-text-light)',
            }}
          >
            ▶
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>
              {formatDate(record.date)}
              {bookTitle && <span style={{ color: 'var(--color-text-light)', marginLeft: '8px', fontWeight: 400 }}>· {bookTitle}</span>}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>
              第{record.startPage}-{record.endPage}页 · {record.duration}分钟
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {!isEditing && (
            <>
              {visibleTags.map((tag) => (
                <span key={tag} style={tagStyle}>
                  {tag}
                </span>
              ))}
              {hiddenTagCount > 0 && (
                <span style={tagStyle}>+{hiddenTagCount}</span>
              )}
            </>
          )}
        </div>
      </div>

      <div
        ref={contentRef}
        style={{
          maxHeight: isExpanded ? `${contentHeight}px` : '0px',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
        }}
      >
        <div style={{ paddingTop: '16px', borderTop: '1px solid var(--color-border)', marginTop: '16px' }}>
          {isEditing ? (
            <div className="edit-field" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">日期</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">起始页</label>
                  <input
                    type="number"
                    className="form-input"
                    min={1}
                    value={editForm.startPage}
                    onChange={(e) => setEditForm({ ...editForm, startPage: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">结束页</label>
                  <input
                    type="number"
                    className="form-input"
                    min={1}
                    value={editForm.endPage}
                    onChange={(e) => setEditForm({ ...editForm, endPage: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">阅读时长（分钟）</label>
                  <input
                    type="number"
                    className="form-input"
                    min={1}
                    value={editForm.duration}
                    onChange={(e) => setEditForm({ ...editForm, duration: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">标签</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {PRESET_TAGS.map((tag) => (
                    <span
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      style={{
                        ...tagStyle,
                        backgroundColor: editForm.tags.includes(tag)
                          ? 'var(--color-accent)'
                          : 'rgba(139, 90, 43, 0.12)',
                        color: editForm.tags.includes(tag)
                          ? '#fff'
                          : 'var(--color-accent)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="输入自定义标签"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTag()}
                    style={{ flex: 1 }}
                  />
                  <button className="btn btn-secondary btn-sm" onClick={handleAddCustomTag}>
                    添加
                  </button>
                </div>
                {editForm.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {editForm.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          ...tagStyle,
                          backgroundColor: 'var(--color-accent)',
                          color: '#fff',
                        }}
                      >
                        {tag}
                        <span onClick={() => handleRemoveTag(tag)} style={{ marginLeft: '4px' }}>×</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">笔记</label>
                <textarea
                  className="form-textarea"
                  placeholder="记录阅读感受..."
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={handleCancelEdit}>
                  取消
                </button>
                <button className="btn btn-primary" onClick={handleSaveEdit}>
                  保存
                </button>
              </div>
            </div>
          ) : (
            <>
              {record.notes && (
                <div
                  style={{
                    fontSize: '14px',
                    color: 'var(--color-text)',
                    lineHeight: 1.7,
                    marginBottom: '16px',
                    padding: '12px 16px',
                    backgroundColor: 'var(--color-input-bg)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {record.notes}
                </div>
              )}

              {record.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                  {record.tags.map((tag) => (
                    <span key={tag} style={tagStyle}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  className="action-btn btn btn-secondary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit();
                  }}
                >
                  编辑
                </button>
                <button
                  className="action-btn btn btn-danger btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                >
                  删除
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReadingRecordItem;

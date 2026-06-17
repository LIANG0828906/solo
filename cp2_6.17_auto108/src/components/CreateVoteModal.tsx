import { useState, useMemo, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { CreateVoteForm } from '../types';
import { getDeadlinePresets, getDefaultDeadline } from '../utils/time';

interface CreateVoteModalProps {
  onClose: () => void;
  onSubmit: (form: CreateVoteForm) => void;
}

export function CreateVoteModal({ onClose, onSubmit }: CreateVoteModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [deadlineType, setDeadlineType] = useState<string>('24小时');
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');

  const deadlinePresets = useMemo(() => getDeadlinePresets(), []);

  useEffect(() => {
    const now = new Date(Date.now() + 24 * 60 * 60 * 1000);
    setCustomDate(now.toISOString().split('T')[0]);
    setCustomTime(
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    );
  }, []);

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const computeDeadline = (): number => {
    if (deadlineType === '自定义') {
      return new Date(`${customDate}T${customTime}`).getTime();
    }
    const preset = deadlinePresets.find((p) => p.label === deadlineType);
    if (preset) return preset.value;
    return getDefaultDeadline();
  };

  const canSubmit = (): boolean => {
    if (!title.trim() || title.length > 30) return false;
    if (description.length > 100) return false;
    const validOptions = options.filter((o) => o.trim().length > 0);
    if (validOptions.length < 2) return false;
    if (options.some((o) => o.length > 50)) return false;
    const deadline = computeDeadline();
    if (isNaN(deadline) || deadline <= Date.now()) return false;
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit()) return;

    onSubmit({
      title,
      description,
      options: options.filter((o) => o.trim().length > 0),
      deadline: computeDeadline(),
    });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--overlay)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      className="animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-modal)',
          borderRadius: '16px',
          padding: '32px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
        }}
        className="animate-scale-fade"
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
          }}
        >
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            创建投票
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-component)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginBottom: '8px',
              }}
            >
              主题标题
              <span style={{ color: 'var(--accent-danger)' }}>*</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                {title.length}/30
              </span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 30))}
              placeholder="请输入投票主题"
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'var(--bg-component)',
                border: '1px solid var(--border-hover)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.3s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-hover)';
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginBottom: '8px',
              }}
            >
              描述（可选）
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                {description.length}/100
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 100))}
              placeholder="请输入描述信息"
              rows={3}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'var(--bg-component)',
                border: '1px solid var(--border-hover)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
                resize: 'none',
                transition: 'border-color 0.3s',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-hover)';
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginBottom: '8px',
              }}
            >
              投票选项
              <span style={{ color: 'var(--accent-danger)' }}>*</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                至少2个，最多6个
              </span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {options.map((opt, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(index, e.target.value.slice(0, 50))}
                    placeholder={`选项 ${index + 1}`}
                    style={{
                      width: '360px',
                      maxWidth: '100%',
                      flex: 1,
                      padding: '12px 16px',
                      backgroundColor: 'var(--bg-component)',
                      border: '1px solid var(--border-hover)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.3s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-hover)';
                    }}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      style={{
                        padding: '10px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: 'var(--accent-danger)',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 107, 107, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}

              {options.length < 6 && (
                <button
                  type="button"
                  onClick={addOption}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    backgroundColor: 'transparent',
                    border: '1px dashed var(--border-hover)',
                    borderRadius: '8px',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    alignSelf: 'flex-start',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    e.currentTarget.style.color = 'var(--accent-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-hover)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <Plus size={16} />
                  添加选项
                </button>
              )}
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginBottom: '8px',
              }}
            >
              截止时间
              <span style={{ color: 'var(--accent-danger)' }}>*</span>
            </label>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              {[...deadlinePresets.map((p) => ({ label: p.label, value: p.label })),
                { label: '自定义', value: '自定义' },
              ].map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setDeadlineType(preset.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: `1px solid ${
                      deadlineType === preset.value
                        ? 'var(--accent-primary)'
                        : 'var(--border-hover)'
                    }`,
                    backgroundColor:
                      deadlineType === preset.value
                        ? 'rgba(108, 99, 255, 0.15)'
                        : 'transparent',
                    color:
                      deadlineType === preset.value
                        ? 'var(--accent-primary)'
                        : 'var(--text-secondary)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => {
                    if (deadlineType !== preset.value) {
                      e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (deadlineType !== preset.value) {
                      e.currentTarget.style.borderColor = 'var(--border-hover)';
                    }
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {deadlineType === '自定义' && (
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    backgroundColor: 'var(--bg-component)',
                    border: '1px solid var(--border-hover)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.3s',
                    colorScheme: 'dark',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-hover)';
                  }}
                />
                <input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    backgroundColor: 'var(--bg-component)',
                    border: '1px solid var(--border-hover)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.3s',
                    colorScheme: 'dark',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-hover)';
                  }}
                />
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              marginTop: '8px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-default)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 24px',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-hover)',
                borderRadius: '8px',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--text-secondary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-hover)';
              }}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!canSubmit()}
              style={{
                padding: '10px 24px',
                backgroundColor: canSubmit()
                  ? 'var(--accent-primary)'
                  : 'var(--border-hover)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                cursor: canSubmit() ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.2s',
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                if (canSubmit()) {
                  e.currentTarget.style.backgroundColor =
                    'var(--accent-primary-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (canSubmit()) {
                  e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
                }
              }}
            >
                创建投票
              </button>
            </div>
        </form>
      </div>
    </div>
  );
}

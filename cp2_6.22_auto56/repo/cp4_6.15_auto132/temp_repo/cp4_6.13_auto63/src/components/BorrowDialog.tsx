import React, { useEffect, useState } from 'react';

export type BorrowDuration = 7 | 14 | 21;

export interface BorrowFormData {
  duration: BorrowDuration;
  reason: string;
}

interface BorrowDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: BorrowFormData) => void;
  bookTitle?: string;
}

const DURATION_OPTIONS: { value: BorrowDuration; label: string; desc: string }[] = [
  { value: 7, label: '7 天', desc: '短期阅读' },
  { value: 14, label: '14 天', desc: '常规周期' },
  { value: 21, label: '21 天', desc: '深度品读' },
];

const BorrowDialog: React.FC<BorrowDialogProps> = ({ open, onClose, onSubmit, bookTitle }) => {
  const [visible, setVisible] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [duration, setDuration] = useState<BorrowDuration | null>(null);
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<{ duration?: string; reason?: string }>({});

  useEffect(() => {
    if (open) {
      setVisible(true);
      setTimeout(() => setContentVisible(true), 50);
    } else {
      setContentVisible(false);
      setTimeout(() => setVisible(false), 200);
      setDuration(null);
      setReason('');
      setErrors({});
    }
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!visible) return null;

  const validate = (): boolean => {
    const nextErrors: typeof errors = {};
    if (!duration) {
      nextErrors.duration = '请选择借阅时长';
    }
    if (!reason.trim()) {
      nextErrors.reason = '请填写借阅理由';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ duration: duration as BorrowDuration, reason: reason.trim() });
  };

  const handleMaskClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const maskStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: contentVisible ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0)',
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease',
  };

  const cardStyle: React.CSSProperties = {
    width: 420,
    maxWidth: 'calc(100vw - 32px)',
    maxHeight: 'calc(100vh - 32px)',
    backgroundColor: '#FFFBF5',
    borderRadius: 16,
    boxShadow: contentVisible
      ? '0 20px 60px rgba(0, 0, 0, 0.25)'
      : '0 0 0 rgba(0, 0, 0, 0)',
    transform: contentVisible ? 'scale(1)' : 'scale(0.9)',
    opacity: contentVisible ? 1 : 0,
    transition: 'transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    padding: '20px 24px',
    borderBottom: '1px solid #E8D5C4',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 700,
    color: '#3E2723',
    margin: 0,
  };

  const closeBtnStyle: React.CSSProperties = {
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#8D6E63',
    fontSize: 20,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.15s ease',
  };

  const bodyStyle: React.CSSProperties = {
    padding: '20px 24px',
    overflowY: 'auto',
    flex: 1,
  };

  const bookInfoStyle: React.CSSProperties = {
    padding: '10px 14px',
    backgroundColor: '#F5E6D3',
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 13,
    color: '#5D4037',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: '#3E2723',
    margin: 0,
    marginBottom: 10,
  };

  const optionsWrapStyle: React.CSSProperties = {
    display: 'flex',
    gap: 10,
    marginBottom: 20,
  };

  const radioOptionStyle = (selected: boolean, hasError: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '14px 10px',
    borderRadius: 10,
    border: selected
      ? '2px solid #8D6E63'
      : hasError
      ? '2px solid #EF4444'
      : '2px solid #E8D5C4',
    backgroundColor: selected ? '#F5E6D3' : '#FFFFFF',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.15s ease',
  });

  const optionLabelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 16,
    color: '#3E2723',
    cursor: 'pointer',
    marginBottom: 2,
  };

  const optionDescStyle: React.CSSProperties = {
    fontSize: 11,
    color: '#8D6E63',
  };

  const textareaStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%',
    minHeight: 100,
    padding: 12,
    borderRadius: 10,
    border: hasError ? '2px solid #EF4444' : '2px solid #E8D5C4',
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    color: '#3E2723',
    resize: 'vertical',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    lineHeight: 1.5,
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  });

  const errorMsgStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
  };

  const footerStyle: React.CSSProperties = {
    padding: '16px 24px 20px',
    borderTop: '1px solid #E8D5C4',
    display: 'flex',
    gap: 12,
  };

  const baseBtnStyle: React.CSSProperties = {
    flex: 1,
    padding: '12px 0',
    borderRadius: 10,
    border: 'none',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease, transform 0.15s ease',
  };

  const cancelBtnStyle: React.CSSProperties = {
    ...baseBtnStyle,
    backgroundColor: '#F5E6D3',
    color: '#5D4037',
  };

  const submitBtnStyle: React.CSSProperties = {
    ...baseBtnStyle,
    backgroundColor: '#8D6E63',
    color: '#FFFFFF',
  };

  return (
    <div style={maskStyle} onClick={handleMaskClick}>
      <div style={cardStyle} role="dialog" aria-modal="true">
        <div style={headerStyle}>
          <h2 style={titleStyle}>申请借阅</h2>
          <button
            style={closeBtnStyle}
            onClick={onClose}
            aria-label="关闭"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F5E6D3')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={bodyStyle}>
            {bookTitle && (
              <div style={bookInfoStyle}>
                📚 借阅图书：《{bookTitle}》
              </div>
            )}

            <h3 style={sectionTitleStyle}>选择借阅时长 *</h3>
            <div style={optionsWrapStyle} role="radiogroup" aria-label="借阅时长">
              {DURATION_OPTIONS.map((opt) => {
                const selected = duration === opt.value;
                return (
                  <div
                    key={opt.value}
                    style={radioOptionStyle(selected, !!errors.duration)}
                    onClick={() => {
                      setDuration(opt.value);
                      if (errors.duration) {
                        setErrors((prev) => ({ ...prev, duration: undefined }));
                      }
                    }}
                    role="radio"
                    aria-checked={selected}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setDuration(opt.value);
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (!selected) {
                        e.currentTarget.style.borderColor = '#D7CCC8';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selected) {
                        e.currentTarget.style.borderColor = errors.duration ? '#EF4444' : '#E8D5C4';
                      }
                    }}
                  >
                    <label style={{ ...optionLabelStyle, fontWeight: selected ? 700 : 500 }}>
                      <input
                        type="radio"
                        name="duration"
                        value={opt.value}
                        checked={selected}
                        onChange={() => setDuration(opt.value)}
                        style={{ display: 'none' }}
                      />
                      {opt.label}
                    </label>
                    <div style={optionDescStyle}>{opt.desc}</div>
                  </div>
                );
              })}
            </div>
            {errors.duration && <div style={errorMsgStyle}>{errors.duration}</div>}

            <h3 style={{ ...sectionTitleStyle, marginTop: 20 }}>借阅理由 *</h3>
            <textarea
              style={textareaStyle(!!errors.reason)}
              placeholder="请说明您的借阅理由，例如：对该书非常感兴趣，希望能够仔细阅读..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errors.reason && e.target.value.trim()) {
                  setErrors((prev) => ({ ...prev, reason: undefined }));
                }
              }}
              onFocus={(e) => {
                if (!errors.reason) {
                  e.currentTarget.style.borderColor = '#8D6E63';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(141, 110, 99, 0.12)';
                }
              }}
              onBlur={(e) => {
                if (!errors.reason) {
                  e.currentTarget.style.borderColor = '#E8D5C4';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
              maxLength={500}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>{errors.reason && <div style={errorMsgStyle}>{errors.reason}</div>}</div>
              <div style={{ fontSize: 11, color: '#A1887F', marginTop: 6, flexShrink: 0 }}>
                {reason.length}/500
              </div>
            </div>
          </div>

          <div style={footerStyle}>
            <button
              type="button"
              style={cancelBtnStyle}
              onClick={onClose}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E8D5C4')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F5E6D3')}
            >
              取消
            </button>
            <button
              type="submit"
              style={submitBtnStyle}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#6D4C41')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#8D6E63')}
            >
              提交申请
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BorrowDialog;

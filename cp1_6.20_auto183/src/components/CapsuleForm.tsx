import React, { useState, useEffect } from 'react';
import { LatLng, formatDate } from '../utils/mapUtils';

interface CapsuleFormProps {
  visible: boolean;
  fadingOut: boolean;
  latLng?: LatLng;
  onSubmit: (text: string, imageUrl: string, openDate: string) => void;
  onCancel: () => void;
}

const CapsuleForm: React.FC<CapsuleFormProps> = ({
  visible,
  fadingOut,
  latLng,
  onSubmit,
  onCancel,
}) => {
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [openDate, setOpenDate] = useState('');
  const [errors, setErrors] = useState<{ text?: string; date?: string }>({});

  useEffect(() => {
    if (visible) {
      setText('');
      setImageUrl('');
      setErrors({});
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setOpenDate(tomorrow.toISOString().slice(0, 16));
    }
  }, [visible]);

  if (!visible) return null;

  const validate = (): boolean => {
    const newErrors: { text?: string; date?: string } = {};
    if (!text.trim()) {
      newErrors.text = '请写下你留给未来的话';
    } else if (text.trim().length < 5) {
      newErrors.text = '至少写5个字吧~';
    }
    if (!openDate) {
      newErrors.date = '请选择胶囊开启日期';
    } else if (new Date(openDate) <= new Date()) {
      newErrors.date = '开启日期必须在未来';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(text.trim(), imageUrl.trim(), openDate);
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(40,50,40,0.35)',
    backdropFilter: 'blur(3px)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    animation: fadingOut ? 'fadeOutUp 0.45s ease forwards' : 'fadeInUp 0.35s ease',
  };

  const formStyle: React.CSSProperties = {
    background: 'rgba(255, 252, 245, 0.88)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    borderRadius: '16px',
    padding: '28px 28px 24px',
    width: '100%',
    maxWidth: '460px',
    boxShadow: '0 20px 60px rgba(60,80,60,0.25), 0 0 0 1px rgba(255,255,255,0.5) inset',
    border: '1px solid rgba(93,107,79,0.15)',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '1.4rem',
    fontWeight: 700,
    color: '#5d6b4f',
    marginBottom: '6px',
    textAlign: 'center',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '0.82rem',
    color: '#8a9a7a',
    textAlign: 'center',
    marginBottom: '20px',
    lineHeight: 1.5,
  };

  const coordStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    gap: '14px',
    padding: '8px 14px',
    background: 'rgba(74,124,89,0.08)',
    borderRadius: '8px',
    fontSize: '0.78rem',
    color: '#5d6b4f',
    marginBottom: '18px',
    fontWeight: 500,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#5d6b4f',
    marginBottom: '6px',
    marginTop: '14px',
  };

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    border: '2px solid rgba(93,107,79,0.15)',
    borderRadius: '8px',
    fontSize: '0.92rem',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: '100px',
    maxHeight: '180px',
    background: 'rgba(255,255,255,0.7)',
    color: '#3d3d3d',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    lineHeight: 1.6,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    border: '2px solid rgba(93,107,79,0.15)',
    borderRadius: '8px',
    fontSize: '0.92rem',
    background: 'rgba(255,255,255,0.7)',
    color: '#3d3d3d',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    fontFamily: 'inherit',
  };

  const focusHandler = {
    onFocus: (e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      e.currentTarget.style.borderColor = '#6ba368';
      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(107,163,104,0.15)';
    },
    onBlur: (e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      e.currentTarget.style.borderColor = 'rgba(93,107,79,0.15)';
      e.currentTarget.style.boxShadow = 'none';
    },
  };

  const errorStyle: React.CSSProperties = {
    color: '#a86060',
    fontSize: '0.78rem',
    marginTop: '4px',
    fontWeight: 500,
  };

  const btnRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '10px',
    marginTop: '22px',
  };

  const cancelBtnStyle: React.CSSProperties = {
    flex: 1,
    padding: '12px 16px',
    border: '2px solid rgba(93,107,79,0.2)',
    borderRadius: '8px',
    background: 'transparent',
    color: '#5d6b4f',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const submitBtnStyle: React.CSSProperties = {
    flex: 1.5,
    padding: '12px 16px',
    border: 'none',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #4a7c59 0%, #6ba368 100%)',
    color: '#fafafa',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 14px rgba(74,124,89,0.3)',
  };

  return (
    <div style={overlayStyle} onClick={onCancel}>
      <form style={formStyle} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div style={titleStyle}>🕯️ 埋下时间胶囊</div>
        <div style={subtitleStyle}>
          写下一段给未来的话语，设定一个开启日期，<br />
          让时光替你保管这份记忆。
        </div>

        {latLng && (
          <div style={coordStyle}>
            <span>📍 {latLng.lat.toFixed(3)}°, {latLng.lng.toFixed(3)}°</span>
          </div>
        )}

        <label style={labelStyle}>
          💌 胶囊内容 <span style={{ color: '#a86060' }}>*</span>
          <span style={{ float: 'right', fontWeight: 400, color: '#a0a8a0', fontSize: '0.75rem' }}>
            {text.length}/500
          </span>
        </label>
        <textarea
          style={{ ...textareaStyle, ...(errors.text ? { borderColor: '#d89090' } : {}) }}
          placeholder="写下你想对未来说的话..."
          value={text}
          maxLength={500}
          onChange={(e) => setText(e.target.value)}
          {...focusHandler}
        />
        {errors.text && <div style={errorStyle}>{errors.text}</div>}

        <label style={labelStyle}>🖼️ 图片链接（可选）</label>
        <input
          style={inputStyle}
          type="url"
          placeholder="https://example.com/image.jpg"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          {...focusHandler}
        />

        <label style={labelStyle}>
          📅 开启日期 <span style={{ color: '#a86060' }}>*</span>
          {openDate && (
            <span style={{ float: 'right', fontWeight: 400, color: '#8a9a7a', fontSize: '0.78rem' }}>
              {formatDate(openDate)}
            </span>
          )}
        </label>
        <input
          style={{ ...inputStyle, ...(errors.date ? { borderColor: '#d89090' } : {}) }}
          type="datetime-local"
          value={openDate}
          min={new Date().toISOString().slice(0, 16)}
          onChange={(e) => setOpenDate(e.target.value)}
          {...focusHandler}
        />
        {errors.date && <div style={errorStyle}>{errors.date}</div>}

        <div style={btnRowStyle}>
          <button
            type="button"
            style={cancelBtnStyle}
            onClick={onCancel}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(93,107,79,0.06)';
              e.currentTarget.style.transform = 'scale(1.03)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            取消
          </button>
          <button
            type="submit"
            style={submitBtnStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.03)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(74,124,89,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(74,124,89,0.3)';
            }}
          >
            ✨ 埋下胶囊
          </button>
        </div>
      </form>
    </div>
  );
};

export default CapsuleForm;

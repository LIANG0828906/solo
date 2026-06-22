import React, { useState, useRef } from 'react';
import { EmotionType } from '../../shared/types';
import { useCapsuleStore } from '../stores/capsuleStore';
import { EMOTION_COLORS, EMOTION_LABELS, encodeImageToBase64 } from '../engine/capsuleEngine';

interface CapsuleCreateProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const CapsuleCreate: React.FC<CapsuleCreateProps> = ({ isCollapsed, onToggle }) => {
  const [text, setText] = useState('');
  const [emotion, setEmotion] = useState<EmotionType>('joy');
  const [openDate, setOpenDate] = useState('');
  const [openTime, setOpenTime] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createCapsule = useCapsuleStore((s) => s.createCapsule);
  const isLoading = useCapsuleStore((s) => s.isLoading);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('image/jpeg') && !file.type.includes('image/png')) {
      setError('只支持 JPG 和 PNG 格式图片');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('图片大小不能超过 2MB');
      return;
    }

    setError(null);
    const base64 = await encodeImageToBase64(file);
    setImageBase64(base64);
    setImagePreview(base64);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!text.trim()) {
      setError('请输入文字内容');
      return;
    }

    if (!openDate || !openTime) {
      setError('请选择开启日期和时间');
      return;
    }

    const openAt = new Date(`${openDate}T${openTime}`).getTime();
    if (openAt <= Date.now()) {
      setError('开启时间必须是未来时间');
      return;
    }

    try {
      await createCapsule({
        text: text.trim(),
        imageBase64,
        emotion,
        openAt,
      });
      setText('');
      setImageBase64(null);
      setImagePreview(null);
      setOpenDate('');
      setOpenTime('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const emotions: EmotionType[] = ['joy', 'sadness', 'nostalgia', 'anticipation', 'calm'];

  const content = (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h2 style={titleStyle}>创建情绪胶囊</h2>

      {error && <div style={errorStyle}>{error}</div>}

      <div style={fieldStyle}>
        <label style={labelStyle}>文字内容 (最多500字)</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 500))}
          style={textareaStyle}
          placeholder="写下你想封存的心情..."
          rows={6}
        />
        <span style={charCountStyle}>{text.length}/500</span>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>上传图片</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleImageUpload}
          style={fileInputStyle}
        />
        {imagePreview && (
          <div style={imagePreviewStyle}>
            <img src={imagePreview} alt="预览" style={previewImgStyle} />
            <button
              type="button"
              onClick={() => {
                setImageBase64(null);
                setImagePreview(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              style={removeImgBtnStyle}
            >
              移除
            </button>
          </div>
        )}
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>情绪标签</label>
        <div style={emotionButtonsStyle}>
          {emotions.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmotion(e)}
              style={{
                ...emotionBtnStyle,
                backgroundColor: EMOTION_COLORS[e],
                border: emotion === e ? '2px solid #fff' : '2px solid transparent',
              }}
              title={EMOTION_LABELS[e]}
            >
              {EMOTION_LABELS[e]}
            </button>
          ))}
        </div>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>开启时间</label>
        <div style={datetimeRowStyle}>
          <input
            type="date"
            value={openDate}
            onChange={(e) => setOpenDate(e.target.value)}
            style={dateInputStyle}
          />
          <input
            type="time"
            value={openTime}
            onChange={(e) => setOpenTime(e.target.value)}
            style={timeInputStyle}
            step="60"
          />
        </div>
      </div>

      <button type="submit" style={submitBtnStyle} disabled={isLoading}>
        {isLoading ? '创建中...' : '封存胶囊'}
      </button>
    </form>
  );

  if (typeof isCollapsed !== 'undefined') {
    return (
      <div style={mobileContainerStyle}>
        <div style={mobileHeaderStyle} onClick={onToggle}>
          <span style={mobileTitleStyle}>创建情绪胶囊</span>
          <span style={mobileToggleStyle}>{isCollapsed ? '▼' : '▲'}</span>
        </div>
        {!isCollapsed && content}
      </div>
    );
  }

  return <div style={containerStyle}>{content}</div>;
};

const containerStyle: React.CSSProperties = {
  width: '380px',
  height: '100vh',
  backgroundColor: '#1A1A3E',
  borderRight: '1px solid #2D2D5C',
  padding: '24px',
  overflowY: 'auto',
  boxSizing: 'border-box',
  position: 'fixed',
  left: 0,
  top: 0,
};

const mobileContainerStyle: React.CSSProperties = {
  backgroundColor: '#1A1A3E',
  borderBottom: '1px solid #2D2D5C',
};

const mobileHeaderStyle: React.CSSProperties = {
  padding: '16px 20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  cursor: 'pointer',
};

const mobileTitleStyle: React.CSSProperties = {
  color: '#E0E0E0',
  fontSize: '16px',
  fontWeight: 600,
};

const mobileToggleStyle: React.CSSProperties = {
  color: '#E0E0E0',
  fontSize: '12px',
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  animation: 'fadeInUp 0.5s ease-out',
};

const titleStyle: React.CSSProperties = {
  color: '#E0E0E0',
  fontSize: '22px',
  fontWeight: 600,
  margin: 0,
  marginBottom: '8px',
};

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const labelStyle: React.CSSProperties = {
  color: '#B0B0D0',
  fontSize: '14px',
  fontWeight: 500,
};

const textareaStyle: React.CSSProperties = {
  backgroundColor: '#0F0F23',
  border: '1px solid #2D2D5C',
  borderRadius: '8px',
  padding: '12px',
  color: '#E0E0E0',
  fontSize: '14px',
  resize: 'vertical',
  fontFamily: 'inherit',
  transition: 'border-color 0.3s ease-in-out',
  outline: 'none',
};

const charCountStyle: React.CSSProperties = {
  color: '#6B6B9C',
  fontSize: '12px',
  textAlign: 'right',
};

const fileInputStyle: React.CSSProperties = {
  color: '#B0B0D0',
  fontSize: '13px',
};

const imagePreviewStyle: React.CSSProperties = {
  position: 'relative',
  marginTop: '8px',
};

const previewImgStyle: React.CSSProperties = {
  width: '100%',
  maxHeight: '200px',
  objectFit: 'cover',
  borderRadius: '8px',
};

const removeImgBtnStyle: React.CSSProperties = {
  position: 'absolute',
  top: '8px',
  right: '8px',
  backgroundColor: 'rgba(0,0,0,0.7)',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  padding: '4px 10px',
  fontSize: '12px',
  cursor: 'pointer',
};

const emotionButtonsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
};

const emotionBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '20px',
  border: 'none',
  color: '#1A1A2E',
  fontWeight: 600,
  fontSize: '13px',
  cursor: 'pointer',
  transition: 'all 0.3s ease-in-out',
};

const datetimeRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
};

const dateInputStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: '#0F0F23',
  border: '1px solid #2D2D5C',
  borderRadius: '8px',
  padding: '10px 12px',
  color: '#E0E0E0',
  fontSize: '14px',
  outline: 'none',
  colorScheme: 'dark',
};

const timeInputStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: '#0F0F23',
  border: '1px solid #2D2D5C',
  borderRadius: '8px',
  padding: '10px 12px',
  color: '#E0E0E0',
  fontSize: '14px',
  outline: 'none',
  colorScheme: 'dark',
};

const submitBtnStyle: React.CSSProperties = {
  backgroundColor: '#4ECDC4',
  color: '#1A1A2E',
  border: 'none',
  borderRadius: '8px',
  padding: '14px',
  fontSize: '16px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.3s ease-in-out',
  marginTop: '8px',
};

const errorStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 107, 107, 0.2)',
  color: '#FF6B6B',
  padding: '10px 14px',
  borderRadius: '8px',
  fontSize: '13px',
  border: '1px solid rgba(255, 107, 107, 0.3)',
};

export default CapsuleCreate;

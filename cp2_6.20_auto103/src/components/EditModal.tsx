import { useState, useRef, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import { useMemoryStore } from '../store/memoryStore';
import type { Memory } from '../types';

interface Props {
  memory: Memory;
  onClose: () => void;
}

const EditModal = ({ memory, onClose }: Props) => {
  const updateMemory = useMemoryStore((s) => s.updateMemory);

  const [date, setDate] = useState(memory.date);
  const [title, setTitle] = useState(memory.title);
  const [description, setDescription] = useState(memory.description);
  const [lat, setLat] = useState(String(memory.lat));
  const [lng, setLng] = useState(String(memory.lng));
  const [imageUrl, setImageUrl] = useState(memory.imageUrl);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = useCallback(() => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    updateMemory(memory.id, {
      date: date || dayjs().format('YYYY-MM-DD'),
      title: title.trim() || '未命名记忆',
      description,
      lat: isNaN(latNum) ? 0 : latNum,
      lng: isNaN(lngNum) ? 0 : lngNum,
      imageUrl,
    });
    onClose();
  }, [memory.id, date, title, description, lat, lng, imageUrl, updateMemory, onClose]);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        for (let i = 0; i < e.dataTransfer.items.length; i++) {
          const item = e.dataTransfer.items[i];
          if (item.kind === 'file') {
            const f = item.getAsFile();
            if (f) {
              handleFile(f);
              break;
            }
          }
        }
      }
    },
    [handleFile]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const inputStyle = (focused: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '10px 14px',
    border: `2px solid ${focused ? '#40916c' : '#2d6a4f'}`,
    borderRadius: '10px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    backgroundColor: 'white',
    color: '#1a1a2e',
    fontFamily: 'inherit',
  });

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#2d6a4f',
    marginBottom: '6px',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '320px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: '16px', color: '#1a1a2e' }}>
            ✏️ 编辑记忆
          </span>
          <button
            onClick={onClose}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              border: 'none',
              background: '#f0f0f0',
              color: '#4a4a6a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ffe0e0';
              e.currentTarget.style.color = '#d63031';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f0f0f0';
              e.currentTarget.style.color = '#4a4a6a';
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>📅 日期</label>
            <FocusableInput
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>🏷️ 标题</label>
            <FocusableInput
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="给这段记忆起个名字"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>📝 描述</label>
            <FocusableTextarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="记录这段旅行的故事..."
              rows={3}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>📍 纬度</label>
              <FocusableInput
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="例如: 39.9042"
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>📍 经度</label>
              <FocusableInput
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="例如: 116.4074"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={labelStyle}>🖼️ 照片</label>
            {imageUrl ? (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  paddingTop: '75%',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: `2px solid ${isDragging ? '#40916c' : '#2d6a4f'}`,
                  backgroundColor: '#f8f8f8',
                }}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <img
                  src={imageUrl}
                  alt="预览"
                  loading="lazy"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <button
                  onClick={() => setImageUrl('')}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(214,48,49,0.9)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'rgba(45,106,79,0.9)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  更换图片
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  width: '100%',
                  padding: '32px 16px',
                  border: `2px dashed ${isDragging ? '#40916c' : '#2d6a4f'}`,
                  borderRadius: '10px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: isDragging ? '#f0fff4' : '#fafafa',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
                <div style={{ fontSize: '13px', color: '#4a4a6a', fontWeight: 600 }}>
                  点击或拖拽图片到此处
                </div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                  支持 JPG、PNG 格式
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>
        </div>

        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            gap: '10px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '10px',
              border: '2px solid #e5e5e5',
              background: 'white',
              color: '#4a4a6a',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#ccc';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e5e5';
            }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '10px',
              border: 'none',
              background: '#2d6a4f',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#40916c';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#2d6a4f';
            }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

interface FocusableProps {
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  step?: string;
  style: (focused: boolean) => React.CSSProperties;
}

const FocusableInput = ({ type, value, onChange, placeholder, step, style }: FocusableProps) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      step={step}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={style(focused)}
    />
  );
};

interface FocusableTextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  style: (focused: boolean) => React.CSSProperties;
}

const FocusableTextarea = ({ value, onChange, placeholder, rows, style }: FocusableTextareaProps) => {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{ ...style(focused), resize: 'vertical', minHeight: '72px' }}
    />
  );
};

export default EditModal;

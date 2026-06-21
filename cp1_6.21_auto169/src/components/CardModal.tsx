
import React, { useState, useEffect } from 'react';
import type { Card } from '../types/card';
import { COLOR_PALETTE } from '../types/card';

interface CardModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: Partial<Card>;
  onClose: () => void;
  onConfirm: (data: { title: string; content: string; color: string }) => void;
}

const CardModal: React.FC<CardModalProps> = ({
  isOpen,
  mode,
  initialData,
  onClose,
  onConfirm,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState(COLOR_PALETTE[0]);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || '');
      setContent(initialData?.content || '');
      setColor(initialData?.color || COLOR_PALETTE[0]);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!title.trim()) return;
    onConfirm({
      title: title.trim(),
      content: content.trim(),
      color,
    });
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        className="modal-content"
        style={{
          backgroundColor: '#1E293B',
          borderRadius: '12px',
          padding: '24px',
          width: '400px',
          maxWidth: '90vw',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        }}
      >
        <h2 style={{
          color: '#F8FAFC',
          fontSize: '18px',
          fontWeight: 600,
          marginBottom: '20px',
          fontFamily: 'Inter, sans-serif',
        }}>
          {mode === 'create' ? '创建灵感卡片' : '编辑灵感卡片'}
        </h2>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            color: '#CBD5E1',
            fontSize: '14px',
            marginBottom: '8px',
            fontFamily: 'Inter, sans-serif',
          }}>
            标题（最多30字）
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.substring(0, 30))}
            placeholder="输入卡片标题..."
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #334155',
              backgroundColor: '#0F172A',
              color: '#F8FAFC',
              fontSize: '14px',
              outline: 'none',
              fontFamily: 'Inter, sans-serif',
              boxSizing: 'border-box',
            }}
            maxLength={30}
            autoFocus
          />
          <div style={{
            textAlign: 'right',
            color: '#64748B',
            fontSize: '12px',
            marginTop: '4px',
          }}>
            {title.length}/30
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            color: '#CBD5E1',
            fontSize: '14px',
            marginBottom: '8px',
            fontFamily: 'Inter, sans-serif',
          }}>
            内容（最多200字）
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.substring(0, 200))}
            placeholder="输入卡片内容..."
            rows={4}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #334155',
              backgroundColor: '#0F172A',
              color: '#F8FAFC',
              fontSize: '14px',
              outline: 'none',
              fontFamily: 'Inter, sans-serif',
              resize: 'none',
              boxSizing: 'border-box',
            }}
            maxLength={200}
          />
          <div style={{
            textAlign: 'right',
            color: '#64748B',
            fontSize: '12px',
            marginTop: '4px',
          }}>
            {content.length}/200
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            color: '#CBD5E1',
            fontSize: '14px',
            marginBottom: '12px',
            fontFamily: 'Inter, sans-serif',
          }}>
            选择颜色
          </label>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: c,
                  border: color === c ? '3px solid #6366F1' : '2px solid #334155',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #334155',
              backgroundColor: 'transparent',
              color: '#CBD5E1',
              fontSize: '14px',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'background-color 0.2s',
            }}
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!title.trim()}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: title.trim() ? '#6366F1' : '#475569',
              color: '#FFFFFF',
              fontSize: '14px',
              cursor: title.trim() ? 'pointer' : 'not-allowed',
              fontFamily: 'Inter, sans-serif',
              transition: 'background-color 0.2s',
            }}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardModal;

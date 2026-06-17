import React, { useState, useEffect } from 'react';
import { Priority, useWishStore } from '../store';

interface CreateWishModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const addDays = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

export function CreateWishModal({ isOpen, onClose }: CreateWishModalProps) {
  const { addWish } = useWishStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState(addDays(30));
  const [priority, setPriority] = useState<Priority>('medium');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setTargetDate(addDays(30));
      setPriority('medium');
      setErrors({});
    }
  }, [isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) {
      newErrors.title = '请输入愿望标题';
    } else if (title.length > 50) {
      newErrors.title = '标题最多50字';
    }
    if (description.length > 200) {
      newErrors.description = '描述最多200字';
    }
    if (!targetDate) {
      newErrors.targetDate = '请选择目标日期';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    addWish({
      title: title.trim(),
      description: description.trim(),
      targetDate,
      priority
    });
    onClose();
  };

  if (!isOpen) return null;

  const priorityOptions: { value: Priority; label: string; color: string }[] = [
    { value: 'high', label: '高', color: '#E74C3C' },
    { value: 'medium', label: '中', color: '#F39C12' },
    { value: 'low', label: '低', color: '#27AE60' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 28,
          width: '90%',
          maxWidth: 440,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          animation: 'slideUp 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 600,
              color: '#2c3e50'
            }}
          >
            ✨ 创建新愿望
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: '#95a5a6',
              lineHeight: 1,
              padding: 4,
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#2c3e50')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#95a5a6')}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 500,
                color: '#34495e',
                marginBottom: 8
              }}
            >
              愿望标题 <span style={{ color: '#E74C3C' }}>*</span>
              <span
                style={{
                  float: 'right',
                  fontSize: 12,
                  color: title.length > 50 ? '#E74C3C' : '#95a5a6',
                  fontWeight: 400
                }}
              >
                {title.length}/50
              </span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：学习React高级技巧"
              maxLength={50}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: `1px solid ${errors.title ? '#E74C3C' : '#dfe6e9'}`,
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxSizing: 'border-box',
                backgroundColor: '#fff'
              }}
              onFocus={(e) => {
                if (!errors.title) {
                  e.currentTarget.style.borderColor = '#6C63FF';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(108, 99, 255, 0.1)';
                }
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = errors.title ? '#E74C3C' : '#dfe6e9';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {errors.title && (
              <p style={{ margin: '6px 0 0', fontSize: 12, color: '#E74C3C' }}>
                {errors.title}
              </p>
            )}
          </div>

          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 500,
                color: '#34495e',
                marginBottom: 8
              }}
            >
              愿望描述
              <span
                style={{
                  float: 'right',
                  fontSize: 12,
                  color: description.length > 200 ? '#E74C3C' : '#95a5a6',
                  fontWeight: 400
                }}
              >
                {description.length}/200
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="详细描述你的愿望（可选）"
              maxLength={200}
              rows={4}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: `1px solid ${errors.description ? '#E74C3C' : '#dfe6e9'}`,
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
                resize: 'vertical',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                backgroundColor: '#fff'
              }}
              onFocus={(e) => {
                if (!errors.description) {
                  e.currentTarget.style.borderColor = '#6C63FF';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(108, 99, 255, 0.1)';
                }
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = errors.description ? '#E74C3C' : '#dfe6e9';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {errors.description && (
              <p style={{ margin: '6px 0 0', fontSize: 12, color: '#E74C3C' }}>
                {errors.description}
              </p>
            )}
          </div>

          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 500,
                color: '#34495e',
                marginBottom: 8
              }}
            >
              目标完成日期 <span style={{ color: '#E74C3C' }}>*</span>
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: `1px solid ${errors.targetDate ? '#E74C3C' : '#dfe6e9'}`,
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxSizing: 'border-box',
                backgroundColor: '#fff'
              }}
              onFocus={(e) => {
                if (!errors.targetDate) {
                  e.currentTarget.style.borderColor = '#6C63FF';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(108, 99, 255, 0.1)';
                }
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = errors.targetDate ? '#E74C3C' : '#dfe6e9';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {errors.targetDate && (
              <p style={{ margin: '6px 0 0', fontSize: 12, color: '#E74C3C' }}>
                {errors.targetDate}
              </p>
            )}
          </div>

          <div style={{ marginBottom: 28 }}>
            <label
              style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 500,
                color: '#34495e',
                marginBottom: 12
              }}
            >
              优先级
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              {priorityOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: `2px solid ${priority === opt.value ? opt.color : '#dfe6e9'}`,
                    borderRadius: 8,
                    backgroundColor: priority === opt.value ? `${opt.color}10` : '#fff',
                    color: opt.color,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: opt.color,
                      display: 'inline-block'
                    }}
                  />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px 20px',
                border: '1px solid #dfe6e9',
                borderRadius: 8,
                backgroundColor: '#fff',
                color: '#636e72',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#fff';
              }}
            >
              取消
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '12px 20px',
                border: 'none',
                borderRadius: 8,
                backgroundColor: '#6C63FF',
                color: '#fff',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5A52D5';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6C63FF';
              }}
            >
              创建愿望
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

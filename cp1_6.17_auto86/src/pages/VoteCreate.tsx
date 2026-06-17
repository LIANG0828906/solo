import React, { useState } from 'react';
import { useVoteStore } from '../store/voteStore';

export default function VoteCreate({
  onCreated,
  onBack,
}: {
  onCreated: () => void;
  onBack: () => void;
}) {
  const createVote = useVoteStore((s) => s.createVote);
  const loading = useVoteStore((s) => s.loading);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState('');

  const addOption = () => {
    if (options.length >= 10) return;
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    const next = [...options];
    next[index] = value.slice(0, 50);
    setOptions(next);
  };

  const handleSubmit = async () => {
    setError('');

    if (!title.trim()) {
      setError('请输入投票标题');
      return;
    }
    if (title.length > 50) {
      setError('标题不能超过50个字符');
      return;
    }
    const filled = options.filter((o) => o.trim());
    if (filled.length < 2) {
      setError('至少需要2个有效选项');
      return;
    }

    try {
      await createVote(title.trim(), description.trim(), filled);
      onCreated();
    } catch {
      setError('创建失败，请重试');
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#6C63FF',
              fontSize: '16px',
              cursor: 'pointer',
              marginRight: 12,
              padding: '4px 8px',
            }}
          >
            ← 返回
          </button>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#2C3E50' }}>
            创建新投票
          </h2>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 600,
              color: '#495057',
              marginBottom: 6,
            }}
          >
            投票标题 <span style={{ color: '#E74C3C' }}>*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 50))}
            placeholder="输入投票标题（最多50字）"
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1.5px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '15px',
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#6C63FF')}
            onBlur={(e) => (e.target.style.borderColor = '#D1D5DB')}
          />
          <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: 4, textAlign: 'right' }}>
            {title.length}/50
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 600,
              color: '#495057',
              marginBottom: 6,
            }}
          >
            投票描述
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="添加描述（支持换行）"
            rows={3}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1.5px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '15px',
              outline: 'none',
              resize: 'vertical',
              transition: 'border-color 0.2s ease',
              lineHeight: 1.5,
            }}
            onFocus={(e) => (e.target.style.borderColor = '#6C63FF')}
            onBlur={(e) => (e.target.style.borderColor = '#D1D5DB')}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 600,
              color: '#495057',
              marginBottom: 6,
            }}
          >
            投票选项 <span style={{ color: '#E74C3C' }}>*</span>
          </label>
          {options.map((opt, i) => (
            <div
              key={i}
              className="option-enter"
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 8,
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: '#6C63FF20',
                  color: '#6C63FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <input
                type="text"
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                placeholder={`选项 ${i + 1}`}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  border: '1.5px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#6C63FF')}
                onBlur={(e) => (e.target.style.borderColor = '#D1D5DB')}
              />
              {options.length > 2 && (
                <button
                  onClick={() => removeOption(i)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#E74C3C',
                    fontSize: '18px',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {options.length < 10 && (
            <button
              onClick={addOption}
              style={{
                background: '#6C63FF10',
                border: '1.5px dashed #6C63FF50',
                borderRadius: '8px',
                padding: '8px 16px',
                color: '#6C63FF',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
                marginTop: 4,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = '#6C63FF20';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = '#6C63FF10';
              }}
            >
              + 添加选项
            </button>
          )}
        </div>

        {error && (
          <div
            style={{
              background: '#FEE2E2',
              color: '#DC2626',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '14px',
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: loading ? '#9CA3AF' : '#6C63FF',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              (e.target as HTMLElement).style.background = '#5A52D5';
              (e.target as HTMLElement).style.transform = 'scale(1.02)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              (e.target as HTMLElement).style.background = '#6C63FF';
              (e.target as HTMLElement).style.transform = 'scale(1)';
            }
          }}
        >
          {loading ? '提交中...' : '创建投票'}
        </button>
      </div>
    </div>
  );
}

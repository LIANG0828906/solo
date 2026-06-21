import { useState } from 'react';

interface VoteCreatorProps {
  onCreate: (data: { title: string; options: string[]; duration: number }) => void;
  onClose: () => void;
}

const durationOptions = [
  { label: '30分钟', value: 30 },
  { label: '1小时', value: 60 },
  { label: '2小时', value: 120 },
  { label: '6小时', value: 360 },
  { label: '12小时', value: 720 },
  { label: '1天', value: 1440 },
  { label: '3天', value: 4320 },
  { label: '7天', value: 10080 },
];

export default function VoteCreator({ onCreate, onClose }: VoteCreatorProps) {
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [duration, setDuration] = useState(1440);

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const addOption = () => {
    if (options.length >= 10) return;
    setOptions((prev) => [...prev, '']);
  };

  const isValid = title.trim() !== '' && options.every((o) => o.trim() !== '');

  const handleSubmit = () => {
    if (!isValid) return;
    onCreate({
      title: title.trim(),
      options: options.map((o) => o.trim()),
      duration,
    });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 16,
          width: '100%',
          maxWidth: 520,
          padding: 32,
          position: 'relative',
          color: '#333',
        }}
      >
        <span
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 20,
            fontSize: 24,
            cursor: 'pointer',
            color: '#999',
            lineHeight: 1,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#333')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#999')}
        >
          ×
        </span>

        <h2 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 600 }}>
          新建投票
        </h2>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
            <span>投票标题</span>
            <span style={{ color: '#999' }}>{title.length}/50</span>
          </div>
          <input
            type="text"
            placeholder="请输入投票标题"
            value={title}
            maxLength={50}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: 8,
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 6, fontSize: 14 }}>投票选项</div>
          {options.map((opt, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 8, gap: 8 }}>
              <input
                type="text"
                placeholder={`选项 ${i + 1}`}
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <span
                onClick={() => removeOption(i)}
                style={{
                  cursor: options.length <= 2 ? 'not-allowed' : 'pointer',
                  color: options.length <= 2 ? '#ccc' : '#999',
                  fontSize: 18,
                  lineHeight: 1,
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  if (options.length > 2) e.currentTarget.style.color = '#333';
                }}
                onMouseLeave={(e) => {
                  if (options.length > 2) e.currentTarget.style.color = '#999';
                }}
              >
                ×
              </span>
            </div>
          ))}
          {options.length < 10 && (
            <button
              onClick={addOption}
              style={{
                background: 'none',
                border: '1px dashed #2196F3',
                color: '#2196F3',
                padding: '8px 0',
                width: '100%',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              添加选项
            </button>
          )}
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 6, fontSize: 14 }}>投票时长</div>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: 8,
              fontSize: 14,
              outline: 'none',
              background: '#fff',
            }}
          >
            {durationOptions.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!isValid}
          style={{
            width: '100%',
            background: isValid ? '#2196F3' : '#b0bec5',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '12px 0',
            fontSize: 16,
            fontWeight: 500,
            cursor: isValid ? 'pointer' : 'not-allowed',
          }}
        >
          创建投票
        </button>
      </div>
    </div>
  );
}

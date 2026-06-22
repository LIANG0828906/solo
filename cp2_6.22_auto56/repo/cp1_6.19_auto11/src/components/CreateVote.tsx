import { useState } from 'react';

interface CreateVoteProps {
  onCreate: (data: { title: string; options: string[]; duration: number }) => void;
}

export function CreateVote({ onCreate }: CreateVoteProps) {
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [duration, setDuration] = useState(60);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = '请输入投票标题';
    }

    const validOptions = options.filter((o) => o.trim());
    if (validOptions.length < 2) {
      newErrors.options = '至少需要2个有效选项';
    }

    if (duration < 10 || duration > 300) {
      newErrors.duration = '时长必须在10-300秒之间';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onCreate({
        title: title.trim(),
        options: options.filter((o) => o.trim()).map((o) => o.trim()),
        duration: Number(duration),
      });
      setTitle('');
      setOptions(['', '']);
      setDuration(60);
      setErrors({});
    }
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h2 style={titleStyle}>创建投票</h2>

      <div style={fieldStyle}>
        <label style={labelStyle}>投票标题</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="请输入投票标题..."
          style={{ ...inputStyle, ...(errors.title ? errorBorder : {}) }}
          maxLength={100}
        />
        {errors.title && <span style={errorStyle}>{errors.title}</span>}
      </div>

      <div style={fieldStyle}>
        <div style={labelRowStyle}>
          <label style={labelStyle}>
            选项列表 <span style={mutedStyle}>({options.length}/6)</span>
          </label>
          {options.length < 6 && (
            <button type="button" onClick={handleAddOption} style={addBtnStyle}>
              + 添加选项
            </button>
          )}
        </div>
        {errors.options && <span style={errorStyle}>{errors.options}</span>}
        <div style={optionsListStyle}>
          {options.map((opt, index) => (
            <div key={index} style={optionRowStyle}>
              <span style={optionIndexStyle}>{index + 1}.</span>
              <input
                type="text"
                value={opt}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`选项 ${index + 1}`}
                style={inputStyle}
                maxLength={200}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveOption(index)}
                  style={removeBtnStyle}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>
          投票时长: <span style={accentTextStyle}>{duration}秒</span>
        </label>
        <div style={sliderRowStyle}>
          <input
            type="range"
            min="10"
            max="300"
            step="5"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            style={sliderStyle}
          />
          <input
            type="number"
            min="10"
            max="300"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            style={numberInputStyle}
          />
        </div>
        {errors.duration && <span style={errorStyle}>{errors.duration}</span>}
        <div style={hintStyle}>提示: 10秒 - 300秒（5分钟）</div>
      </div>

      <button type="submit" style={submitBtnStyle}>
        创建投票
      </button>
    </form>
  );
}

const formStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius)',
  padding: '24px',
  boxShadow: 'var(--shadow)',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  animation: 'fadeIn 0.3s ease-out',
};

const titleStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 700,
  color: 'var(--text-primary)',
  marginBottom: '4px',
};

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--text-secondary)',
};

const labelRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  padding: '12px 16px',
  color: 'var(--text-primary)',
  fontSize: '14px',
  transition: 'all 0.2s ease',
  flex: 1,
};

const errorBorder: React.CSSProperties = {
  borderColor: '#ef4444',
};

const numberInputStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  padding: '8px 12px',
  color: 'var(--text-primary)',
  fontSize: '14px',
  width: '80px',
  textAlign: 'center',
};

const optionsListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const optionRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const optionIndexStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: '14px',
  fontWeight: 600,
  width: '20px',
  flexShrink: 0,
};

const addBtnStyle: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--accent)',
  fontSize: '13px',
  fontWeight: 600,
  padding: '6px 12px',
  borderRadius: '6px',
  transition: 'all 0.2s ease',
};

const removeBtnStyle: React.CSSProperties = {
  background: 'rgba(239, 68, 68, 0.1)',
  color: '#ef4444',
  width: '32px',
  height: '32px',
  borderRadius: '6px',
  fontSize: '18px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
  flexShrink: 0,
};

const sliderRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
};

const sliderStyle: React.CSSProperties = {
  flex: 1,
  accentColor: 'var(--accent)',
  height: '6px',
  cursor: 'pointer',
};

const errorStyle: React.CSSProperties = {
  color: '#ef4444',
  fontSize: '12px',
  fontWeight: 500,
};

const hintStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: '12px',
};

const mutedStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontWeight: 400,
};

const accentTextStyle: React.CSSProperties = {
  color: 'var(--accent)',
  fontWeight: 700,
};

const submitBtnStyle: React.CSSProperties = {
  background: 'var(--accent-gradient)',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600,
  padding: '14px 24px',
  borderRadius: '8px',
  transition: 'all 0.2s ease',
  marginTop: '8px',
};

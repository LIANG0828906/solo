import React, { useState } from 'react';

interface CreatePollProps {
  onCreate: (title: string, description: string, options: string[], deadline: number | null) => void;
  onBack: () => void;
}

const containerStyles: React.CSSProperties = {
  minHeight: '100vh',
  padding: '40px 20px',
  maxWidth: '680px',
  margin: '0 auto',
};

const headerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '32px',
};

const backBtnStyles: React.CSSProperties = {
  width: '44px',
  height: '44px',
  borderRadius: '12px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '20px',
  transition: 'all 200ms ease',
  color: 'var(--text-primary)',
};

const headerTitleStyles: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 700,
};

const cardStyles: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: '20px',
  padding: '32px',
  border: '1px solid var(--border-color)',
  animation: 'fadeInUp 0.5s ease-out',
};

const labelStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: '8px',
  marginTop: '20px',
};

const inputBaseStyles: React.CSSProperties = {
  width: '100%',
  padding: '14px 18px',
  background: 'rgba(15, 23, 42, 0.6)',
  border: '2px solid var(--border-color)',
  borderRadius: '12px',
  color: 'var(--text-primary)',
  fontSize: '16px',
  transition: 'border-color 200ms ease, box-shadow 200ms ease',
};

const textareaStyles: React.CSSProperties = {
  ...inputBaseStyles,
  resize: 'vertical',
  minHeight: '80px',
  lineHeight: 1.6,
};

const optionRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  alignItems: 'center',
  marginTop: '10px',
};

const optionInputStyles: React.CSSProperties = {
  ...inputBaseStyles,
  marginTop: 0,
  flex: 1,
};

const removeBtnStyles: React.CSSProperties = {
  width: '44px',
  height: '44px',
  borderRadius: '12px',
  background: 'rgba(239, 68, 68, 0.15)',
  color: '#ef4444',
  fontSize: '18px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'all 200ms ease',
};

const addBtnStyles: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  marginTop: '12px',
  borderRadius: '12px',
  background: 'rgba(59, 130, 246, 0.1)',
  border: '2px dashed rgba(59, 130, 246, 0.4)',
  color: 'var(--accent-blue)',
  fontSize: '15px',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  transition: 'all 200ms ease',
};

const submitBtnStyles: React.CSSProperties = {
  width: '100%',
  padding: '16px 24px',
  marginTop: '28px',
  background: 'var(--accent-orange)',
  color: 'white',
  fontSize: '16px',
  fontWeight: 600,
  borderRadius: '12px',
  transition: 'all 200ms ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
};

const sectionTitleStyles: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 700,
  marginTop: '28px',
  marginBottom: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const errorMsgStyles: React.CSSProperties = {
  color: '#ef4444',
  fontSize: '13px',
  marginTop: '8px',
  minHeight: '18px',
};

const hintTextStyles: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: '13px',
  marginTop: '6px',
};

const CreatePoll: React.FC<CreatePollProps> = ({ onCreate, onBack }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
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
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('请输入投票标题');
      return;
    }

    const validOptions = options.filter((o) => o.trim().length > 0);
    if (validOptions.length < 2) {
      setError('至少需要2个有效选项');
      return;
    }
    if (validOptions.length > 10) {
      setError('最多只能有10个选项');
      return;
    }

    let deadline: number | null = null;
    if (deadlineDate && deadlineTime) {
      deadline = new Date(`${deadlineDate}T${deadlineTime}`).getTime();
      if (deadline <= Date.now()) {
        setError('截止时间必须晚于当前时间');
        return;
      }
    }

    setError('');
    onCreate(trimmedTitle, description, validOptions, deadline);
  };

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <button
          style={backBtnStyles}
          onClick={onBack}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-card-hover)';
            e.currentTarget.style.borderColor = 'var(--accent-blue)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-card)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
        >
          ←
        </button>
        <h1 style={headerTitleStyles}>创建投票</h1>
      </div>

      <div style={cardStyles}>
        <div>
          <label style={labelStyles}>投票标题 *</label>
          <input
            style={inputBaseStyles}
            type="text"
            placeholder="例如：团建地点投票"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-blue)';
              e.currentTarget.style.animation = 'breathe 2s infinite alternate';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.animation = 'none';
            }}
          />
        </div>

        <div>
          <label style={labelStyles}>投票描述（选填）</label>
          <textarea
            style={textareaStyles}
            placeholder="补充说明投票背景或注意事项..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-blue)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          />
        </div>

        <div>
          <h3 style={sectionTitleStyles}>
            <span>📋</span>
            <span>投票选项</span>
          </h3>
          <p style={hintTextStyles}>至少2个，最多10个选项</p>
          {options.map((opt, index) => (
            <div key={index} style={optionRowStyles}>
              <span
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '14px',
                  fontWeight: 600,
                  width: '24px',
                  textAlign: 'center',
                }}
              >
                {index + 1}.
              </span>
              <input
                style={optionInputStyles}
                type="text"
                placeholder={`选项 ${index + 1}`}
                value={opt}
                onChange={(e) => updateOption(index, e.target.value)}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-blue)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              />
              {options.length > 2 && (
                <button
                  style={removeBtnStyles}
                  onClick={() => removeOption(index)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {options.length < 10 && (
            <button
              style={addBtnStyles}
              onClick={addOption}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                e.currentTarget.style.borderColor = 'var(--accent-blue)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
              }}
            >
              <span>+</span>
              <span>添加选项</span>
            </button>
          )}
        </div>

        <div>
          <h3 style={sectionTitleStyles}>
            <span>⏰</span>
            <span>截止时间（选填）</span>
          </h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              style={{ ...inputBaseStyles, flex: 1 }}
              type="date"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-blue)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            />
            <input
              style={{ ...inputBaseStyles, flex: 1 }}
              type="time"
              value={deadlineTime}
              onChange={(e) => setDeadlineTime(e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-blue)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            />
          </div>
        </div>

        <div style={errorMsgStyles}>{error}</div>

        <button
          style={submitBtnStyles}
          onClick={handleSubmit}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(249,115,22,0.3)';
            e.currentTarget.style.background = 'var(--accent-orange-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.background = 'var(--accent-orange)';
          }}
        >
          <span>✨</span>
          <span>创建投票</span>
        </button>
      </div>
    </div>
  );
};

export default CreatePoll;

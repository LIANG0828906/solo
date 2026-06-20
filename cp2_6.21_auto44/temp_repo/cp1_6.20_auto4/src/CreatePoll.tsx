import React, { useState } from 'react';

interface CreatePollProps {
  onCreated: (pollId: string) => void;
}

const CreatePoll: React.FC<CreatePollProps> = ({ onCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [type, setType] = useState<'single' | 'multiple'>('single');
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const validOptions = options.filter((opt) => opt.trim() !== '');
    if (validOptions.length < 2) {
      setError('请至少填写2个选项');
      setLoading(false);
      return;
    }

    if (!title.trim()) {
      setError('请输入投票标题');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          options: validOptions,
          type,
          deadline: hasDeadline ? deadline : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '创建失败');
      }

      onCreated(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-poll">
      <div className="card">
        <h1>创建投票</h1>
        <p className="subtitle">快速创建一个投票，生成链接即可分享</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="title">投票标题 *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入投票标题"
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">投票描述</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入投票描述（可选）"
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="form-group">
            <label>投票类型</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="type"
                  value="single"
                  checked={type === 'single'}
                  onChange={() => setType('single')}
                />
                <span>单选</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="type"
                  value="multiple"
                  checked={type === 'multiple'}
                  onChange={() => setType('multiple')}
                />
                <span>多选</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>投票选项 *</label>
            {options.map((option, index) => (
              <div key={index} className="option-input">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`选项 ${index + 1}`}
                  maxLength={200}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    className="btn btn-danger remove-btn"
                    onClick={() => removeOption(index)}
                  >
                    删除
                  </button>
                )}
              </div>
            ))}
            {options.length < 10 && (
              <button type="button" className="btn btn-secondary add-btn" onClick={addOption}>
                + 添加选项
              </button>
            )}
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={hasDeadline}
                onChange={(e) => setHasDeadline(e.target.checked)}
              />
              <span>设置截止时间</span>
            </label>
            {hasDeadline && (
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="deadline-input"
              />
            )}
          </div>

          <button type="submit" className="btn btn-primary submit-btn" disabled={loading}>
            {loading ? '创建中...' : '创建投票'}
          </button>
        </form>
      </div>

      <style>{`
        .create-poll .subtitle {
          color: #666;
          margin-bottom: 24px;
          font-size: 14px;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .error-message {
          background: #ffebee;
          color: #c62828;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .radio-group {
          display: flex;
          gap: 24px;
        }

        .radio-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-weight: normal;
          margin-bottom: 0;
        }

        .radio-label input[type="radio"] {
          width: auto;
          margin: 0;
        }

        .option-input {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }

        .option-input input {
          flex: 1;
        }

        .remove-btn {
          padding: 10px 16px;
          white-space: nowrap;
        }

        .add-btn {
          width: 100%;
          margin-top: 4px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-weight: normal;
          margin-bottom: 0;
        }

        .checkbox-label input[type="checkbox"] {
          width: auto;
          margin: 0;
        }

        .deadline-input {
          margin-top: 8px;
        }

        .submit-btn {
          width: 100%;
          padding: 14px;
          font-size: 16px;
          margin-top: 8px;
        }

        textarea {
          resize: vertical;
          font-family: inherit;
        }
      `}</style>
    </div>
  );
};

export default CreatePoll;

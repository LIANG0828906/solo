import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { voteApi } from '../api/voteApi';

interface FormState {
  title: string;
  options: string[];
  deadline: string;
}

interface FormErrors {
  title?: string;
  options?: string;
  deadline?: string;
}

export default function CreateVote() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({
    title: '',
    options: ['', '', ''],
    deadline: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = useMemo(() => {
    return (data: FormState): FormErrors => {
      const newErrors: FormErrors = {};

      if (!data.title.trim()) {
        newErrors.title = '请输入投票标题';
      }

      const validOptions = data.options.filter((o) => o.trim());
      if (validOptions.length < 3) {
        newErrors.options = '至少需要3个有效选项';
      }

      if (!data.deadline) {
        newErrors.deadline = '请设置投票截止时间';
      } else {
        const deadlineTime = new Date(data.deadline).getTime();
        if (deadlineTime <= Date.now()) {
          newErrors.deadline = '截止时间必须在未来';
        }
      }

      return newErrors;
    };
  }, []);

  useEffect(() => {
    setErrors(validate(form));
  }, [form, validate]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, title: e.target.value }));
  };

  const handleDeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, deadline: e.target.value }));
  };

  const handleOptionChange = (index: number, value: string) => {
    setForm((prev) => {
      const newOptions = [...prev.options];
      newOptions[index] = value;
      return { ...prev, options: newOptions };
    });
  };

  const addOption = () => {
    setForm((prev) => ({ ...prev, options: [...prev.options, ''] }));
  };

  const removeOption = (index: number) => {
    if (form.options.length <= 3) return;
    setForm((prev) => {
      const newOptions = prev.options.filter((_, i) => i !== index);
      return { ...prev, options: newOptions };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const validOptions = form.options
        .filter((o) => o.trim())
        .map((o) => o.trim());
      const deadline = new Date(form.deadline).getTime();

      const result = await voteApi.createVote({
        title: form.title.trim(),
        options: validOptions,
        deadline,
      });

      navigate(`/vote/${result.id}?voterId=${uuidv4()}`);
    } catch (error) {
      console.error('创建投票失败:', error);
      alert('创建投票失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = Object.keys(errors).length === 0;

  return (
    <div>
      <h1 className="page-title">创建新投票</h1>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">投票标题</label>
            <input
              type="text"
              className={`input ${errors.title ? 'error' : ''}`}
              value={form.title}
              onChange={handleTitleChange}
              placeholder="请输入投票标题"
            />
            {errors.title && <div className="error-text">{errors.title}</div>}
          </div>

          <div className="form-group">
            <label className="label">
              投票选项 ({form.options.filter((o) => o.trim()).length} 个有效)
            </label>
            {form.options.map((option, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: index < form.options.length - 1 ? '10px' : '0',
                }}
              >
                <input
                  type="text"
                  className={`input ${errors.options ? 'error' : ''}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`选项 ${index + 1}`}
                />
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => removeOption(index)}
                  disabled={form.options.length <= 3}
                  style={{ padding: '12px 16px', minWidth: 'auto' }}
                >
                  删除
                </button>
              </div>
            ))}
            {errors.options && <div className="error-text">{errors.options}</div>}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={addOption}
              style={{ marginTop: '12px', width: '100%' }}
            >
              + 添加选项
            </button>
          </div>

          <div className="form-group">
            <label className="label">投票截止时间</label>
            <input
              type="datetime-local"
              className={`input ${errors.deadline ? 'error' : ''}`}
              value={form.deadline}
              onChange={handleDeadlineChange}
            />
            {errors.deadline && (
              <div className="error-text">{errors.deadline}</div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={!isFormValid || submitting}
            style={{ width: '100%' }}
          >
            {submitting ? '创建中...' : '创建投票'}
          </button>
        </form>
      </div>
    </div>
  );
}

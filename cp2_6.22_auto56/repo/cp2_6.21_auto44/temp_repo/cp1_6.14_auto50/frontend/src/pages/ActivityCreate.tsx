import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Blessing {
  id: string;
  nickname: string;
  content: string;
  mediaType?: 'image' | 'video';
  mediaData?: string;
  likes: number;
  createdAt: string;
}

interface Activity {
  id: string;
  birthdayPerson: string;
  birthdayDate: string;
  deadline: string;
  isPublic: boolean;
  creatorToken: string;
  createdAt: string;
  blessings: Blessing[];
}

const STEPS = [
  { title: '基本信息', icon: '📝' },
  { title: '日期时间', icon: '📅' },
  { title: '可见性设置', icon: '🌍' },
];

export default function ActivityCreate() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [submitting, setSubmitting] = useState(false);
  const [createdActivity, setCreatedActivity] = useState<Activity | null>(null);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    birthdayPerson: '',
    birthdayDate: '',
    deadline: '',
    isPublic: true,
  });

  const updateForm = (field: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateStep = (s: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (s === 0) {
      if (!form.birthdayPerson.trim()) {
        newErrors.birthdayPerson = '请输入寿星姓名';
      }
    }

    if (s === 1) {
      if (!form.birthdayDate) {
        newErrors.birthdayDate = '请选择生日日期';
      }
      if (!form.deadline) {
        newErrors.deadline = '请选择截止时间';
      } else {
        const deadlineDate = new Date(form.deadline);
        const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
        if (deadlineDate < oneHourFromNow) {
          newErrors.deadline = '截止时间必须至少在1小时之后';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setDirection('forward');
    setStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setDirection('backward');
    setStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;
    setSubmitting(true);
    try {
      const res = await axios.post<Activity>('/api/activities', form);
      setCreatedActivity(res.data);
      if (res.data.creatorToken) {
        localStorage.setItem(`creatorToken_${res.data.id}`, res.data.creatorToken);
      }
    } catch {
      setErrors({ submit: '创建失败，请重试' });
    } finally {
      setSubmitting(false);
    }
  };

  const shareLink = createdActivity
    ? `${window.location.origin}/activity/${createdActivity.id}`
    : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = shareLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    }
  };

  if (createdActivity) {
    return (
      <div className="main-content fade-wrapper" style={{ textAlign: 'center', paddingTop: '80px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎉</div>
        <h1 style={{ fontSize: '2rem', marginBottom: '12px' }}>创建成功！</h1>
        <p style={{ color: 'var(--color-text-light)', marginBottom: '24px', fontSize: '1.05rem' }}>
          为 <strong>{createdActivity.birthdayPerson}</strong> 的生日活动已创建
        </p>
        <div style={{
          background: 'var(--color-white)',
          borderRadius: 'var(--border-radius)',
          padding: '20px 24px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 2px 12px var(--color-primary-shadow)',
          marginBottom: '24px',
        }}>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            color: 'var(--color-text-light)',
            wordBreak: 'break-all',
            maxWidth: '360px',
          }}>
            {shareLink}
          </span>
          <button
            className={`copy-link-btn${copied ? ' copied' : ''}`}
            onClick={handleCopy}
          >
            {copied ? '已复制！' : '复制链接'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '12px' }}>
          <button className="btn btn-primary" onClick={() => navigate(`/activity/${createdActivity.id}`)}>
            查看活动
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const slideClass = (s: number) => {
    if (s < step) return 'step-content slide-left';
    if (s > step) return 'step-content slide-right';
    return 'step-content active';
  };

  return (
    <div className="main-content fade-wrapper">
      <div style={{
        maxWidth: '560px',
        margin: '0 auto',
        paddingTop: '32px',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1rem',
            color: 'var(--color-primary)',
            fontWeight: 700,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontFamily: 'var(--font-body)',
          }}
        >
          ← 返回
        </button>

        <h1 style={{ fontSize: '1.8rem', marginBottom: '24px' }}>创建生日活动</h1>

        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '32px',
          alignItems: 'center',
        }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '20px',
                background: i <= step ? 'var(--color-primary)' : 'var(--color-primary-light)',
                color: i <= step ? 'var(--color-white)' : 'var(--color-primary)',
                fontWeight: 700,
                fontSize: '0.8rem',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
              }}>
                <span>{s.icon}</span>
                <span style={{ display: 'none' }}>{s.title}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  flex: 1,
                  height: '2px',
                  background: i < step ? 'var(--color-primary)' : 'var(--color-border)',
                  transition: 'background 0.3s ease',
                  margin: '0 4px',
                }} />
              )}
            </div>
          ))}
        </div>

        <div className="step-form" style={{
          background: 'var(--color-white)',
          borderRadius: 'var(--border-radius)',
          padding: '32px 28px',
          boxShadow: '0 2px 12px var(--color-primary-shadow)',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '320px',
        }}>
          <div className={slideClass(0)} style={step !== 0 ? { position: 'absolute', top: 32, left: 28, right: 28 } : {}}>
            <h3 style={{ marginBottom: '20px', fontSize: '1.1rem' }}>{STEPS[0].icon} {STEPS[0].title}</h3>
            <div className="form-group">
              <label>寿星姓名</label>
              <input
                type="text"
                className="form-input"
                placeholder="输入寿星的姓名"
                value={form.birthdayPerson}
                onChange={e => updateForm('birthdayPerson', e.target.value)}
              />
              {errors.birthdayPerson && (
                <div style={{ color: 'var(--color-primary)', fontSize: '0.8rem', marginTop: '4px' }}>
                  {errors.birthdayPerson}
                </div>
              )}
            </div>
          </div>

          <div className={slideClass(1)} style={step !== 1 ? { position: 'absolute', top: 32, left: 28, right: 28 } : {}}>
            <h3 style={{ marginBottom: '20px', fontSize: '1.1rem' }}>{STEPS[1].icon} {STEPS[1].title}</h3>
            <div className="form-group">
              <label>生日日期</label>
              <input
                type="date"
                className="form-input"
                value={form.birthdayDate}
                onChange={e => updateForm('birthdayDate', e.target.value)}
              />
              {errors.birthdayDate && (
                <div style={{ color: 'var(--color-primary)', fontSize: '0.8rem', marginTop: '4px' }}>
                  {errors.birthdayDate}
                </div>
              )}
            </div>
            <div className="form-group">
              <label>祝福截止时间</label>
              <input
                type="datetime-local"
                className="form-input"
                value={form.deadline}
                onChange={e => updateForm('deadline', e.target.value)}
              />
              {errors.deadline && (
                <div style={{ color: 'var(--color-primary)', fontSize: '0.8rem', marginTop: '4px' }}>
                  {errors.deadline}
                </div>
              )}
            </div>
          </div>

          <div className={slideClass(2)} style={step !== 2 ? { position: 'absolute', top: 32, left: 28, right: 28 } : {}}>
            <h3 style={{ marginBottom: '20px', fontSize: '1.1rem' }}>{STEPS[2].icon} {STEPS[2].title}</h3>
            <div className="form-group">
              <label>活动可见性</label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginTop: '8px',
              }}>
                <button
                  type="button"
                  onClick={() => updateForm('isPublic', true)}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: form.isPublic ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                    background: form.isPublic ? 'var(--color-primary-light)' : 'var(--color-white)',
                    color: form.isPublic ? 'var(--color-primary)' : 'var(--color-text-light)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s ease',
                  }}
                >
                  🌍 公开
                </button>
                <button
                  type="button"
                  onClick={() => updateForm('isPublic', false)}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: !form.isPublic ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                    background: !form.isPublic ? 'var(--color-primary-light)' : 'var(--color-white)',
                    color: !form.isPublic ? 'var(--color-primary)' : 'var(--color-text-light)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s ease',
                  }}
                >
                  🔒 私密
                </button>
              </div>
              <p style={{
                fontSize: '0.8rem',
                color: 'var(--color-text-light)',
                marginTop: '8px',
              }}>
                {form.isPublic ? '所有人可以在活动广场看到此活动' : '只有通过链接的人可以访问此活动'}
              </p>
            </div>
          </div>

          {errors.submit && (
            <div style={{
              color: 'var(--color-primary)',
              fontSize: '0.85rem',
              marginTop: '12px',
              textAlign: 'center',
            }}>
              {errors.submit}
            </div>
          )}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '24px',
        }}>
          {step > 0 ? (
            <button className="btn btn-secondary" onClick={goBack}>
              上一步
            </button>
          ) : (
            <div />
          )}
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={goNext}>
              下一步
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? '创建中...' : '🎉 创建活动'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

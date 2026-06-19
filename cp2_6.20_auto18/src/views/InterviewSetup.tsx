import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import apiClient from '../services/apiClient';
import { useAppStore } from '../store/appStore';
import type { CreateInterviewRequest } from '../types';

interface FormData {
  title: string;
  candidateEmail: string;
  questions: {
    text: string;
    duration: number;
  }[];
}

const InterviewSetup: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const setCurrentInterview = useAppStore((state) => state.setCurrentInterview);

  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.className = 'ripple';

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      title: '',
      candidateEmail: '',
      questions: [
        { text: '', duration: 120 },
        { text: '', duration: 120 },
        { text: '', duration: 120 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'questions',
  });

  const watchQuestions = watch('questions');
  const canAddQuestion = watchQuestions.length < 5;
  const canRemoveQuestion = watchQuestions.length > 3;

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const request: CreateInterviewRequest = {
        title: data.title,
        candidateEmail: data.candidateEmail,
        questions: data.questions.map((q) => ({
          text: q.text,
          duration: q.duration,
        })),
      };

      const response = await apiClient.createInterview(request);
      if (response.success) {
        setCurrentInterview(response.interview);
        setInviteLink(response.inviteLink);
        setSubmitted(true);
      }
    } catch (error) {
      console.error('创建面试失败:', error);
      alert('创建面试失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs > 0 ? secs + '秒' : ''}`;
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert('链接已复制到剪贴板');
  };

  if (submitted) {
    return (
      <div className="setup-container animate-fade-in">
        <div className="card success-card">
          <div className="success-icon">✓</div>
          <h2>面试创建成功！</h2>
          <p>邀请链接已生成，通知邮件已发送至候选人邮箱。</p>
          <div className="invite-link-box">
            <label>面试邀请链接</label>
            <div className="link-input-wrapper">
              <input type="text" value={inviteLink} readOnly className="input-field" />
              <button className="btn btn-secondary" onClick={(e) => { createRipple(e); copyLink(); }}>
                复制
              </button>
            </div>
          </div>
          <div className="info-list">
            <div className="info-item">
              <span className="info-label">候选人邮箱</span>
              <span className="info-value">{watch('candidateEmail')}</span>
            </div>
            <div className="info-item">
              <span className="info-label">问题数量</span>
              <span className="info-value">{watchQuestions.length} 题</span>
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ marginTop: '24px', width: '100%' }}
            onClick={(e) => {
              createRipple(e);
              setSubmitted(false);
              setInviteLink('');
            }}
          >
            创建新面试
          </button>
        </div>

        <style>{`
          .setup-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
          }
          .success-card {
            width: 100%;
            max-width: 520px;
            padding: 40px;
            text-align: center;
          }
          .success-icon {
            width: 64px;
            height: 64px;
            margin: 0 auto 20px;
            background: var(--color-success);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            color: white;
          }
          .success-card h2 {
            font-size: 24px;
            margin-bottom: 8px;
            color: var(--color-text-primary);
          }
          .success-card p {
            color: var(--color-text-secondary);
            margin-bottom: 24px;
          }
          .invite-link-box {
            text-align: left;
            margin-bottom: 20px;
          }
          .invite-link-box label {
            display: block;
            margin-bottom: 8px;
            font-size: 14px;
            color: var(--color-text-secondary);
          }
          .link-input-wrapper {
            display: flex;
            gap: 8px;
          }
          .link-input-wrapper .input-field {
            flex: 1;
          }
          .info-list {
            text-align: left;
            background: var(--color-bg-input);
            border-radius: 8px;
            padding: 16px;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
          }
          .info-item:not(:last-child) {
            border-bottom: 1px solid var(--color-border);
          }
          .info-label {
            color: var(--color-text-secondary);
            font-size: 14px;
          }
          .info-value {
            color: var(--color-text-primary);
            font-weight: 500;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="setup-container animate-fade-in">
      <div className="setup-content">
        <div className="setup-header">
          <h1>创建面试</h1>
          <p>设置面试问题和候选人信息，系统将生成唯一邀请链接</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="setup-form">
          <div className="card form-section">
            <h3>基本信息</h3>

            <div className="form-group">
              <label>面试标题</label>
              <Controller
                name="title"
                control={control}
                rules={{ required: '请输入面试标题' }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className={`input-field ${errors.title ? 'error' : ''}`}
                    placeholder="例如：前端工程师初面"
                  />
                )}
              />
              {errors.title && <span className="error-text">{errors.title.message}</span>}
            </div>

            <div className="form-group">
              <label>候选人邮箱</label>
              <Controller
                name="candidateEmail"
                control={control}
                rules={{
                  required: '请输入候选人邮箱',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: '请输入有效的邮箱地址',
                  },
                }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="email"
                    className={`input-field ${errors.candidateEmail ? 'error' : ''}`}
                    placeholder="candidate@example.com"
                  />
                )}
              />
              {errors.candidateEmail && (
                <span className="error-text">{errors.candidateEmail.message}</span>
              )}
            </div>
          </div>

          <div className="card form-section">
            <div className="section-header">
              <h3>面试问题</h3>
              <span className="question-count">{fields.length}/5 题</span>
            </div>

            <div className="questions-list">
              {fields.map((field, index) => (
                <div key={field.id} className="question-item card">
                  <div className="question-header">
                    <span className="question-number">第 {index + 1} 题</span>
                    {canRemoveQuestion && (
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={(e) => { createRipple(e); remove(index); }}
                      >
                        删除
                      </button>
                    )}
                  </div>

                  <div className="form-group">
                    <label>问题内容</label>
                    <Controller
                      name={`questions.${index}.text`}
                      control={control}
                      rules={{ required: '请输入问题内容' }}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          rows={3}
                          className={`input-field ${
                            errors.questions?.[index]?.text ? 'error' : ''
                          }`}
                          placeholder="请输入面试问题..."
                        />
                      )}
                    />
                    {errors.questions?.[index]?.text && (
                      <span className="error-text">
                        {errors.questions[index]?.text?.message}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>作答时间：{formatDuration(watchQuestions[index]?.duration || 0)}</label>
                    <Controller
                      name={`questions.${index}.duration`}
                      control={control}
                      rules={{ required: true, min: 30, max: 300 }}
                      render={({ field }) => (
                        <input
                          type="range"
                          min={30}
                          max={300}
                          step={30}
                          value={field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className="duration-slider"
                        />
                      )}
                    />
                    <div className="slider-labels">
                      <span>30秒</span>
                      <span>5分钟</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {canAddQuestion && (
              <button
                type="button"
                className="btn btn-secondary add-question-btn"
                onClick={(e) => { createRipple(e); append({ text: '', duration: 120 }); }}
              >
                + 添加问题
              </button>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary submit-btn"
            disabled={isLoading}
            onMouseDown={createRipple}
          >
            {isLoading ? '创建中...' : '创建面试并发送邀请'}
          </button>
        </form>
      </div>

      <style>{`
        .setup-container {
          min-height: 100vh;
          padding: 40px 20px;
        }
        .setup-content {
          max-width: 720px;
          margin: 0 auto;
        }
        .setup-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .setup-header h1 {
          font-size: 32px;
          margin-bottom: 8px;
          color: var(--color-text-primary);
        }
        .setup-header p {
          color: var(--color-text-secondary);
        }
        .form-section {
          padding: 24px;
          margin-bottom: 20px;
        }
        .form-section h3 {
          font-size: 18px;
          margin-bottom: 20px;
          color: var(--color-text-primary);
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .section-header h3 {
          margin-bottom: 0;
        }
        .question-count {
          font-size: 14px;
          color: var(--color-accent-blue);
          font-weight: 500;
        }
        .form-group {
          margin-bottom: 16px;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text-secondary);
        }
        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }
        .error-text {
          color: var(--color-error);
          font-size: 12px;
          margin-top: 4px;
          display: block;
        }
        .input-field.error {
          border-color: var(--color-error);
        }
        .questions-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .question-item {
          padding: 20px;
          background: var(--color-bg-input);
          border: 1px solid var(--color-border);
        }
        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .question-number {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-accent-blue);
        }
        .btn-remove {
          background: none;
          color: var(--color-error);
          font-size: 13px;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .btn-remove:hover {
          background: rgba(239, 68, 68, 0.1);
        }
        .duration-slider {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: var(--color-border);
          outline: none;
          -webkit-appearance: none;
          appearance: none;
        }
        .duration-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--color-accent-blue);
          cursor: pointer;
          transition: transform 0.2s;
        }
        .duration-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        .slider-labels {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--color-text-muted);
          margin-top: 4px;
        }
        .add-question-btn {
          width: 100%;
          margin-top: 16px;
          padding: 12px;
        }
        .submit-btn {
          width: 100%;
          padding: 14px;
          font-size: 16px;
          margin-top: 8px;
        }
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
      `}</style>
    </div>
  );
};

export default InterviewSetup;

import React, { useState } from 'react';
import { useFeedbackStore } from '../store/feedbackStore';
import { getRoleLabel } from '../../analytics/utils/wordCloud';
import type { Role, Rating } from '../../../types';

const FeedbackForm: React.FC = () => {
  const { addMeeting, addFeedback, meetings, currentMeetingId, setCurrentMeeting, setCurrentView } =
    useFeedbackStore();

  const [formMode, setFormMode] = useState<'meeting' | 'feedback'>('meeting');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [participantCount, setParticipantCount] = useState(0);

  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('participant');
  const [rating, setRating] = useState<Rating>(3);
  const [hoverRating, setHoverRating] = useState<Rating | null>(null);
  const [keyTakeaways, setKeyTakeaways] = useState('');
  const [improvements, setImprovements] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const MAX_TAKEAWAYS = 500;
  const MAX_IMPROVEMENTS = 500;

  const validateMeetingForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!meetingTitle.trim()) newErrors.meetingTitle = '请输入会议名称';
    if (!createdBy.trim()) newErrors.createdBy = '请输入创建者姓名';
    if (participantCount <= 0) newErrors.participantCount = '请输入有效参与人数';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateFeedbackForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!currentMeetingId) newErrors.meeting = '请先选择会议';
    if (!name.trim()) newErrors.name = '请输入您的姓名';
    if (!keyTakeaways.trim()) newErrors.keyTakeaways = '请输入关键收获';
    if (!improvements.trim()) newErrors.improvements = '请输入待改进建议';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateMeetingForm()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const meetingId = addMeeting({
        title: meetingTitle.trim(),
        createdBy: createdBy.trim(),
        participantCount,
      });
      setCurrentMeeting(meetingId);
      setFormMode('feedback');
      setIsSubmitting(false);
    }, 500);
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFeedbackForm() || !currentMeetingId) return;

    setIsSubmitting(true);
    setTimeout(() => {
      addFeedback({
        meetingId: currentMeetingId,
        name: name.trim(),
        role,
        rating,
        keyTakeaways: keyTakeaways.trim(),
        improvements: improvements.trim(),
      });

      setShowSuccess(true);
      setName('');
      setRole('participant');
      setRating(3);
      setKeyTakeaways('');
      setImprovements('');
      setIsSubmitting(false);
      setErrors({});

      setTimeout(() => setShowSuccess(false), 2000);
    }, 500);
  };

  const handleSelectMeeting = (meetingId: string) => {
    setCurrentMeeting(meetingId);
    setErrors((prev) => ({ ...prev, meeting: '' }));
  };

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.header}>
        <h1 style={styles.title}>创建会议反馈</h1>
        <p style={styles.subtitle}>提交您的宝贵意见，帮助我们持续改进</p>
      </div>

      {showSuccess && (
        <div style={styles.successToast}>
          <span style={{ marginRight: '8px' }}>✅</span>
          反馈提交成功！感谢您的参与
        </div>
      )}

      <div style={styles.modeTabs}>
        <button
          onClick={() => setFormMode('meeting')}
          style={{
            ...styles.modeTab,
            ...(formMode === 'meeting' ? styles.modeTabActive : {}),
          }}
        >
          1. 新建会议
        </button>
        <button
          onClick={() => setFormMode('feedback')}
          style={{
            ...styles.modeTab,
            ...(formMode === 'feedback' ? styles.modeTabActive : {}),
          }}
        >
          2. 提交反馈
        </button>
      </div>

      {formMode === 'meeting' ? (
        <form onSubmit={handleCreateMeeting} style={styles.form}>
          <div style={styles.formGroup} className="stagger-1">
            <label style={styles.label}>会议名称 *</label>
            <input
              type="text"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              placeholder="例如：Q3产品规划会"
              style={{
                ...styles.input,
                ...(errors.meetingTitle ? styles.inputError : {}),
              }}
              onFocus={(e) => (e.target.style.transform = 'scale(1.02)')}
              onBlur={(e) => (e.target.style.transform = 'scale(1)')}
            />
            {errors.meetingTitle && <span style={styles.errorText}>{errors.meetingTitle}</span>}
          </div>

          <div style={styles.formGroup} className="stagger-2">
            <label style={styles.label}>创建者 *</label>
            <input
              type="text"
              value={createdBy}
              onChange={(e) => setCreatedBy(e.target.value)}
              placeholder="请输入您的姓名"
              style={{
                ...styles.input,
                ...(errors.createdBy ? styles.inputError : {}),
              }}
              onFocus={(e) => (e.target.style.transform = 'scale(1.02)')}
              onBlur={(e) => (e.target.style.transform = 'scale(1)')}
            />
            {errors.createdBy && <span style={styles.errorText}>{errors.createdBy}</span>}
          </div>

          <div style={styles.formGroup} className="stagger-3">
            <label style={styles.label}>预估参与人数 *</label>
            <input
              type="number"
              min="1"
              value={participantCount || ''}
              onChange={(e) => setParticipantCount(parseInt(e.target.value) || 0)}
              placeholder="请输入人数"
              style={{
                ...styles.input,
                ...(errors.participantCount ? styles.inputError : {}),
              }}
              onFocus={(e) => (e.target.style.transform = 'scale(1.02)')}
              onBlur={(e) => (e.target.style.transform = 'scale(1)')}
            />
            {errors.participantCount && (
              <span style={styles.errorText}>{errors.participantCount}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              ...styles.submitBtn,
              ...(isSubmitting ? styles.submitBtnDisabled : {}),
            }}
            onMouseDown={(e) => {
              if (!isSubmitting) e.currentTarget.style.transform = 'scale(0.97)';
            }}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {isSubmitting ? '创建中...' : '创建会议 →'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmitFeedback} style={styles.form}>
          {meetings.length > 0 && (
            <div style={styles.formGroup} className="stagger-1">
              <label style={styles.label}>选择会议 *</label>
              <select
                value={currentMeetingId || ''}
                onChange={(e) => handleSelectMeeting(e.target.value)}
                style={{
                  ...styles.select,
                  ...(errors.meeting ? styles.inputError : {}),
                }}
              >
                <option value="">请选择要提交反馈的会议</option>
                {meetings.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
              {errors.meeting && <span style={styles.errorText}>{errors.meeting}</span>}
            </div>
          )}

          {meetings.length === 0 && (
            <div style={styles.emptyHint}>
              <p style={{ color: '#64748b' }}>暂无会议，请先创建会议</p>
              <button
                type="button"
                onClick={() => setFormMode('meeting')}
                style={styles.linkBtn}
              >
                去创建会议 →
              </button>
            </div>
          )}

          {currentMeetingId && (
            <>
              <div style={styles.formGroup} className="stagger-1">
                <label style={styles.label}>您的姓名 *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入您的姓名"
                  style={{
                    ...styles.input,
                    ...(errors.name ? styles.inputError : {}),
                  }}
                  onFocus={(e) => (e.target.style.transform = 'scale(1.02)')}
                  onBlur={(e) => (e.target.style.transform = 'scale(1)')}
                />
                {errors.name && <span style={styles.errorText}>{errors.name}</span>}
              </div>

              <div style={styles.formGroup} className="stagger-2">
                <label style={styles.label}>您的角色</label>
                <div style={styles.roleOptions}>
                  {(['host', 'participant', 'observer'] as Role[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      style={{
                        ...styles.roleOption,
                        ...(role === r ? styles.roleOptionActive : {}),
                      }}
                    >
                      {getRoleLabel(r)}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.formGroup} className="stagger-3">
                <label style={styles.label}>满意度评分</label>
                <div style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star as Rating)}
                      onMouseEnter={() => setHoverRating(star as Rating)}
                      onMouseLeave={() => setHoverRating(null)}
                      style={styles.starBtn}
                    >
                      <svg
                        width="36"
                        height="36"
                        viewBox="0 0 24 24"
                        fill={star <= (hoverRating || rating) ? '#fbbf24' : 'none'}
                        stroke={
                          star <= (hoverRating || rating) ? '#f59e0b' : '#d1d5db'
                        }
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          transition: 'all 0.15s ease',
                          transform:
                            star === hoverRating
                              ? 'scale(1.2)'
                              : star <= rating
                              ? 'scale(1)'
                              : 'scale(0.9)',
                        }}
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>
                  ))}
                  <span style={styles.ratingValue}>{rating} 星</span>
                </div>
              </div>

              <div style={styles.formGroup} className="stagger-4">
                <div style={styles.labelRow}>
                  <label style={styles.label}>关键收获 *</label>
                  <span
                    style={{
                      ...styles.charCount,
                      ...(keyTakeaways.length > MAX_TAKEAWAYS * 0.9
                        ? styles.charCountWarning
                        : {}),
                    }}
                  >
                    {keyTakeaways.length}/{MAX_TAKEAWAYS}
                  </span>
                </div>
                <textarea
                  value={keyTakeaways}
                  onChange={(e) =>
                    setKeyTakeaways(e.target.value.slice(0, MAX_TAKEAWAYS))
                  }
                  placeholder="这次会议您最大的收获是什么？有哪些新的想法或启发？"
                  rows={4}
                  style={{
                    ...styles.textarea,
                    ...(errors.keyTakeaways ? styles.inputError : {}),
                  }}
                  onFocus={(e) => (e.target.style.transform = 'scale(1.02)')}
                  onBlur={(e) => (e.target.style.transform = 'scale(1)')}
                />
                {errors.keyTakeaways && (
                  <span style={styles.errorText}>{errors.keyTakeaways}</span>
                )}
              </div>

              <div style={styles.formGroup} className="stagger-5">
                <div style={styles.labelRow}>
                  <label style={styles.label}>待改进建议 *</label>
                  <span
                    style={{
                      ...styles.charCount,
                      ...(improvements.length > MAX_IMPROVEMENTS * 0.9
                        ? styles.charCountWarning
                        : {}),
                    }}
                  >
                    {improvements.length}/{MAX_IMPROVEMENTS}
                  </span>
                </div>
                <textarea
                  value={improvements}
                  onChange={(e) =>
                    setImprovements(e.target.value.slice(0, MAX_IMPROVEMENTS))
                  }
                  placeholder="您认为会议还有哪些可以改进的地方？有什么具体建议？"
                  rows={4}
                  style={{
                    ...styles.textarea,
                    ...(errors.improvements ? styles.inputError : {}),
                  }}
                  onFocus={(e) => (e.target.style.transform = 'scale(1.02)')}
                  onBlur={(e) => (e.target.style.transform = 'scale(1)')}
                />
                {errors.improvements && (
                  <span style={styles.errorText}>{errors.improvements}</span>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  ...styles.submitBtn,
                  ...(isSubmitting ? styles.submitBtnDisabled : {}),
                }}
                onMouseDown={(e) => {
                  if (!isSubmitting) e.currentTarget.style.transform = 'scale(0.97)';
                }}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {isSubmitting ? '提交中...' : '提交反馈 ✉️'}
              </button>

              <div style={styles.actions}>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('detail');
                  }}
                  style={styles.secondaryBtn}
                >
                  查看该会议反馈 →
                </button>
              </div>
            </>
          )}
        </form>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '720px',
    margin: '0 auto',
    padding: '32px 24px',
  },
  header: {
    marginBottom: '32px',
    textAlign: 'center',
  },
  title: {
    fontSize: '32px',
    color: '#1e293b',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '15px',
    color: '#64748b',
  },
  successToast: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    background: '#10b981',
    color: '#ffffff',
    padding: '14px 24px',
    borderRadius: '8px',
    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
    zIndex: 1000,
    animation: 'slideUp 0.3s ease',
    fontWeight: 500,
  },
  modeTabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '32px',
    background: '#f1f5f9',
    padding: '6px',
    borderRadius: '12px',
  },
  modeTab: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#64748b',
    transition: 'all 0.2s ease',
  },
  modeTabActive: {
    background: '#ffffff',
    color: '#2563eb',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  form: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
  },
  formGroup: {
    marginBottom: '24px',
    opacity: 0,
    animation: 'fadeIn 0.4s ease forwards',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '8px',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '15px',
    color: '#1e293b',
    background: '#ffffff',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '15px',
    color: '#1e293b',
    background: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '15px',
    color: '#1e293b',
    background: '#ffffff',
    resize: 'vertical',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    display: 'block',
    fontSize: '13px',
    color: '#ef4444',
    marginTop: '6px',
  },
  charCount: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  charCountWarning: {
    color: '#f97316',
  },
  roleOptions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  roleOption: {
    padding: '10px 20px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#64748b',
    transition: 'all 0.2s ease',
  },
  roleOptionActive: {
    borderColor: '#2563eb',
    background: 'rgba(37, 99, 235, 0.08)',
    color: '#2563eb',
  },
  starsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  starBtn: {
    padding: '4px',
    transition: 'transform 0.15s ease',
  },
  ratingValue: {
    marginLeft: '12px',
    fontSize: '15px',
    fontWeight: 600,
    color: '#f59e0b',
  },
  submitBtn: {
    width: '100%',
    padding: '14px 32px',
    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 600,
    borderRadius: '10px',
    marginTop: '8px',
    boxShadow: '0 4px 14px rgba(249, 115, 22, 0.3)',
    transition: 'all 0.2s ease',
  },
  submitBtnDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  actions: {
    marginTop: '16px',
    textAlign: 'center',
  },
  secondaryBtn: {
    fontSize: '14px',
    color: '#2563eb',
    fontWeight: 500,
  },
  emptyHint: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  linkBtn: {
    marginTop: '12px',
    color: '#2563eb',
    fontSize: '15px',
    fontWeight: 500,
  },
};

export default FeedbackForm;

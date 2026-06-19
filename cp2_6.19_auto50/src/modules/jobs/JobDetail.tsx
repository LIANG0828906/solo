import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useJobStore } from '../../store/useJobStore';

interface FormData {
  candidateName: string;
  candidatePhone: string;
  candidateEmail: string;
  candidateResume: string;
}

interface FormErrors {
  candidateName?: string;
  candidatePhone?: string;
  candidateEmail?: string;
  candidateResume?: string;
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getJobById, addReferral } = useJobStore();
  const job = id ? getJobById(id) : undefined;

  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    candidateName: '',
    candidatePhone: '',
    candidateEmail: '',
    candidateResume: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!job && id) {
      navigate('/jobs');
    }
  }, [job, id, navigate]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.candidateName.trim()) {
      newErrors.candidateName = '请输入候选人姓名';
    }

    if (!formData.candidatePhone.trim()) {
      newErrors.candidatePhone = '请输入手机号';
    } else if (!/^1[3-9]\d{9}$/.test(formData.candidatePhone)) {
      newErrors.candidatePhone = '请输入有效的手机号';
    }

    if (!formData.candidateEmail.trim()) {
      newErrors.candidateEmail = '请输入邮箱';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.candidateEmail)) {
      newErrors.candidateEmail = '请输入有效的邮箱地址';
    }

    if (!formData.candidateResume.trim()) {
      newErrors.candidateResume = '请输入简历简介';
    } else if (formData.candidateResume.length < 20) {
      newErrors.candidateResume = '简历简介至少20个字';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !job) return;

    addReferral({
      jobId: job.id,
      ...formData,
      referrerName: '当前用户',
    });

    setShowForm(false);
    setShowSuccess(true);
    setFormData({
      candidateName: '',
      candidatePhone: '',
      candidateEmail: '',
      candidateResume: '',
    });

    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  if (!job) {
    return (
      <div style={styles.loading}>
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <button
        style={styles.backButton}
        onClick={() => navigate('/jobs')}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.95)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        ← 返回列表
      </button>

      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>{job.title}</h1>
            <div style={styles.metaRow}>
              <span style={styles.departmentTag}>{job.department}</span>
              <span style={styles.location}>📍 {job.location}</span>
              <span style={styles.salary}>💰 {job.salaryRange}</span>
            </div>
          </div>
          <div style={styles.bonusBadge}>
            🎁 推荐奖金
            <div style={styles.bonusAmount}>¥{job.bonus.toLocaleString()}</div>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>职位描述</h2>
          <p style={styles.sectionContent}>{job.description}</p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>任职要求</h2>
          <p style={styles.sectionContent}>{job.requirements}</p>
        </div>

        <div style={styles.footer}>
          <div style={styles.referrerInfo}>
            👥 已有 <strong>{job.referrerCount}</strong> 人推荐
          </div>
          <button
            style={styles.referButton}
            onClick={() => setShowForm(true)}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            📤 推荐候选人
          </button>
        </div>
      </div>

      {showForm && (
        <div style={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>推荐候选人</h2>
            <p style={styles.modalSubtitle}>
              正在推荐：<strong>{job.title}</strong>
            </p>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  候选人姓名 <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="candidateName"
                  value={formData.candidateName}
                  onChange={handleInputChange}
                  style={{
                    ...styles.input,
                    ...(errors.candidateName ? styles.inputError : {}),
                  }}
                  placeholder="请输入候选人姓名"
                />
                {errors.candidateName && (
                  <span style={styles.errorText}>
                    {errors.candidateName}
                  </span>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  手机号 <span style={styles.required}>*</span>
                </label>
                <input
                  type="tel"
                  name="candidatePhone"
                  value={formData.candidatePhone}
                  onChange={handleInputChange}
                  style={{
                    ...styles.input,
                    ...(errors.candidatePhone ? styles.inputError : {}),
                  }}
                  placeholder="请输入手机号"
                />
                {errors.candidatePhone && (
                  <span style={styles.errorText}>
                    {errors.candidatePhone}
                  </span>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  邮箱 <span style={styles.required}>*</span>
                </label>
                <input
                  type="email"
                  name="candidateEmail"
                  value={formData.candidateEmail}
                  onChange={handleInputChange}
                  style={{
                    ...styles.input,
                    ...(errors.candidateEmail ? styles.inputError : {}),
                  }}
                  placeholder="请输入邮箱地址"
                />
                {errors.candidateEmail && (
                  <span style={styles.errorText}>
                    {errors.candidateEmail}
                  </span>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  简历简介 <span style={styles.required}>*</span>
                </label>
                <textarea
                  name="candidateResume"
                  value={formData.candidateResume}
                  onChange={handleInputChange}
                  style={{
                    ...styles.textarea,
                    ...(errors.candidateResume ? styles.inputError : {}),
                  }}
                  placeholder="请简要描述候选人的工作经历、技能特长等（至少20字）"
                  rows={4}
                />
                {errors.candidateResume && (
                  <span style={styles.errorText}>
                    {errors.candidateResume}
                  </span>
                )}
              </div>

              <div style={styles.formActions}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => setShowForm(false)}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.95)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  style={styles.submitButton}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.95)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  提交推荐
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSuccess && (
        <div style={styles.successNotification}>
          <div style={styles.successIcon}>✓</div>
          <div>
            <div style={styles.successTitle}>推荐成功！</div>
            <div style={styles.successMessage}>
              候选人已成功推荐，初始状态为"已投递"
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '24px',
    backgroundColor: '#F5F5F5',
    minHeight: '100vh',
    position: 'relative',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#F5F5F5',
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: '#1A73E8',
    border: '1px solid #1A73E8',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    marginBottom: '20px',
    transition: 'transform 0.1s ease',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '1px solid #F0F0F0',
  },
  title: {
    fontSize: '28px',
    fontWeight: 600,
    color: '#333',
    margin: '0 0 12px 0',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  departmentTag: {
    padding: '4px 12px',
    backgroundColor: '#E8F0FE',
    color: '#1A73E8',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 500,
  },
  location: {
    fontSize: '14px',
    color: '#666',
  },
  salary: {
    fontSize: '14px',
    color: '#1A73E8',
    fontWeight: 500,
  },
  bonusBadge: {
    padding: '16px 24px',
    backgroundColor: '#FFF3E0',
    color: '#E65100',
    borderRadius: '12px',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: 500,
  },
  bonusAmount: {
    fontSize: '24px',
    fontWeight: 700,
    marginTop: '4px',
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#333',
    margin: '0 0 12px 0',
  },
  sectionContent: {
    fontSize: '15px',
    color: '#666',
    lineHeight: 1.8,
    margin: 0,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '24px',
    borderTop: '1px solid #F0F0F0',
    marginTop: '32px',
  },
  referrerInfo: {
    fontSize: '14px',
    color: '#666',
  },
  referButton: {
    padding: '12px 32px',
    backgroundColor: '#1A73E8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'transform 0.1s ease',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#333',
    margin: '0 0 8px 0',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: '14px',
    color: '#666',
    textAlign: 'center',
    margin: '0 0 24px 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#333',
  },
  required: {
    color: '#E53935',
  },
  input: {
    padding: '12px 16px',
    border: '1px solid #E0E0E0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },
  textarea: {
    padding: '12px 16px',
    border: '1px solid #E0E0E0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s ease',
  },
  inputError: {
    borderColor: '#E53935',
  },
  errorText: {
    fontSize: '12px',
    color: '#E53935',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#F5F5F5',
    color: '#666',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'transform 0.1s ease',
  },
  submitButton: {
    flex: 2,
    padding: '12px',
    backgroundColor: '#1A73E8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'transform 0.1s ease',
  },
  successNotification: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px 24px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
    zIndex: 2000,
    animation: 'slideIn 0.3s ease',
  },
  successIcon: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    color: '#FFFFFF',
    borderRadius: '50%',
    fontSize: '20px',
    fontWeight: 700,
  },
  successTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '4px',
  },
  successMessage: {
    fontSize: '14px',
    color: '#666',
  },
};

const keyframes = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

if (typeof document !== 'undefined') {
  const styleId = 'job-detail-keyframes';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = keyframes;
    document.head.appendChild(style);
  }
}

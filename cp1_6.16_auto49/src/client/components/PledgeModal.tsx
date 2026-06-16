import { useState } from 'react';
import type { Project, RewardTier, PledgeResponse } from '../types';

interface PledgeModalProps {
  project: Project;
  selectedTier: RewardTier;
  onClose: () => void;
  onSuccess: (response: PledgeResponse) => void;
}

export default function PledgeModal({ project, selectedTier, onClose, onSuccess }: PledgeModalProps) {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [pledgeId, setPledgeId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!nickname.trim()) {
      setError('请填写昵称');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('请填写有效的邮箱地址');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/projects/pledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          tierId: selectedTier.id,
          nickname: nickname.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '认筹失败');
      }

      setPledgeId(data.pledgeId);
      setShowSuccess(true);
      onSuccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '认筹失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          animation: 'slideIn 0.3s ease',
          position: 'relative',
        }}
      >
        <button
          onClick={handleClose}
          disabled={loading}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: loading ? 'not-allowed' : 'pointer',
            color: '#999',
            padding: '4px 8px',
            minHeight: '32px',
            minWidth: '32px',
          }}
        >
          ×
        </button>

        {showSuccess ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px',
            }}>
              🎉
            </div>
            <h2 style={{
              fontSize: '24px',
              color: '#333',
              marginBottom: '12px',
            }}>
              认筹成功！
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#666',
              marginBottom: '8px',
            }}>
              感谢您的支持！
            </p>
            <p style={{
              fontSize: '14px',
              color: '#999',
              fontFamily: 'monospace',
              background: '#FFF8F1',
              padding: '8px 16px',
              borderRadius: '8px',
              display: 'inline-block',
              marginBottom: '24px',
            }}>
              认筹编号：{pledgeId}
            </p>
            <button
              onClick={handleClose}
              style={{
                padding: '12px 48px',
                background: 'linear-gradient(135deg, #FF9500 0%, #FFB74D 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
                minHeight: '44px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.95)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
            >
              确定
            </button>
          </div>
        ) : (
          <>
            <h2 style={{
              fontSize: '24px',
              color: '#333',
              marginBottom: '8px',
            }}>
              确认认筹
            </h2>
            
            <div style={{
              background: '#FFF8F1',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
            }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <img
                  src={selectedTier.imageUrl}
                  alt={selectedTier.description}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                  }}
                />
                <div>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#FF9500',
                    marginBottom: '4px',
                  }}>
                    ￥{selectedTier.amount}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {selectedTier.description}
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#333',
                  marginBottom: '8px',
                }}>
                  昵称 <span style={{ color: '#FF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="请输入您的昵称"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #FFE0B2',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box',
                    minHeight: '44px',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#FF9500';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#FFE0B2';
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#333',
                  marginBottom: '8px',
                }}>
                  邮箱 <span style={{ color: '#FF4444' }}>*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入您的邮箱"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #FFE0B2',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box',
                    minHeight: '44px',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#FF9500';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#FFE0B2';
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#333',
                  marginBottom: '8px',
                }}>
                  寄语（可选）
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="想对创作者说的话..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #FFE0B2',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#FF9500';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#FFE0B2';
                  }}
                />
              </div>

              {error && (
                <div style={{
                  background: '#FFEBEE',
                  color: '#C62828',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '14px',
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  background: loading ? '#CCC' : 'linear-gradient(135deg, #FF9500 0%, #FFB74D 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'transform 0.2s ease',
                  minHeight: '48px',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
                onMouseDown={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'scale(0.95)';
                  }
                }}
                onMouseUp={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
              >
                {loading ? '提交中...' : `确认认筹 ￥${selectedTier.amount}`}
              </button>
            </form>
          </>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { worksAPI, invitationsAPI } from '../api';
import { useAuth } from '../App';
import { formatRelativeTime, getWorkTypeIcon } from '../utils';
import CreateWorkModal from '../components/CreateWorkModal';

interface Work {
  id: string;
  title: string;
  type: string;
  content: string;
  updatedAt: string;
  createdAt: string;
}

interface Invitation {
  id: string;
  workId: string;
  workTitle: string;
  inviterName: string;
  role: string;
  createdAt: string;
}

interface DashboardProps {
  showToast: (message: string, type: 'success' | 'error') => void;
}

const containerStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '24px',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '32px',
  flexWrap: 'wrap',
  gap: '16px',
};

const welcomeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
};

const avatarStyle = (color: string): React.CSSProperties => ({
  width: '56px',
  height: '56px',
  borderRadius: '50%',
  background: color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontWeight: 700,
  fontSize: '1.25rem',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
});

const welcomeH2Style: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
  color: '#2D3748',
  marginBottom: '4px',
};

const welcomePStyle: React.CSSProperties = {
  color: '#718096',
  fontSize: '0.95rem',
};

const sectionStyle: React.CSSProperties = {
  marginBottom: '40px',
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '16px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 600,
  color: '#2D3748',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '20px',
  position: 'relative',
};

const workCardStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: '16px',
  padding: '24px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
  position: 'relative',
  overflow: 'hidden',
};

const workCardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  marginBottom: '16px',
};

const workIconStyle: React.CSSProperties = {
  fontSize: '2rem',
  background: 'linear-gradient(135deg, #F5F0EB, #E8E0D8)',
  width: '52px',
  height: '52px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const workTitleStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 600,
  color: '#2D3748',
  marginBottom: '8px',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

const workMetaStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#718096',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const fabStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: '30px',
  right: '30px',
  width: '56px',
  height: '56px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #3B4A6B, #5A6B8C)',
  color: 'white',
  fontSize: '1.75rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 6px 25px rgba(59, 74, 107, 0.4)',
  zIndex: 50,
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
};

const invitationListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const invitationCardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #E8DAEF, #D2B4DE)',
  borderRadius: '12px',
  padding: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: '12px',
};

const invitationInfoStyle: React.CSSProperties = {
  flex: 1,
  minWidth: '200px',
};

const invitationTitleStyle: React.CSSProperties = {
  fontWeight: 600,
  color: '#4A235A',
  marginBottom: '4px',
  fontSize: '1rem',
};

const invitationDescStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#7D3C98',
};

const invitationActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
};

const acceptBtnStyle: React.CSSProperties = {
  background: '#27AE60',
  color: 'white',
  padding: '8px 16px',
  borderRadius: '8px',
  fontWeight: 500,
  fontSize: '0.875rem',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const rejectBtnStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.5)',
  color: '#6C3483',
  padding: '8px 16px',
  borderRadius: '8px',
  fontWeight: 500,
  fontSize: '0.875rem',
  border: '1px solid rgba(108, 52, 131, 0.3)',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const emptyStateStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '60px 20px',
  color: '#A0AEC0',
};

const emptyIconStyle: React.CSSProperties = {
  fontSize: '3rem',
  marginBottom: '12px',
  opacity: 0.5,
};

export default function Dashboard({ showToast }: DashboardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myWorks, setMyWorks] = useState<Work[]>([]);
  const [collaboratedWorks, setCollaboratedWorks] = useState<Work[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [worksData, invitationsData] = await Promise.all([
        worksAPI.getList(),
        invitationsAPI.getList(),
      ]);
      setMyWorks(worksData.myWorks || []);
      setCollaboratedWorks(worksData.collaboratedWorks || []);
      setInvitations(invitationsData || []);
    } catch (err) {
      console.error('加载数据失败:', err);
      showToast('加载数据失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWork = async (title: string, type: string) => {
    try {
      const newWork = await worksAPI.create({ title, type });
      setMyWorks([newWork, ...myWorks]);
      setShowCreateModal(false);
      showToast('创建成功', 'success');
      navigate(`/editor/${newWork.id}`);
    } catch (err: any) {
      showToast(err.response?.data?.error || '创建失败', 'error');
    }
  };

  const handleAcceptInvitation = async (id: string) => {
    try {
      await invitationsAPI.accept(id);
      setInvitations(invitations.filter((inv) => inv.id !== id));
      showToast('已接受邀请', 'success');
      loadData();
    } catch (err) {
      showToast('操作失败', 'error');
    }
  };

  const handleRejectInvitation = async (id: string) => {
    try {
      await invitationsAPI.reject(id);
      setInvitations(invitations.filter((inv) => inv.id !== id));
      showToast('已拒绝邀请', 'success');
    } catch (err) {
      showToast('操作失败', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ ...containerStyle, textAlign: 'center', padding: '100px' }}>
        <div>加载中...</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={welcomeStyle}>
          {user && <div style={avatarStyle(user.avatarColor)}>
            {user.name.charAt(0).toUpperCase()}
          </div>}
          <div>
            <h2 style={{ ...welcomeH2Style, margin: 0, marginBottom: '4px' }}>
              你好，{user?.name}！
            </h2>
            <p style={welcomePStyle}>
              今天也要好好创作哦 ✨
            </p>
          </div>
        </div>
      </div>

      {invitations.length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <h3 style={sectionTitleStyle}>协作邀请</h3>
            <span style={{ color: '#718096', fontSize: '0.9rem' }}>
              {invitations.length} 条新邀请
            </span>
          </div>
          <div style={invitationListStyle}>
            {invitations.map((inv) => (
              <div key={inv.id} style={invitationCardStyle} className="animate-slide-down">
                <div style={invitationInfoStyle}>
                  <div style={invitationTitleStyle}>{inv.workTitle}</div>
                  <div style={invitationDescStyle}>
                    {inv.inviterName} 邀请你作为
                    {inv.role === 'editor' ? ' 编辑者 ' : ' 评论者 '}
                    加入协作
                  </div>
                </div>
                <div style={invitationActionsStyle}>
                  <button
                    style={rejectBtnStyle}
                    onClick={() => handleRejectInvitation(inv.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)';
                    }}
                  >
                    拒绝
                  </button>
                  <button
                    style={acceptBtnStyle}
                    onClick={() => handleAcceptInvitation(inv.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#229954';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#27AE60';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    接受
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <h3 style={sectionTitleStyle}>我的作品</h3>
          <span style={{ color: '#718096', fontSize: '0.9rem' }}>
            {myWorks.length} 个作品
          </span>
        </div>
        {myWorks.length === 0 ? (
          <div style={emptyStateStyle}>
            <div style={emptyIconStyle}>📝</div>
            <p>还没有作品，点击右下角按钮创建你的第一个作品吧！</p>
          </div>
        ) : (
          <div style={gridStyle}>
            {myWorks.map((work, index) => (
              <div
                key={work.id}
                style={{
                  ...workCardStyle,
                  animation: `slideUp 0.4s ease ${index * 0.05}s both`,
                }}
                onClick={() => navigate(`/editor/${work.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.06)';
                }}
              >
                <div style={workCardHeaderStyle}>
                  <div style={workIconStyle}>{getWorkTypeIcon(work.type)}</div>
                </div>
                <h3 style={workTitleStyle}>{work.title}</h3>
                <div style={workMetaStyle}>
                  <span>🕐 {formatRelativeTime(work.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {collaboratedWorks.length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <h3 style={sectionTitleStyle}>协作作品</h3>
            <span style={{ color: '#718096', fontSize: '0.9rem' }}>
              {collaboratedWorks.length} 个作品
            </span>
          </div>
          <div style={gridStyle}>
            {collaboratedWorks.map((work, index) => (
              <div
                key={work.id}
                style={{
                  ...workCardStyle,
                  border: '2px solid #C99A3E',
                  animation: `slideUp 0.4s ease ${index * 0.05}s both`,
                }}
                onClick={() => navigate(`/editor/${work.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.06)';
                }}
              >
                <div style={workCardHeaderStyle}>
                  <div style={workIconStyle}>{getWorkTypeIcon(work.type)}</div>
                  <span
                    style={{
                      background: 'linear-gradient(135deg, #C99A3E, #E8B85C)',
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                    }}
                  >
                    协作中
                  </span>
                </div>
                <h3 style={workTitleStyle}>{work.title}</h3>
                <div style={workMetaStyle}>
                  <span>🕐 {formatRelativeTime(work.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        style={fabStyle}
        onClick={() => setShowCreateModal(true)}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #C99A3E, #E8B85C)';
          e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)';
          e.currentTarget.style.boxShadow = '0 8px 30px rgba(201, 154, 62, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #3B4A6B, #5A6B8C)';
          e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
          e.currentTarget.style.boxShadow = '0 6px 25px rgba(59, 74, 107, 0.4)';
        }}
      >
        +
      </button>

      {showCreateModal && (
        <CreateWorkModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateWork}
        />
      )}
    </div>
  );
}

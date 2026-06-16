import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import ProgressRing from '../components/ProgressRing';
import Countdown from '../components/Countdown';
import PledgeModal from '../components/PledgeModal';
import type { Project, RewardTier, Pledge, PledgeResponse } from '../types';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<RewardTier | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectRes, pledgesRes] = await Promise.all([
          fetch(`/api/projects/${id}`),
          fetch(`/api/projects/${id}/pledges`),
        ]);
        const projectData = await projectRes.json();
        const pledgesData = await pledgesRes.json();
        setProject(projectData);
        setPledges(pledgesData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handlePledgeSuccess = (response: PledgeResponse) => {
    setProject(response.project);
    fetch(`/api/projects/${id}/pledges`)
      .then(res => res.json())
      .then(data => setPledges(data));
  };

  const handleTierClick = (tier: RewardTier) => {
    if (tier.pledged >= tier.limit) {
      return;
    }
    setSelectedTier(tier);
    setShowModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        fontSize: '16px',
        color: '#999',
      }}>
        加载中...
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '60px 20px',
        color: '#999',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
        <p>项目不存在</p>
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '16px',
            padding: '10px 24px',
            background: '#FF9500',
            color: '#FFF',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            minHeight: '44px',
          }}
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 20px 40px 20px' }}>
      <button
        onClick={() => navigate('/')}
        style={{
          background: 'none',
          border: 'none',
          color: '#FF9500',
          fontSize: '16px',
          cursor: 'pointer',
          padding: '8px 0',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minHeight: '44px',
        }}
      >
        ← 返回项目列表
      </button>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '40px',
        marginBottom: '40px',
      }}>
        <div>
          <img
            src={project.coverImage}
            alt={project.name}
            style={{
              width: '100%',
              borderRadius: '16px',
              aspectRatio: '16/9',
              objectFit: 'cover',
            }}
          />
        </div>

        <div>
          <h1 style={{
            fontSize: '32px',
            color: '#333',
            margin: '0 0 16px 0',
            fontWeight: 700,
          }}>
            {project.name}
          </h1>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '24px',
          }}>
            <ProgressRing
              currentAmount={project.currentAmount}
              targetAmount={project.targetAmount}
              size={200}
              strokeWidth={12}
            />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '24px',
          }}>
            <Countdown deadline={project.deadline} size="large" />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            padding: '20px',
            background: '#FFF8F1',
            borderRadius: '12px',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#FF9500' }}>
                ￥{project.currentAmount.toLocaleString()}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>已筹金额</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#333' }}>
                {((project.currentAmount / project.targetAmount) * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>完成度</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#333' }}>
                {pledges.length}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>支持人数</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        background: '#FFF',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '40px',
        boxShadow: '0 4px 12px rgba(255, 149, 0, 0.1)',
      }}>
        <h2 style={{
          fontSize: '24px',
          color: '#333',
          margin: '0 0 20px 0',
          fontWeight: 600,
        }}>
          项目介绍
        </h2>
        <div
          dangerouslySetInnerHTML={{ __html: marked(project.description) as string }}
          style={{
            lineHeight: 1.8,
            color: '#555',
          }}
        />
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h2 style={{
          fontSize: '24px',
          color: '#333',
          margin: '0 0 20px 0',
          fontWeight: 600,
        }}>
          回报档位
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
        }}>
          {project.rewardTiers.map((tier) => {
            const isSoldOut = tier.pledged >= tier.limit;
            return (
              <div
                key={tier.id}
                onClick={() => handleTierClick(tier)}
                style={{
                  background: '#FFF',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 4px 12px rgba(255, 149, 0, 0.1)',
                  cursor: isSoldOut ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  border: '2px solid transparent',
                  opacity: isSoldOut ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isSoldOut) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 149, 0, 0.2)';
                    e.currentTarget.style.borderColor = '#FF9500';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 149, 0, 0.1)';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <img
                  src={tier.imageUrl}
                  alt={tier.description}
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                    aspectRatio: '1',
                    objectFit: 'cover',
                    marginBottom: '16px',
                  }}
                />
                <div style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#FF9500',
                  marginBottom: '8px',
                }}>
                  ￥{tier.amount}
                </div>
                <div style={{
                  fontSize: '16px',
                  color: '#333',
                  marginBottom: '12px',
                  lineHeight: 1.5,
                }}>
                  {tier.description}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#999',
                  marginBottom: '8px',
                }}>
                  预计交付：{new Date(tier.deliveryDate).toLocaleDateString('zh-CN')}
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '14px',
                  color: isSoldOut ? '#F44336' : '#666',
                }}>
                  <span>限量 {tier.limit} 份</span>
                  <span>{isSoldOut ? '已售罄' : `剩余 ${tier.limit - tier.pledged} 份`}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 style={{
          fontSize: '24px',
          color: '#333',
          margin: '0 0 20px 0',
          fontWeight: 600,
        }}>
          认筹记录（{pledges.length}）
        </h2>
        {pledges.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            background: '#FFF',
            borderRadius: '12px',
            color: '#999',
          }}>
            暂无认筹记录，快来成为第一个支持者吧！
          </div>
        ) : (
          <div style={{
            background: '#FFF',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(255, 149, 0, 0.1)',
          }}>
            {pledges.map((pledge, index) => (
              <div
                key={pledge.id}
                style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '16px 0',
                  borderBottom: index < pledges.length - 1 ? '1px solid #FFF0E0' : 'none',
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FF9500 0%, #FFB74D 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFF',
                  fontWeight: 600,
                  fontSize: '18px',
                  flexShrink: 0,
                }}>
                  {pledge.nickname.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px',
                  }}>
                    <span style={{
                      fontWeight: 600,
                      color: '#333',
                      fontSize: '16px',
                    }}>
                      {pledge.nickname}
                    </span>
                    <span style={{
                      color: '#FF9500',
                      fontWeight: 600,
                      fontSize: '16px',
                    }}>
                      ￥{pledge.amount}
                    </span>
                  </div>
                  {pledge.message && (
                    <p style={{
                      color: '#666',
                      fontSize: '14px',
                      margin: '0 0 8px 0',
                      lineHeight: 1.5,
                    }}>
                      {pledge.message.length > 50
                        ? pledge.message.substring(0, 50) + '...'
                        : pledge.message}
                    </p>
                  )}
                  <div style={{
                    color: '#999',
                    fontSize: '12px',
                  }}>
                    {formatDate(pledge.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && selectedTier && (
        <PledgeModal
          project={project}
          selectedTier={selectedTier}
          onClose={() => {
            setShowModal(false);
            setSelectedTier(null);
          }}
          onSuccess={handlePledgeSuccess}
        />
      )}

      <style>{`
        @media (max-width: 1024px) {
          div[style*="gridTemplateColumns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="gridTemplateColumns: repeat(3"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          div[style*="gridTemplateColumns: repeat(2"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="gridTemplateColumns: repeat(3"] {
            grid-template-columns: 1fr !important;
          }
        }
        h1, h2, h3 {
          margin-top: 0;
        }
        p {
          margin: 0 0 16px 0;
        }
        ul, ol {
          margin: 0 0 16px 0;
          padding-left: 24px;
        }
        code {
          background: #FFF8F1;

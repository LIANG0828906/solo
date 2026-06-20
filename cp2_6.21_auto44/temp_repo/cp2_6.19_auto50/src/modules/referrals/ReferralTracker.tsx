import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useJobStore } from '../../store/useJobStore';
import { useNotification } from '../../context/NotificationContext';
import type { Referral } from '../../types';

type ReferralStatus = '已投递' | '面试中' | '已录用' | '已入职';

interface TimelineStage {
  id: string;
  status: ReferralStatus;
  date: Date;
}

const statusConfig: Record<ReferralStatus, { label: string; icon: React.ReactNode; color: string }> = {
  '已投递': {
    label: '已投递',
    color: '#1A73E8',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
      </svg>
    ),
  },
  '面试中': {
    label: '面试中',
    color: '#FB8C00',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
        <path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z" />
      </svg>
    ),
  },
  '已录用': {
    label: '已录用',
    color: '#34A853',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M18 6l-2.83 2.83 1.42 1.41L18 8.83l4.24 4.24 1.41-1.41L18 6zm-5.5 9.5c-2.49 0-4.5-2.01-4.5-4.5s2.01-4.5 4.5-4.5c2.19 0 4.03 1.57 4.43 3.67l-2.22-.22c-.26-1.22-1.3-2.11-2.59-2.11-1.4 0-2.5 1.18-2.5 2.63s1.1 2.63 2.5 2.63c1.29 0 2.33-.89 2.59-2.11l2.22-.22c-.4 2.1-2.24 3.67-4.43 3.67zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c2.45 0 4.7-.88 6.5-2.35l-1.42-1.42C15.4 19.34 13.77 20 12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8c3.06 0 5.71 1.73 7.07 4.3l1.83-.64C19.44 4.93 15.96 2 12 2z" />
      </svg>
    ),
  },
  '已入职': {
    label: '已入职',
    color: '#34A853',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
      </svg>
    ),
  },
};

const statusOrder: ReferralStatus[] = ['已投递', '面试中', '已录用', '已入职'];

const ReferralTracker: React.FC = () => {
  const { showNotification } = useNotification();
  const referrals = useJobStore((state) => 
    state.referrals.filter((ref) => ref.referrerName === '当前用户')
  );
  const updateReferralStatus = useJobStore((state) => state.updateReferralStatus);
  const getJobById = useJobStore((state) => state.getJobById);
  const addReferral = useJobStore((state) => state.addReferral);
  const jobs = useJobStore((state) => state.jobs);
  const [visibleGroups, setVisibleGroups] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (referrals.length === 0 && jobs.length > 0) {
      const mockCandidates = [
        { name: '张三', phone: '13800138001', email: 'zhangsan@example.com', resume: 'resume1.pdf', jobIndex: 0 },
        { name: '李四', phone: '13800138002', email: 'lisi@example.com', resume: 'resume2.pdf', jobIndex: 1 },
        { name: '王五', phone: '13800138003', email: 'wangwu@example.com', resume: 'resume3.pdf', jobIndex: 2 },
      ];
      mockCandidates.forEach((candidate, index) => {
        setTimeout(() => {
          addReferral({
            jobId: jobs[candidate.jobIndex].id,
            candidateName: candidate.name,
            candidatePhone: candidate.phone,
            candidateEmail: candidate.email,
            candidateResume: candidate.resume,
            referrerName: '当前用户',
          });
        }, index * 100);
      });
    }
  }, [referrals.length, jobs, addReferral]);

  useEffect(() => {
    referrals.forEach((ref, index) => {
      setTimeout(() => {
        setVisibleGroups((prev) => [...prev, ref.id]);
      }, index * 200);
    });
  }, [referrals]);

  const handleStatusClick = (id: string) => {
    setEditingId(editingId === id ? null : id);
  };

  const handleStatusSelect = (referralId: string, newStatus: ReferralStatus) => {
    const referral = referrals.find((r) => r.id === referralId);
    const previousStatus = referral?.status;
    
    updateReferralStatus(referralId, newStatus);
    setEditingId(null);

    if (newStatus === '已入职' && previousStatus !== '已入职') {
      const job = getJobById(referral?.jobId || '');
      showNotification({
        candidateName: referral?.candidateName || '',
        jobId: referral?.jobId || '',
        bonus: job?.bonus || 0,
      });
    }
  };

  const generateTimelineStages = (referral: Referral): TimelineStage[] => {
    const currentStatusIndex = statusOrder.indexOf(referral.status);
    const stages: TimelineStage[] = [];

    for (let i = 0; i <= currentStatusIndex; i++) {
      const status = statusOrder[i];
      let date: Date;
      
      if (i === currentStatusIndex) {
        date = new Date(referral.updatedAt);
      } else if (i === 0) {
        date = new Date(referral.createdAt);
      } else {
        const baseDate = new Date(referral.createdAt);
        baseDate.setDate(baseDate.getDate() + i * 7);
        date = baseDate;
      }

      stages.push({
        id: `${referral.id}-${status}`,
        status,
        date,
      });
    }

    return stages;
  };

  if (referrals.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '60px 24px',
        color: '#5F6368',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
        <div style={{ fontSize: '18px', fontWeight: 500 }}>暂无推荐记录</div>
        <div style={{ fontSize: '14px', marginTop: '8px' }}>去职位列表推荐候选人吧！</div>
      </div>
    );
  }

  return (
    <div className="referral-tracker">
      <style>{`
        .referral-tracker {
          max-width: 900px;
          margin: 0 auto;
        }
        .referral-group {
          background: #fff;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          opacity: 0;
          transform: translateY(20px);
          animation: fadeInUp 0.5s ease-out forwards;
        }
        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .referral-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #E8EAED;
        }
        .referral-info {
          flex: 1;
        }
        .job-title {
          font-size: 18px;
          font-weight: 600;
          color: #202124;
          margin-bottom: 4px;
        }
        .candidate-name {
          font-size: 14px;
          color: #5F6368;
        }
        .current-status {
          padding: '6px 16px';
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
        }
        .timeline-container {
          position: relative;
          padding: 16px 0;
        }
        .timeline-connector {
          position: absolute;
          left: 28px;
          top: 48px;
          bottom: 48px;
          width: 2px;
          background: linear-gradient(180deg, #E8F0FE 0%, #D2E3FC 100%);
          overflow: hidden;
        }
        .timeline-connector::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 100%;
          background: linear-gradient(180deg, #1A73E8 0%, #6EB1FF 100%);
          transform: scaleY(0);
          transform-origin: top;
          animation: lineGrow 1.5s ease-out forwards;
        }
        @keyframes lineGrow {
          to { transform: scaleY(1); }
        }
        .timeline-item {
          display: flex;
          align-items: flex-start;
          margin-bottom: 24px;
          position: relative;
        }
        .timeline-item:last-child {
          margin-bottom: 0;
        }
        .timeline-dot {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
          cursor: pointer;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          color: #fff;
        }
        .timeline-dot:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }
        .timeline-content {
          margin-left: 24px;
          padding: 16px 20px;
          background: #F8F9FA;
          border-radius: 12px;
          flex: 1;
          min-width: 0;
        }
        .stage-name {
          font-size: 16px;
          font-weight: 600;
          color: #202124;
          margin-bottom: 4px;
        }
        .stage-date {
          font-size: 13px;
          color: #5F6368;
        }
        .status-dropdown {
          position: absolute;
          left: 70px;
          top: 60px;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          z-index: 100;
          overflow: hidden;
          min-width: 140px;
        }
        .status-option {
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: background 0.2s ease;
          font-size: 14px;
          color: #202124;
        }
        .status-option:hover {
          background: #F8F9FA;
        }
        @media (max-width: 768px) {
          .referral-group {
            padding: 16px;
            margin-bottom: 16px;
          }
          .timeline-connector {
            left: 20px;
          }
          .timeline-dot {
            width: 40px;
            height: 40px;
          }
          .timeline-dot svg {
            width: 16px;
            height: 16px;
          }
          .timeline-content {
            margin-left: 16px;
            padding: 12px 14px;
          }
          .stage-name {
            font-size: 14px;
          }
          .stage-date {
            font-size: 12px;
          }
          .status-dropdown {
            left: 50px;
            top: 45px;
          }
          .job-title {
            font-size: 16px;
          }
        }
      `}</style>

      <h2 style={{
        fontSize: '24px',
        fontWeight: 600,
        color: '#202124',
        marginBottom: '24px',
      }}>
        推荐跟踪
      </h2>

      {referrals.map((referral, groupIndex) => {
        const job = getJobById(referral.jobId);
        const stages = generateTimelineStages(referral);
        const isVisible = visibleGroups.includes(referral.id);
        const currentConfig = statusConfig[referral.status];

        return (
          <div
            key={referral.id}
            className="referral-group"
            style={{
              animationDelay: `${groupIndex * 0.15}s`,
              opacity: isVisible ? 1 : 0,
            }}
          >
            <div className="referral-header">
              <div className="referral-info">
                <div className="job-title">{job?.title || '未知职位'}</div>
                <div className="candidate-name">候选人：{referral.candidateName}</div>
              </div>
              <div
                className="current-status"
                style={{
                  backgroundColor: `${currentConfig.color}15`,
                  color: currentConfig.color,
                }}
              >
                {currentConfig.label}
              </div>
            </div>

            <div className="timeline-container">
              <div className="timeline-connector" />

              {stages.map((stage, stageIndex) => {
                const config = statusConfig[stage.status];

                return (
                  <div key={stage.id} className="timeline-item">
                    <div
                      className="timeline-dot"
                      style={{ backgroundColor: config.color }}
                      onClick={() => handleStatusClick(referral.id)}
                    >
                      {config.icon}
                    </div>

                    {editingId === referral.id && stageIndex === stages.length - 1 && (
                      <div className="status-dropdown">
                        {statusOrder.map((status) => {
                          const s = statusConfig[status];
                          return (
                            <div
                              key={status}
                              className="status-option"
                              onClick={() => handleStatusSelect(referral.id, status)}
                            >
                              <span style={{ color: s.color }}>{s.icon}</span>
                              {s.label}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="timeline-content">
                      <div className="stage-name">{config.label}</div>
                      <div className="stage-date">
                        {format(stage.date, 'yyyy年M月d日 EEEE', { locale: zhCN })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ReferralTracker;

import React, { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import type { GroupBuy } from '../../../types';
import { useGroupBuyStore } from '../store/groupBuyStore';
import { useScheduleStore } from '../../schedule/store/scheduleStore';

interface GroupCardProps {
  group: GroupBuy;
  style?: React.CSSProperties;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group, style }) => {
  const { joinGroupBuy, setSelectedGroup, loading } = useGroupBuyStore();
  const { autoAssignSlot } = useScheduleStore();
  const [showDetail, setShowDetail] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const prevStatusRef = useRef(group.status);
  const colors = ['#FFB347', '#FF7E67', '#4A90D9', '#6BCB77', '#9B59B6'];
  const bgColor = colors[group.productName.length % colors.length];

  useEffect(() => {
    const updateCountdown = () => {
      const end = dayjs(group.endTime);
      const now = dayjs();
      const diff = end.diff(now);

      if (diff <= 0) {
        setCountdown('已结束');
        return;
      }

      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setCountdown(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [group.endTime]);

  useEffect(() => {
    if (prevStatusRef.current !== 'success' && group.status === 'success') {
      autoAssignSlot(group.id);
    }
    prevStatusRef.current = group.status;
  }, [group.status, group.id, autoAssignSlot]);

  const handleJoin = async () => {
    if (group.status !== 'pending') return;
    await joinGroupBuy(group.id);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(group.code);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const handleCardClick = () => {
    setSelectedGroup(group);
    setShowDetail(true);
  };

  const progress = Math.min((group.currentMembers.length / group.minMembers) * 100, 100);

  const getStatusText = () => {
    switch (group.status) {
      case 'success': return '已成团';
      case 'closed': return '已结束';
      default: return '拼团中';
    }
  };

  const getStatusColor = () => {
    switch (group.status) {
      case 'success': return '#6BCB77';
      case 'closed': return '#999';
      default: return '#FF7E67';
    }
  };

  return (
    <>
      <div style={{ ...styles.card, ...style }} onClick={handleCardClick}>
        <div style={{ ...styles.thumbnail, backgroundColor: bgColor }}>
          <span style={styles.productInitial}>{group.productName.charAt(0)}</span>
        </div>
        <div style={styles.content}>
          <div style={styles.headerRow}>
            <h3 style={styles.productName}>{group.productName}</h3>
            <span style={{ ...styles.statusBadge, backgroundColor: getStatusColor() }}>
              {getStatusText()}
            </span>
          </div>
          <p style={styles.description}>{group.description}</p>
          <div style={styles.priceRow}>
            <span style={styles.groupPrice}>¥{group.groupPrice}</span>
            <span style={styles.originalPrice}>¥{group.originalPrice}</span>
          </div>
          <div style={styles.progressSection}>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #FF7E67, #FFB347)',
                }}
              />
            </div>
            <div style={styles.progressText}>
              <span>{group.currentMembers.length}/{group.minMembers}人</span>
              <span style={styles.countdown}>{countdown}</span>
            </div>
          </div>
          <div style={styles.actionRow}>
            <button
              style={{ ...styles.joinBtn, opacity: group.status !== 'pending' ? 0.6 : 1 }}
              onClick={(e) => { e.stopPropagation(); handleJoin(); }}
              disabled={group.status !== 'pending' || loading}
            >
              {loading ? '加入中...' : '加入拼团'}
            </button>
            <button
              style={styles.shareBtn}
              onClick={(e) => { e.stopPropagation(); handleShare(); }}
            >
              {copySuccess ? '已复制' : '拼团码'}
            </button>
          </div>
        </div>
      </div>

      {showDetail && (
        <div style={styles.overlay} onClick={() => setShowDetail(false)}>
          <div style={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.detailHeader}>
              <h2 style={styles.detailTitle}>{group.productName}</h2>
              <button style={styles.closeBtn} onClick={() => setShowDetail(false)}>×</button>
            </div>

            <div style={styles.detailContent}>
              <div style={{ ...styles.thumbnailLarge, backgroundColor: bgColor }}>
                <span style={styles.productInitialLarge}>{group.productName.charAt(0)}</span>
              </div>

              <div style={styles.infoRow}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>拼团价</span>
                  <span style={styles.infoValuePrimary}>¥{group.groupPrice}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>原价</span>
                  <span style={styles.infoValueSecondary}>¥{group.originalPrice}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>进度</span>
                  <span style={styles.infoValue}>{group.currentMembers.length}/{group.minMembers}人</span>
                </div>
              </div>

              {group.assignedSlot && (
                <div style={styles.assignedSlot}>
                  <span style={styles.assignedSlotLabel}>已分配取货时段：</span>
                  <span style={styles.assignedSlotValue}>
                    {dayjs(group.assignedSlot.date).format('MM月DD日')} {group.assignedSlot.startTime}-{group.assignedSlot.endTime}
                  </span>
                </div>
              )}

              <div style={styles.membersSection}>
                <h4 style={styles.sectionTitle}>拼团成员 ({group.currentMembers.length})</h4>
                <div style={styles.membersGrid}>
                  {group.currentMembers.map((member) => (
                    <div key={member.id} style={styles.memberItem}>
                      <div style={styles.memberAvatar}>
                        {member.avatar}
                      </div>
                      <span style={styles.memberName}>{member.nickname}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.shareSection}>
                <div style={styles.codeDisplay}>
                  <span style={styles.codeLabel}>拼团码</span>
                  <span style={styles.codeValue}>{group.code}</span>
                </div>
                <button style={styles.copyBtn} onClick={handleShare}>
                  {copySuccess ? '✓ 已复制' : '一键复制'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#FFF',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    cursor: 'pointer',
    transition: 'all 200ms ease-out',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    boxSizing: 'border-box',
  },
  thumbnail: {
    width: '100%',
    height: '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  productInitial: {
    fontSize: '48px',
    color: '#FFF',
    fontWeight: 'bold',
    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  content: {
    padding: '16px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
  },
  statusBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#FFF',
    fontWeight: 500,
  },
  description: {
    margin: 0,
    fontSize: '13px',
    color: '#666',
    lineHeight: 1.4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
  },
  groupPrice: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#FF7E67',
  },
  originalPrice: {
    fontSize: '13px',
    color: '#999',
    textDecoration: 'line-through',
  },
  progressSection: {
    marginTop: '4px',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#F0F0F0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 300ms ease-out',
  },
  progressText: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '6px',
    fontSize: '12px',
    color: '#666',
  },
  countdown: {
    fontFamily: 'monospace',
    color: '#FF7E67',
    fontWeight: 'bold',
    animation: 'pulse 2s ease-in-out infinite',
  },
  actionRow: {
    display: 'flex',
    gap: '8px',
    marginTop: 'auto',
    paddingTop: '8px',
  },
  joinBtn: {
    flex: 1,
    padding: '8px 12px',
    backgroundColor: '#FF7E67',
    color: '#FFF',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  shareBtn: {
    padding: '8px 12px',
    backgroundColor: '#4A90D9',
    color: '#FFF',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  detailModal: {
    backgroundColor: '#FFF8E7',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '480px',
    maxHeight: '85vh',
    overflowY: 'auto',
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #E0D5C0',
  },
  detailTitle: {
    margin: 0,
    fontSize: '18px',
    color: '#333',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    color: '#999',
    padding: 0,
    lineHeight: 1,
  },
  detailContent: {
    padding: '20px',
  },
  thumbnailLarge: {
    width: '100%',
    height: '160px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  productInitialLarge: {
    fontSize: '64px',
    color: '#FFF',
    fontWeight: 'bold',
    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#FFF',
    borderRadius: '8px',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  infoLabel: {
    fontSize: '12px',
    color: '#999',
  },
  infoValue: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
  },
  infoValuePrimary: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#FF7E67',
  },
  infoValueSecondary: {
    fontSize: '14px',
    color: '#999',
    textDecoration: 'line-through',
  },
  assignedSlot: {
    backgroundColor: '#E8F4FD',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  assignedSlotLabel: {
    fontSize: '12px',
    color: '#4A90D9',
  },
  assignedSlotValue: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#4A90D9',
  },
  membersSection: {
    marginBottom: '16px',
  },
  sectionTitle: {
    margin: '0 0 12px 0',
    fontSize: '15px',
    color: '#333',
  },
  membersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
  },
  memberItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  memberAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#4A90D9',
    color: '#FFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  memberName: {
    fontSize: '12px',
    color: '#666',
    textAlign: 'center',
  },
  shareSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#FFF',
    borderRadius: '8px',
  },
  codeDisplay: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  codeLabel: {
    fontSize: '12px',
    color: '#999',
  },
  codeValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#FF7E67',
    letterSpacing: '4px',
    fontFamily: 'monospace',
  },
  copyBtn: {
    padding: '10px 20px',
    backgroundColor: '#4A90D9',
    color: '#FFF',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
};

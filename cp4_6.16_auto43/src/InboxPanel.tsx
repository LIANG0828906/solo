import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useStore } from './store';

type FilterType = 'all' | 'unread' | 'read';

export default function InboxPanel() {
  const inquiries = useStore((s) => s.inquiries);
  const markInquiryRead = useStore((s) => s.markInquiryRead);
  const markAllInquiriesRead = useStore((s) => s.markAllInquiriesRead);
  const regenerateInquiries = useStore((s) => s.regenerateInquiries);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = useMemo(() => {
    if (filter === 'unread') return inquiries.filter((i) => !i.isRead);
    if (filter === 'read') return inquiries.filter((i) => i.isRead);
    return inquiries;
  }, [inquiries, filter]);

  const unreadCount = inquiries.filter((i) => !i.isRead).length;

  const handleCardClick = (id: string, isRead: boolean) => {
    setExpandedId((prev) => (prev === id ? null : id));
    if (!isRead) {
      void markInquiryRead(id);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>客户咨询</h1>
          <p style={styles.subtitle}>
            共 {inquiries.length} 条咨询 · 未读 <span style={styles.unreadBadge}>{unreadCount}</span>
          </p>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.secondaryBtn} onClick={regenerateInquiries}>
            🔄 刷新咨询
          </button>
          {unreadCount > 0 && (
            <button style={styles.primaryBtn} onClick={() => void markAllInquiriesRead()}>
              ✓ 全部标为已读
            </button>
          )}
        </div>
      </div>

      <div style={styles.filterContainer}>
        <div style={styles.filterTabs}>
          {(['all', 'unread', 'read'] as FilterType[]).map((f, idx) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                ...styles.filterTab,
                ...(filter === f ? styles.filterTabActive : {}),
                animation: `slideInLeft 0.3s ease ${idx * 0.05}s both`,
              }}
            >
              {f === 'all' ? '全部' : f === 'unread' ? '未读' : '已读'}
              <span style={styles.filterCount}>
                {f === 'all' ? inquiries.length : f === 'unread' ? unreadCount : inquiries.length - unreadCount}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={styles.listContainer}>
        {filtered.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>📭</div>
            <p style={styles.emptyText}>暂无咨询</p>
          </div>
        ) : (
          filtered.map((inquiry, idx) => {
            const expanded = expandedId === inquiry.id;
            return (
              <div
                key={inquiry.id}
                onClick={() => handleCardClick(inquiry.id, inquiry.isRead)}
                style={{
                  ...styles.card,
                  ...(inquiry.isRead ? styles.cardRead : {}),
                  ...(expanded ? styles.cardExpanded : {}),
                  animation: `cardFadeIn 0.5s ease ${idx * 0.08}s both`,
                }}
              >
                {!inquiry.isRead && <div style={styles.unreadDot} />}
                <div style={styles.cardContent}>
                  <div style={styles.cardHeader}>
                    <div style={styles.clientInfo}>
                      <div style={styles.avatar}>
                        {inquiry.clientName.charAt(0)}
                      </div>
                      <div>
                        <div style={styles.clientName}>{inquiry.clientName}</div>
                        <div style={styles.clientEmail}>{inquiry.email}</div>
                      </div>
                    </div>
                    <div style={styles.rightMeta}>
                      <span style={styles.projectTypeTag}>{inquiry.projectType}</span>
                      <span style={styles.time}>
                        {format(new Date(inquiry.timestamp), 'MM-dd HH:mm', { locale: zhCN })}
                      </span>
                    </div>
                  </div>
                  <p style={{
                    ...styles.message,
                    maxHeight: expanded ? '500px' : 48,
                    opacity: expanded ? 1 : 0.85,
                  }}>
                    {inquiry.message}
                  </p>
                  {expanded && (
                    <div style={styles.actionsRow}>
                      <button style={styles.actionBtn}>📧 回复邮件</button>
                      <button style={styles.actionBtnSecondary}>📋 创建项目</button>
                    </div>
                  )}
                </div>
                <div style={styles.expandIcon}>{expanded ? '▲' : '▼'}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#eee',
    marginBottom: 6,
  },
  subtitle: {
    color: '#a0a0b8',
    fontSize: 14,
  },
  unreadBadge: {
    color: '#ff6b6b',
    fontWeight: 700,
  },
  headerActions: {
    display: 'flex',
    gap: 12,
  },
  primaryBtn: {
    background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    boxShadow: '0 4px 12px rgba(79, 172, 254, 0.3)',
  },
  secondaryBtn: {
    background: '#252547',
    color: '#eee',
    padding: '10px 20px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    border: '1px solid #3a3a5c',
  },
  filterContainer: {
    background: '#16213e',
    borderRadius: 14,
    padding: 6,
    display: 'inline-flex',
    alignSelf: 'flex-start',
  },
  filterTabs: {
    display: 'flex',
    gap: 2,
  },
  filterTab: {
    background: 'transparent',
    color: '#a0a0b8',
    padding: '10px 20px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  filterTabActive: {
    background: '#252547',
    color: '#4facfe',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  filterCount: {
    background: 'rgba(79, 172, 254, 0.15)',
    color: '#4facfe',
    fontSize: 12,
    padding: '2px 8px',
    borderRadius: 10,
    fontWeight: 600,
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  card: {
    position: 'relative',
    display: 'flex',
    alignItems: 'stretch',
    background: '#252547',
    borderRadius: 16,
    padding: '20px 20px 20px 28px',
    cursor: 'pointer',
    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    border: '1px solid #3a3a5c',
    overflow: 'hidden',
  },
  cardRead: {
    background: 'linear-gradient(135deg, #252547 0%, #1e1e38 100%)',
    borderColor: 'rgba(58, 58, 92, 0.6)',
  },
  cardExpanded: {
    boxShadow: '0 8px 32px rgba(79, 172, 254, 0.12)',
    borderColor: 'rgba(79, 172, 254, 0.4)',
  },
  unreadDot: {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: '#ff6b6b',
    boxShadow: '0 0 12px rgba(255, 107, 107, 0.6)',
    animation: 'pulse 2s ease infinite',
  },
  cardContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
  },
  clientInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: 'linear-gradient(135deg, #4facfe, #667eea)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 700,
    fontSize: 16,
  },
  clientName: {
    fontWeight: 600,
    fontSize: 15,
    color: '#eee',
  },
  clientEmail: {
    fontSize: 13,
    color: '#a0a0b8',
  },
  rightMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  projectTypeTag: {
    background: 'rgba(79, 172, 254, 0.12)',
    color: '#4facfe',
    padding: '5px 12px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
  },
  time: {
    fontSize: 12,
    color: '#7a7a95',
  },
  message: {
    color: '#c5c5dc',
    fontSize: 14,
    lineHeight: 1.7,
    overflow: 'hidden',
    transition: 'all 0.35s ease',
  },
  actionsRow: {
    display: 'flex',
    gap: 12,
    paddingTop: 8,
    borderTop: '1px solid rgba(58, 58, 92, 0.5)',
    marginTop: 4,
  },
  actionBtn: {
    background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
  },
  actionBtnSecondary: {
    background: '#16213e',
    color: '#a0a0b8',
    padding: '8px 16px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    border: '1px solid #3a3a5c',
  },
  expandIcon: {
    color: '#7a7a95',
    fontSize: 12,
    marginLeft: 12,
    display: 'flex',
    alignItems: 'center',
    transition: 'transform 0.3s ease',
  },
  empty: {
    padding: '80px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  emptyIcon: {
    fontSize: 56,
    opacity: 0.5,
  },
  emptyText: {
    color: '#7a7a95',
    fontSize: 16,
  },
};

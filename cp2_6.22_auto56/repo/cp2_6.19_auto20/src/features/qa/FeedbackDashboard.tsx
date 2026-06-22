import { useState, useMemo, useRef, useEffect } from 'react';
import { useFeedbackStore, FeedbackStatus, Feedback } from '../../modules/feedback/feedbackStore';

type StatusFilter = FeedbackStatus | 'all';

const statusConfig: Record<FeedbackStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: '未处理', color: '#e67e22', bgColor: 'rgba(230, 126, 34, 0.1)' },
  processing: { label: '处理中', color: '#3498db', bgColor: 'rgba(52, 152, 219, 0.1)' },
  resolved: { label: '已处理', color: '#95a5a6', bgColor: 'rgba(149, 165, 166, 0.1)' }
};

const statusOptions: { value: FeedbackStatus; label: string }[] = [
  { value: 'pending', label: '未处理' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已处理' }
];

export default function FeedbackDashboard() {
  const { feedbacks, updateStatus, deleteFeedback, clearAll, exportToJSON } = useFeedbackStore();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rowsHeightMap, setRowsHeightMap] = useState<Record<string, { base: number; expanded: number }>>({});
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({});
  const [confirmClear, setConfirmClear] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-visible', 'true');
          }
        });
      },
      { threshold: 0.1 }
    );
    const rows = tableRef.current?.querySelectorAll('[data-row]');
    rows?.forEach(row => observer.observe(row));
    return () => observer.disconnect();
  }, [feedbacks, statusFilter]);

  const filteredFeedbacks = useMemo(() => {
    if (statusFilter === 'all') return feedbacks;
    return feedbacks.filter(f => f.status === statusFilter);
  }, [feedbacks, statusFilter]);

  const stats = useMemo(() => ({
    total: feedbacks.length,
    pending: feedbacks.filter(f => f.status === 'pending').length,
    processing: feedbacks.filter(f => f.status === 'processing').length,
    resolved: feedbacks.filter(f => f.status === 'resolved').length
  }), [feedbacks]);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStatusChange = (id: string, newStatus: FeedbackStatus) => {
    updateStatus(id, newStatus);
  };

  const toggleExpand = (id: string) => {
    const isExpanding = expandedId !== id;
    setExpandedId(prev => prev === id ? null : id);
    const heights = rowsHeightMap[id];
    if (heights) {
      setRowHeights(prev => ({
        ...prev,
        [id]: isExpanding ? heights.expanded : heights.base
      }));
      setTimeout(() => {
        setRowHeights(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }, 320);
    }
  };

  const registerRowHeight = (id: string, type: 'base' | 'expanded', height: number) => {
    setRowsHeightMap(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || { base: 60, expanded: 200 }),
        [type]: height
      }
    }));
  };

  const handleExportJSON = () => {
    const jsonStr = exportToJSON();
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const now = new Date();
    const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    link.download = `feedbacks_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClearAll = () => {
    if (confirmClear) {
      clearAll();
      setExpandedId(null);
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  const filterButtons: { value: StatusFilter; label: string; count: number; color: string }[] = [
    { value: 'all', label: '全部', count: stats.total, color: '#2c3e50' },
    { value: 'pending', label: '未处理', count: stats.pending, color: '#e67e22' },
    { value: 'processing', label: '处理中', count: stats.processing, color: '#3498db' },
    { value: 'resolved', label: '已处理', count: stats.resolved, color: '#95a5a6' }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>反馈管理后台</h1>
          <p style={styles.subtitle}>查看和管理所有用户反馈</p>
        </div>
        <div style={styles.headerActions}>
          <button
            onClick={handleExportJSON}
            style={styles.actionBarButton}
            className="action-export-button"
            disabled={feedbacks.length === 0}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>导出JSON</span>
          </button>
          <button
            onClick={handleClearAll}
            style={{
              ...styles.actionBarButton,
              ...(confirmClear ? styles.actionBarButtonDanger : {})
            }}
            className="action-clear-button"
            disabled={feedbacks.length === 0}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <span>{confirmClear ? '确认清空？' : '清空所有'}</span>
          </button>
        </div>
      </div>

      <div style={styles.statsRow}>
        {filterButtons.slice(1).map(stat => (
          <div key={stat.value} style={styles.statCard}>
            <div style={{ ...styles.statDot, backgroundColor: stat.color }} />
            <div style={styles.statInfo}>
              <span style={styles.statCount}>{stat.count}</span>
              <span style={styles.statLabel}>{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.filterBar}>
        <div style={styles.filterButtons}>
          {filterButtons.map(btn => (
            <button
              key={btn.value}
              onClick={() => setStatusFilter(btn.value)}
              style={{
                ...styles.filterButton,
                ...(statusFilter === btn.value ? {
                  ...styles.filterButtonActive,
                  backgroundColor: btn.color + '20',
                  color: btn.color,
                  borderColor: btn.color
                } : {})
              }}
              className={`filter-button ${statusFilter === btn.value ? 'filter-button-active' : ''}`}
            >
              {btn.label}
              <span style={styles.filterCount}>{btn.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div ref={tableRef} style={styles.tableContainer}>
        {filteredFeedbacks.length === 0 ? (
          <div style={styles.emptyState}>
            <svg style={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 17v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
              <circle cx="11" cy="7" r="4" />
              <path d="M21 17v2a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-2" />
            </svg>
            <p style={styles.emptyText}>暂无{statusFilter === 'all' ? '' : statusConfig[statusFilter].label}反馈记录</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead style={styles.tableHead}>
              <tr>
                <th style={styles.th}>问题</th>
                <th style={styles.th}>章节</th>
                <th style={styles.th}>置信度</th>
                <th style={styles.th}>评价</th>
                <th style={styles.th}>备注</th>
                <th style={styles.th}>提交时间</th>
                <th style={styles.th}>状态</th>
                <th style={styles.th}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeedbacks.map((feedback, index) => (
                <TableRow
                  key={feedback.id}
                  feedback={feedback}
                  index={index}
                  expanded={expandedId === feedback.id}
                  onToggle={() => toggleExpand(feedback.id)}
                  onStatusChange={handleStatusChange}
                  onDelete={deleteFeedback}
                  formatDate={formatDate}
                  forcedHeight={rowHeights[feedback.id]}
                  registerHeight={(type, h) => registerRowHeight(feedback.id, type, h)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

interface TableRowProps {
  feedback: Feedback;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onStatusChange: (id: string, status: FeedbackStatus) => void;
  onDelete: (id: string) => void;
  formatDate: (iso: string) => string;
  forcedHeight?: number;
  registerHeight?: (type: 'base' | 'expanded', height: number) => void;
}

function TableRow({ feedback, index, expanded, onToggle, onStatusChange, onDelete, formatDate, forcedHeight, registerHeight }: TableRowProps) {
  const [isChanging, setIsChanging] = useState(false);
  const baseRowRef = useRef<HTMLTableRowElement>(null);
  const expandedRowRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (baseRowRef.current && registerHeight) {
      registerHeight('base', baseRowRef.current.getBoundingClientRect().height);
    }
  }, [registerHeight]);

  useEffect(() => {
    if (expanded && expandedRowRef.current && registerHeight) {
      setTimeout(() => {
        if (expandedRowRef.current) {
          registerHeight('expanded', expandedRowRef.current.getBoundingClientRect().height);
        }
      }, 0);
    }
  }, [expanded, registerHeight]);

  const handleStatusChange = (newStatus: FeedbackStatus) => {
    setIsChanging(true);
    onStatusChange(feedback.id, newStatus);
    setTimeout(() => setIsChanging(false), 300);
  };

  const ratingLabel = feedback.rating === 'useful' ? '有用' : '无用';
  const ratingColor = feedback.rating === 'useful' ? '#27ae60' : '#e74c3c';
  const status = statusConfig[feedback.status];

  const baseRowStyle: React.CSSProperties = {
    ...styles.tr,
    ...(index % 2 === 0 ? {} : { backgroundColor: '#fafbfc' }),
    animation: `fadeIn 300ms ease ${index * 30}ms both`,
    transition: 'height 0.3s ease, background-color 0.3s ease, opacity 0.3s ease',
    opacity: isChanging ? 0.7 : 1
  };

  if (forcedHeight !== undefined) {
    baseRowStyle.height = forcedHeight + 'px';
    baseRowStyle.overflow = 'hidden';
  }

  return (
    <>
      <tr
        ref={baseRowRef}
        data-row
        style={baseRowStyle}
        className={`table-row table-row-animate`}
      >
        <td style={{ ...styles.td, ...styles.questionCell }}>
          <span style={styles.questionText}>{feedback.question}</span>
        </td>
        <td style={styles.td}>
          <span style={styles.chapterTag}>{feedback.chapterTitle}</span>
        </td>
        <td style={styles.td}>
          <span style={{ ...styles.confidenceText, color: feedback.confidence >= 70 ? '#27ae60' : feedback.confidence >= 50 ? '#f39c12' : '#e74c3c' }}>
            {feedback.confidence}%
          </span>
        </td>
        <td style={styles.td}>
          <span style={{ ...styles.ratingBadge, backgroundColor: ratingColor + '15', color: ratingColor }}>
            {feedback.rating === 'useful' ? '👍' : '👎'} {ratingLabel}
          </span>
        </td>
        <td style={{ ...styles.td, ...styles.remarkCell }}>
          {feedback.remark ? (
            <>
              <span style={styles.remarkPreview}>
                {feedback.remark.length > 15 ? feedback.remark.slice(0, 15) + '...' : feedback.remark}
              </span>
              <button onClick={onToggle} style={styles.expandButton} className="expand-button">
                {expanded ? '收起' : '展开'}
              </button>
            </>
          ) : (
            <span style={styles.noRemark}>-</span>
          )}
        </td>
        <td style={styles.td}>
          <span style={styles.dateText}>{formatDate(feedback.createdAt)}</span>
        </td>
        <td style={styles.td}>
          <div style={styles.statusWrapper}>
            <span style={{
              ...styles.statusBadge,
              backgroundColor: status.bgColor,
              color: status.color,
              transition: 'background-color 0.3s ease, color 0.3s ease'
            }}>
              {status.label}
            </span>
            <div style={styles.statusDropdown}>
              <select
                value={feedback.status}
                onChange={(e) => handleStatusChange(e.target.value as FeedbackStatus)}
                style={styles.statusSelect}
                className="status-select"
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </td>
        <td style={styles.td}>
          <button
            onClick={() => {
              if (confirm('确定删除此反馈记录？')) {
                onDelete(feedback.id);
              }
            }}
            style={styles.deleteButton}
            title="删除"
            className="delete-button"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </td>
      </tr>
      {expanded && feedback.remark && (
        <tr
          ref={expandedRowRef}
          style={{
            ...styles.expandedRow,
            animation: 'fadeIn 300ms ease',
            transition: 'all 0.3s ease'
          }}
        >
          <td colSpan={8} style={styles.expandedCell}>
            <div style={styles.expandedContent}>
              <span style={styles.expandedLabel}>完整备注：</span>
              <p style={styles.expandedText}>{feedback.remark}</p>
              <div style={styles.expandedDetail}>
                <span style={styles.expandedLabel}>匹配段落：</span>
                <p style={styles.expandedParagraph}>{feedback.paragraph}</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%'
  },
  header: {
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px'
  },
  headerLeft: {},
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#2c3e50',
    marginBottom: '6px'
  },
  subtitle: {
    fontSize: '14px',
    color: '#7f8c8d'
  },
  headerActions: {
    display: 'flex',
    gap: '10px'
  },
  actionBarButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#2c3e50',
    background: '#fff',
    border: '1px solid #e1e8ed',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 150ms ease'
  },
  actionBarButtonDanger: {
    background: '#fef2f2',
    borderColor: '#fecaca',
    color: '#dc2626',
    animation: 'pulse 1s ease-in-out infinite'
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)'
  },
  statDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%'
  },
  statInfo: {
    display: 'flex',
    flexDirection: 'column'
  },
  statCount: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#2c3e50',
    lineHeight: 1.2
  },
  statLabel: {
    fontSize: '13px',
    color: '#7f8c8d'
  },
  filterBar: {
    marginBottom: '16px'
  },
  filterButtons: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  filterButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#7f8c8d',
    background: '#fff',
    border: '1px solid #e1e8ed',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'all 150ms ease'
  },
  filterButtonActive: {
    fontWeight: 600,
    border: '1px solid'
  },
  filterCount: {
    padding: '1px 6px',
    fontSize: '11px',
    background: 'rgba(0, 0, 0, 0.08)',
    borderRadius: '10px',
    fontWeight: 600
  },
  tableContainer: {
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
    overflow: 'hidden'
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
    tableLayout: 'fixed'
  },
  tableHead: {
    position: 'sticky',
    top: 0,
    background: '#fff',
    zIndex: 10
  },
  th: {
    padding: '14px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: 600,
    color: '#7f8c8d',
    textTransform: 'none',
    borderBottom: '2px solid #ecf0f1',
    whiteSpace: 'nowrap'
  },
  tr: {
    transition: 'all 300ms ease',
    willChange: 'height, opacity'
  },
  td: {
    padding: '14px 16px',
    fontSize: '13px',
    color: '#34495e',
    borderBottom: '1px solid #ecf0f1',
    verticalAlign: 'middle'
  },
  questionCell: {
    width: '16%'
  },
  questionText: {
    fontWeight: 500,
    color: '#2c3e50'
  },
  chapterTag: {
    padding: '4px 10px',
    fontSize: '12px',
    color: '#3498db',
    background: 'rgba(52, 152, 219, 0.1)',
    borderRadius: '4px',
    whiteSpace: 'nowrap'
  },
  confidenceText: {
    fontWeight: 600
  },
  ratingBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    fontSize: '12px',
    borderRadius: '4px',
    fontWeight: 500,
    whiteSpace: 'nowrap'
  },
  remarkCell: {
    width: '15%'
  },
  remarkPreview: {
    color: '#7f8c8d'
  },
  noRemark: {
    color: '#bdc3c7'
  },
  expandButton: {
    display: 'block',
    marginTop: '4px',
    padding: 0,
    fontSize: '12px',
    color: '#3498db',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  dateText: {
    color: '#7f8c8d',
    whiteSpace: 'nowrap'
  },
  statusWrapper: {
    position: 'relative'
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: 500,
    borderRadius: '4px',
    whiteSpace: 'nowrap'
  },
  statusDropdown: {
    marginTop: '6px'
  },
  statusSelect: {
    padding: '4px 8px',
    fontSize: '12px',
    border: '1px solid #e1e8ed',
    borderRadius: '4px',
    background: '#fff',
    color: '#34495e',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 150ms ease'
  },
  deleteButton: {
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: '6px',
    background: 'transparent',
    color: '#e74c3c',
    cursor: 'pointer',
    transition: 'all 150ms ease'
  },
  expandedRow: {
    backgroundColor: '#f8f9fa'
  },
  expandedCell: {
    padding: 0,
    borderBottom: '1px solid #ecf0f1',
    overflow: 'hidden'
  },
  expandedContent: {
    padding: '16px 20px',
    animation: 'fadeIn 300ms ease'
  },
  expandedLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#7f8c8d'
  },
  expandedText: {
    marginTop: '6px',
    fontSize: '13px',
    color: '#34495e',
    lineHeight: 1.6
  },
  expandedDetail: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px dashed #e1e8ed'
  },
  expandedParagraph: {
    marginTop: '6px',
    fontSize: '13px',
    color: '#34495e',
    lineHeight: 1.6,
    background: '#fff',
    padding: '10px 12px',
    borderRadius: '6px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px'
  },
  emptyIcon: {
    width: '64px',
    height: '64px',
    color: '#bdc3c7',
    margin: '0 auto 16px'
  },
  emptyText: {
    fontSize: '14px',
    color: '#7f8c8d'
  }
};

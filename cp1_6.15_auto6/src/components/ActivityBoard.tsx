import { useState, useEffect, useRef } from 'react';
import { Activity, Product } from '../data/mockData';

const styles = `
  .board-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 14px;
  }
  .board-search {
    position: relative;
    flex: 1;
    max-width: 360px;
  }
  .board-search input {
    width: 100%;
    padding: 11px 14px 11px 42px;
    border: 1.5px solid #e1e8ef;
    border-radius: 10px;
    font-size: 13px;
    background: white;
    outline: none;
    transition: all 0.2s;
    font-family: inherit;
  }
  .board-search input:focus {
    border-color: #1A73E8;
    box-shadow: 0 0 0 4px rgba(26, 115, 232, 0.08);
  }
  .board-search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: #95a5a6;
    font-size: 15px;
  }
  .board-actions { display: flex; gap: 10px; align-items: center; }
  .filter-tabs {
    display: flex;
    background: white;
    border-radius: 10px;
    padding: 4px;
    box-shadow: 0 2px 8px rgba(26, 115, 232, 0.06);
    border: 1px solid #eaf1fa;
  }
  .filter-tab {
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    color: #7f8c8d;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .filter-tab:hover { color: #1A73E8; }
  .filter-tab.active {
    background: linear-gradient(135deg, #1A73E8, #2E86F5);
    color: white;
    box-shadow: 0 2px 8px rgba(26, 115, 232, 0.3);
  }
  .filter-count {
    background: rgba(0,0,0,0.08);
    padding: 1px 7px;
    border-radius: 10px;
    font-size: 11px;
  }
  .filter-tab.active .filter-count { background: rgba(255,255,255,0.25); }
  .board-columns {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  .board-col {
    background: #f8faff;
    border-radius: 14px;
    padding: 16px;
    min-height: 200px;
    border: 1px solid #e8eff8;
  }
  .col-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
    padding-bottom: 12px;
    border-bottom: 2px solid #e8eff8;
  }
  .col-title {
    font-size: 14px;
    font-weight: 600;
    color: #1a1a2e;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .col-dot {
    width: 10px; height: 10px;
    border-radius: 50%;
  }
  .col-count {
    background: white;
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    color: #5a6c7d;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  }
  .activity-card {
    background: white;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: 0 2px 8px rgba(26, 115, 232, 0.06);
    border: 1px solid #eef4fb;
    cursor: pointer;
    transition: all 0.25s ease;
    animation: fadeInUp 0.3s ease both;
    position: relative;
    overflow: hidden;
  }
  .activity-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 4px;
    height: 100%;
  }
  .activity-card.status-ongoing::before { background: linear-gradient(180deg, #27ae60, #2ecc71); }
  .activity-card.status-pending::before { background: linear-gradient(180deg, #f39c12, #f1c40f); }
  .activity-card.status-ended::before { background: linear-gradient(180deg, #95a5a6, #bdc3c7); }
  .activity-card.status-paused::before { background: linear-gradient(180deg, #e74c3c, #c0392b); }
  .activity-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(26, 115, 232, 0.15);
  }
  .card-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;
  }
  .card-name {
    font-size: 14px;
    font-weight: 600;
    color: #1a1a2e;
    line-height: 1.4;
    padding-right: 8px;
    flex: 1;
  }
  .status-badge {
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    flex-shrink: 0;
  }
  .status-ongoing .status-badge { background: #e8f8ef; color: #27ae60; }
  .status-pending .status-badge { background: #fff8e8; color: #f39c12; }
  .status-ended .status-badge { background: #f0f2f5; color: #7f8c8d; }
  .status-paused .status-badge { background: #fde8e8; color: #e74c3c; }
  .card-time {
    font-size: 11px;
    color: #95a5a6;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .card-type {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 6px;
    font-size: 11px;
    background: #eef4ff;
    color: #1A73E8;
    font-weight: 500;
    margin-bottom: 12px;
  }
  .card-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding: 10px;
    background: #fafbfd;
    border-radius: 10px;
    margin-bottom: 12px;
  }
  .stat-item {
    text-align: center;
  }
  .stat-val {
    font-size: 14px;
    font-weight: 700;
    color: #1a1a2e;
  }
  .stat-val.accent { color: #1A73E8; }
  .stat-val.success { color: #27ae60; }
  .stat-val.warn { color: #e67e22; }
  .stat-lbl {
    font-size: 10px;
    color: #95a5a6;
    margin-top: 2px;
  }
  .card-products {
    display: flex;
    gap: 6px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }
  .product-chip {
    padding: 3px 8px;
    background: #f5f9ff;
    border-radius: 6px;
    font-size: 10px;
    color: #5a6c7d;
    border: 1px solid #e5edf7;
  }
  .card-actions {
    display: flex;
    gap: 6px;
    padding-top: 12px;
    border-top: 1px solid #f0f4f8;
  }
  .card-btn {
    flex: 1;
    padding: 7px 10px;
    border-radius: 8px;
    border: none;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }
  .card-btn:hover { transform: translateY(-1px); }
  .card-btn.primary { background: #e8f0fe; color: #1A73E8; }
  .card-btn.primary:hover { background: #1A73E8; color: white; box-shadow: 0 3px 10px rgba(26, 115, 232, 0.3); }
  .card-btn.warning { background: #fff8e8; color: #f39c12; }
  .card-btn.warning:hover { background: #f39c12; color: white; box-shadow: 0 3px 10px rgba(243, 156, 18, 0.3); }
  .card-btn.danger { background: #fde8e8; color: #e74c3c; }
  .card-btn.danger:hover { background: #e74c3c; color: white; box-shadow: 0 3px 10px rgba(231, 76, 60, 0.3); }
  .card-btn.success { background: #e8f8ef; color: #27ae60; }
  .card-btn.success:hover { background: #27ae60; color: white; box-shadow: 0 3px 10px rgba(39, 174, 96, 0.3); }
  .card-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none !important; box-shadow: none !important; }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes modalIn {
    from { opacity: 0; transform: translateY(20px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .modal {
    background: white;
    border-radius: 18px;
    width: 90%;
    max-width: 460px;
    padding: 30px;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.2);
    animation: modalIn 0.3s ease;
    position: relative;
  }
  .modal-icon {
    width: 64px; height: 64px;
    margin: 0 auto 18px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 30px;
  }
  .modal-icon.warn { background: #fff4e5; color: #f39c12; }
  .modal-icon.danger { background: #fde8e8; color: #e74c3c; }
  .modal-title {
    text-align: center;
    font-size: 18px;
    font-weight: 700;
    color: #1a1a2e;
    margin-bottom: 10px;
  }
  .modal-desc {
    text-align: center;
    font-size: 13px;
    color: #7f8c8d;
    line-height: 1.7;
    margin-bottom: 20px;
  }
  .modal-desc strong { color: #e74c3c; }
  .countdown-container {
    margin: 18px auto;
    width: 100px;
    height: 100px;
    position: relative;
  }
  .countdown-ring {
    transform: rotate(-90deg);
    width: 100%;
    height: 100%;
  }
  .countdown-ring circle {
    fill: none;
    stroke-width: 6;
    stroke-linecap: round;
  }
  .countdown-ring .bg { stroke: #f0f4f8; }
  .countdown-ring .fg {
    stroke: #e74c3c;
    stroke-dasharray: 283;
    transition: stroke-dashoffset 0.1s linear;
  }
  .countdown-text {
    position: absolute;
    inset: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 28px;
    font-weight: 700;
    color: #e74c3c;
  }
  .modal-actions {
    display: flex;
    gap: 12px;
    margin-top: 20px;
  }
  .modal-btn {
    flex: 1;
    padding: 13px;
    border-radius: 10px;
    border: none;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
    position: relative;
    overflow: hidden;
  }
  .modal-btn.cancel { background: #f0f4f8; color: #5a6c7d; }
  .modal-btn.cancel:hover { background: #e4ebf3; }
  .modal-btn.confirm { background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; box-shadow: 0 4px 14px rgba(231, 76, 60, 0.35); }
  .modal-btn.confirm:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(231, 76, 60, 0.45); }
  .modal-btn.confirm:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  /* Detail expanded */
  .card-detail {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.35s ease, padding 0.3s ease, opacity 0.25s ease;
    opacity: 0;
  }
  .card-detail.open {
    max-height: 600px;
    padding-top: 14px;
    margin-top: 10px;
    border-top: 1px solid #eef4fb;
    opacity: 1;
  }
  .detail-section {
    margin-bottom: 12px;
  }
  .detail-title {
    font-size: 11px;
    color: #95a5a6;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
    font-weight: 600;
  }
  .detail-rules {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .rule-chip {
    padding: 4px 10px;
    background: #eef4ff;
    border-radius: 6px;
    font-size: 11px;
    color: #1A73E8;
    font-weight: 500;
  }
  .expand-hint {
    text-align: center;
    font-size: 11px;
    color: #bdc3c7;
    padding: 4px;
  }
  .empty-state {
    text-align: center;
    padding: 50px 20px;
    color: #bdc3c7;
  }
  .empty-icon { font-size: 48px; margin-bottom: 12px; opacity: 0.6; }
  .empty-text { font-size: 13px; }
  @media (max-width: 1100px) {
    .board-columns { grid-template-columns: 1fr; }
  }
  @media (max-width: 640px) {
    .board-toolbar { flex-direction: column; }
    .board-search { max-width: 100%; width: 100%; }
    .board-actions { width: 100%; justify-content: space-between; }
    .filter-tabs { overflow-x: auto; width: 100%; }
    .card-stats { grid-template-columns: 1fr 1fr; }
    .card-actions { flex-wrap: wrap; }
  }
  .toast {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #1a1a2e;
    color: white;
    padding: 12px 20px;
    border-radius: 10px;
    z-index: 2000;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    font-size: 13px;
    animation: toastIn 0.3s ease;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .toast.success { background: #27ae60; }
  .toast.error { background: #e74c3c; }
  .toast.info { background: #1A73E8; }
  @keyframes toastIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
`;

interface Props {
  onEdit: (activity: Activity) => void;
  onViewReview: (activityId: string) => void;
  onRefresh: () => void;
  onCreateNew: () => void;
}

const statusConfig = {
  ongoing: { label: '进行中', dot: '#27ae60' },
  pending: { label: '未开始', dot: '#f39c12' },
  ended: { label: '已结束', dot: '#95a5a6' },
  paused: { label: '已暂停', dot: '#e74c3c' },
};

const discountTypeLabel = {
  full_reduction: '💰 满减优惠',
  percentage: '🏷️ 打折促销',
  buy_gift: '🎁 买赠活动',
};

const ActivityBoard = ({ onEdit, onViewReview, onRefresh, onCreateNew }: Props) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [modalType, setModalType] = useState<'pause' | 'delete' | 'resume' | null>(null);
  const [modalActivity, setModalActivity] = useState<Activity | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<any>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);

  useEffect(() => {
    loadActivities();
  }, []);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/activities');
      const data = await res.json();
      setAllActivities(data);
      applyFilters(data, searchQuery, filterTab);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (data: Activity[], query: string, tab: string) => {
    let result = [...data];
    if (tab !== 'all') {
      if (tab === 'ongoing') result = result.filter(a => a.status === 'ongoing' || a.status === 'paused');
      else result = result.filter(a => a.status === tab);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.products.some(p => p.name.toLowerCase().includes(q))
      );
    }
    setActivities(result);
  };

  useEffect(() => {
    applyFilters(allActivities, searchQuery, filterTab);
  }, [searchQuery, filterTab, allActivities]);

  const grouped = {
    ongoing: activities.filter(a => a.status === 'ongoing' || a.status === 'paused'),
    pending: activities.filter(a => a.status === 'pending'),
    ended: activities.filter(a => a.status === 'ended'),
  };

  const showToast = (type: 'success' | 'error' | 'info', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2500);
  };

  const openModal = (type: 'pause' | 'delete' | 'resume', activity: Activity) => {
    setModalType(type);
    setModalActivity(activity);
    if (type === 'pause') {
      setCountdown(5);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownRef.current);
            if (prev !== null && prev === 1) confirmPause();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCountdown(null);
    }
  };

  const closeModal = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setModalType(null);
    setModalActivity(null);
    setCountdown(null);
  };

  const confirmPause = async () => {
    if (!modalActivity) return;
    try {
      const res = await fetch(`/api/activities/${modalActivity.id}/pause`, { method: 'POST' });
      if (res.ok) {
        showToast('success', '活动已暂停');
        loadActivities();
        onRefresh();
      }
    } catch (e) {
      showToast('error', '操作失败');
    }
    closeModal();
  };

  const confirmResume = async () => {
    if (!modalActivity) return;
    try {
      const res = await fetch(`/api/activities/${modalActivity.id}/resume`, { method: 'POST' });
      if (res.ok) {
        showToast('success', '活动已恢复');
        loadActivities();
        onRefresh();
      }
    } catch (e) {
      showToast('error', '操作失败');
    }
    closeModal();
  };

  const confirmDelete = async () => {
    if (!modalActivity) return;
    try {
      const res = await fetch(`/api/activities/${modalActivity.id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('success', '活动已删除');
        loadActivities();
        onRefresh();
      }
    } catch (e) {
      showToast('error', '操作失败');
    }
    closeModal();
  };

  const formatNumber = (n: number) => {
    if (n >= 10000) return (n / 10000).toFixed(1) + '万';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  };

  const renderCard = (a: Activity, idx: number) => {
    const isOpen = expandedId === a.id;
    const discountTypeText = discountTypeLabel[a.discountType];

    return (
      <div
        key={a.id}
        className={`activity-card status-${a.status}`}
        style={{ animationDelay: `${idx * 0.03}s` }}
      >
        <div
          onClick={() => setExpandedId(isOpen ? null : a.id)}
          style={{ display: 'block' }}
        >
          <div className="card-head">
            <div className="card-name">{a.name}</div>
            <span className="status-badge">
              {statusConfig[a.status as keyof typeof statusConfig].label}
            </span>
          </div>
          <div className="card-time">
            📅 {new Date(a.startTime).toLocaleDateString('zh-CN').slice(5)} ~{' '}
            {new Date(a.endTime).toLocaleDateString('zh-CN').slice(5)}
          </div>
          <span className="card-type">{discountTypeText}</span>
          <div className="card-stats">
            <div className="stat-item">
              <div className="stat-val">{formatNumber(a.stats.participants)}</div>
              <div className="stat-lbl">参与人数</div>
            </div>
            <div className="stat-item">
              <div className="stat-val accent">{formatNumber(a.stats.orders)}</div>
              <div className="stat-lbl">订单数</div>
            </div>
            <div className="stat-item">
              <div className="stat-val warn">¥{formatNumber(a.stats.totalDiscount)}</div>
              <div className="stat-lbl">优惠总额</div>
            </div>
            <div className="stat-item">
              <div className="stat-val success">{a.stats.roi}x</div>
              <div className="stat-lbl">ROI</div>
            </div>
          </div>
          <div className="card-products">
            {a.products.slice(0, 4).map(p => (
              <span key={p.id} className="product-chip">{p.image} {p.name.slice(0, 6)}</span>
            ))}
            {a.products.length > 4 && (
              <span className="product-chip">+{a.products.length - 4}</span>
            )}
          </div>
          <div className="expand-hint">{isOpen ? '▲ 收起详情' : '▼ 点击展开详情'}</div>
        </div>

        <div className={`card-detail ${isOpen ? 'open' : ''}`}>
          <div className="detail-section">
            <div className="detail-title">折扣规则</div>
            <div className="detail-rules">
              {a.rules.map((r, i) => (
                <span key={r.id} className="rule-chip">
                  {a.discountType === 'full_reduction' && `满${r.condition}元减${r.discount}元`}
                  {a.discountType === 'percentage' && `满${r.condition}件${100 - r.discount}折`}
                  {a.discountType === 'buy_gift' && `买${r.condition}件送${r.discount}件`}
                </span>
              ))}
            </div>
          </div>
          <div className="detail-section">
            <div className="detail-title">活动效益</div>
            <div className="card-stats" style={{ marginBottom: 0 }}>
              <div className="stat-item">
                <div className="stat-val accent">¥{formatNumber(a.stats.revenue)}</div>
                <div className="stat-lbl">总营收</div>
              </div>
              <div className="stat-item">
                <div className="stat-val success">¥{formatNumber(a.stats.profit)}</div>
                <div className="stat-lbl">利润</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card-actions" onClick={(e) => e.stopPropagation()}>
          <button className="card-btn primary" onClick={() => onEdit(a)}>
            ✏️ 编辑
          </button>
          {a.status === 'ongoing' && (
            <button className="card-btn warning" onClick={() => openModal('pause', a)}>
              ⏸ 暂停
            </button>
          )}
          {a.status === 'paused' && (
            <button className="card-btn success" onClick={() => confirmResume()}>
              ▶ 恢复
            </button>
          )}
          {(a.status === 'ended' || a.status === 'ongoing' || a.status === 'paused') && (
            <button
              className="card-btn success"
              disabled={a.status !== 'ended'}
              onClick={() => onViewReview(a.id)}
              title={a.status !== 'ended' ? '仅已结束活动可复盘' : '查看复盘报告'}
            >
              📈 复盘
            </button>
          )}
          <button className="card-btn danger" onClick={() => openModal('delete', a)}>
            🗑 删除
          </button>
        </div>
      </div>
    );
  };

  const renderColumn = (key: 'ongoing' | 'pending' | 'ended', title: string) => {
    const list = grouped[key];
    const cfg = statusConfig[key];
    return (
      <div className="board-col" key={key}>
        <div className="col-header">
          <div className="col-title">
            <span className="col-dot" style={{ background: cfg.dot }}></span>
            {title}
            {key === 'ongoing' && (
              <span style={{
                fontSize: 10,
                padding: '1px 6px',
                borderRadius: 8,
                background: list.some(a => a.status === 'paused') ? '#fde8e8' : 'transparent',
                color: '#e74c3c',
              }}>
                {list.filter(a => a.status === 'paused').length > 0 && `${list.filter(a => a.status === 'paused').length}暂停`}
              </span>
            )}
          </div>
          <span className="col-count">{list.length}</span>
        </div>
        {list.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-text">暂无{title}的活动</div>
          </div>
        ) : (
          list.map((a, i) => renderCard(a, i))
        )}
      </div>
    );
  };

  return (
    <>
      <style>{styles}</style>

      <div className="board-toolbar">
        <div className="board-search">
          <span className="board-search-icon">🔍</span>
          <input
            placeholder="搜索活动名称或商品..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="board-actions">
          <div className="filter-tabs">
            {[
              { key: 'all', label: '全部' },
              { key: 'ongoing', label: '进行中' },
              { key: 'pending', label: '未开始' },
              { key: 'ended', label: '已结束' },
            ].map(tab => (
              <div
                key={tab.key}
                className={`filter-tab ${filterTab === tab.key ? 'active' : ''}`}
                onClick={() => setFilterTab(tab.key)}
              >
                {tab.label}
                <span className="filter-count">
                  {tab.key === 'all' ? allActivities.length :
                    tab.key === 'ongoing' ? allActivities.filter(a => a.status === 'ongoing' || a.status === 'paused').length :
                    allActivities.filter(a => a.status === tab.key).length}
                </span>
              </div>
            ))}
          </div>
          <button
            className="btn btn-primary"
            style={{ flex: 'none', padding: '11px 18px', fontSize: 13, whiteSpace: 'nowrap' }}
            onClick={onCreateNew}
          >
            + 新建活动
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#95a5a6' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
          <div>加载活动数据中...</div>
        </div>
      ) : (
        <div className="board-columns">
          {renderColumn('ongoing', '进行中')}
          {renderColumn('pending', '未开始')}
          {renderColumn('ended', '已结束')}
        </div>
      )}

      {modalType && modalActivity && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {modalType === 'pause' && (
              <>
                <div className="modal-icon warn">⏸</div>
                <div className="modal-title">确认暂停活动？</div>
                <div className="modal-desc">
                  活动暂停后，用户将无法继续参与。<br />
                  <strong>您可以随时恢复活动。</strong>
                </div>
                {countdown !== null && countdown > 0 && (
                  <div className="countdown-container">
                    <svg className="countdown-ring" viewBox="0 0 100 100">
                      <circle className="bg" cx="50" cy="50" r="45" />
                      <circle
                        className="fg"
                        cx="50"
                        cy="50"
                        r="45"
                        style={{ strokeDashoffset: 283 * (1 - countdown / 5) }}
                      />
                    </svg>
                    <div className="countdown-text">{countdown}</div>
                  </div>
                )}
                <div className="modal-actions">
                  <button className="modal-btn cancel" onClick={closeModal}>取消</button>
                  <button className="modal-btn confirm" onClick={confirmPause} disabled={countdown === 0}>
                    {countdown !== null && countdown > 0 ? `立即暂停 (${countdown}s后自动)` : '立即暂停'}
                  </button>
                </div>
              </>
            )}

            {modalType === 'delete' && (
              <>
                <div className="modal-icon danger">⚠️</div>
                <div className="modal-title">确认删除活动？</div>
                <div className="modal-desc">
                  即将删除活动 "<strong style={{ color: '#1a1a2e' }}>{modalActivity.name}</strong>"。<br />
                  此操作不可撤销，相关数据将无法恢复。
                </div>
                <div className="modal-actions">
                  <button className="modal-btn cancel" onClick={closeModal}>取消</button>
                  <button className="modal-btn confirm" onClick={confirmDelete}>
                    确认删除
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' && '✅'}
          {toast.type === 'error' && '❌'}
          {toast.type === 'info' && 'ℹ️'}
          {toast.msg}
        </div>
      )}
    </>
  );
};

export default ActivityBoard;

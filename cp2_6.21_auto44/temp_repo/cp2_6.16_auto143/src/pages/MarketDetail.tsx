import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import HeatmapCanvas from '@/components/HeatmapCanvas';
import { Booth } from '@/types';

const MarketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    markets,
    isAdmin,
    toggleFavorite,
    favorites,
    addBooth,
    approveBooth,
    rejectBooth,
    routeBooths,
    toggleRouteBooth,
    showRoute,
    setShowRoute,
    clearRouteBooths,
  } = useAppStore();

  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyForm, setApplyForm] = useState({
    name: '',
    type: '手作文艺',
    size: 'medium' as 'small' | 'medium' | 'large',
    ownerName: '',
    description: '',
    x: 300,
    y: 250,
  });

  const market = markets.find(m => m.id === id);
  const isFavorite = favorites.includes(id || '');

  if (!market) {
    return (
      <div style={styles.errorContainer}>
        <h2>市集不存在</h2>
        <button style={styles.backBtn} onClick={() => navigate('/')}>
          返回列表
        </button>
      </div>
    );
  }

  const pendingBooths = market.booths.filter(b => b.status === 'pending');
  const approvedBooths = market.booths.filter(b => b.status === 'approved');

  const handleBoothClick = (booth: Booth) => {
    setSelectedBooth(booth);
  };

  const handleApplySubmit = () => {
    if (!applyForm.name || !applyForm.ownerName) {
      alert('请填写摊位名称和摊主姓名');
      return;
    }

    addBooth(market.id, {
      name: applyForm.name,
      type: applyForm.type,
      size: applyForm.size,
      ownerName: applyForm.ownerName,
      description: applyForm.description,
      x: applyForm.x + (Math.random() - 0.5) * 40,
      y: applyForm.y + (Math.random() - 0.5) * 40,
      heat: Math.random() * 30 + 10,
      status: 'pending',
    });

    setShowApplyModal(false);
    setApplyForm({
      name: '',
      type: '手作文艺',
      size: 'medium',
      ownerName: '',
      description: '',
      x: 300,
      y: 250,
    });
    alert('申请已提交，等待管理员审核！');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const getSizeLabel = (size: string) => {
    const labels: Record<string, string> = {
      small: '小摊位 (1.5m×1.5m)',
      medium: '中摊位 (2m×2m)',
      large: '大摊位 (3m×3m)',
    };
    return labels[size] || size;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      approved: '已通过',
      pending: '待审核',
      rejected: '已拒绝',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      approved: 'var(--success)',
      pending: 'var(--warning)',
      rejected: '#EF5350',
    };
    return colors[status] || '#999';
  };

  return (
    <div style={styles.container}>
      <button style={styles.backBtn} onClick={() => navigate('/')}>
        ← 返回列表
      </button>

      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>{market.name}</h1>
          <div style={styles.metaRow}>
            <span style={styles.metaItem}>📅 {formatDate(market.date)}</span>
            <span style={styles.metaItem}>📍 {market.location}</span>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button
            className="bounce"
            style={{
              ...styles.favoriteBtn,
              backgroundColor: isFavorite ? '#FF7043' : 'white',
              color: isFavorite ? 'white' : '#D84315',
            }}
            onClick={() => toggleFavorite(market.id)}
          >
            {isFavorite ? '❤️ 已收藏' : '🤍 收藏'}
          </button>
        </div>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.leftPanel}>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>🗺️ 摊位热力图</h2>
            <HeatmapCanvas
              booths={market.booths}
              entrance={market.entrance}
              onBoothClick={handleBoothClick}
              selectedBoothIds={routeBooths}
              showRoute={showRoute}
              routeBoothIds={routeBooths}
            />
          </div>

          {routeBooths.length > 0 && (
            <div style={styles.routeSection}>
              <h3 style={styles.routeTitle}>🚶 逛集路线</h3>
              <p style={styles.routeDesc}>
                已选择 {routeBooths.length} 个摊位
              </p>
              <div style={styles.routeActions}>
                <button
                  className="bounce"
                  style={{
                    ...styles.routeBtn,
                    backgroundColor: 'var(--accent)',
                  }}
                  onClick={() => setShowRoute(!showRoute)}
                >
                  {showRoute ? '隐藏路线' : '生成路线'}
                </button>
                <button
                  className="bounce"
                  style={{
                    ...styles.routeBtn,
                    backgroundColor: '#9E9E9E',
                  }}
                  onClick={clearRouteBooths}
                >
                  清空选择
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={styles.rightPanel}>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📝 摊主报名</h2>
            <button
              className="bounce"
              style={styles.applyBtn}
              onClick={() => setShowApplyModal(true)}
            >
              🎪 申请摊位
            </button>
            <p style={styles.applyHint}>
              填写摊位信息，提交后等待管理员审核
            </p>
          </div>

          {isAdmin && pendingBooths.length > 0 && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>⏳ 待审核 ({pendingBooths.length})</h2>
              <div style={styles.pendingList}>
                {pendingBooths.map(booth => (
                  <div key={booth.id} style={styles.pendingItem}>
                    <div style={styles.pendingInfo}>
                      <div style={styles.pendingName}>{booth.name}</div>
                      <div style={styles.pendingMeta}>
                        {booth.type} · {getSizeLabel(booth.size)}
                      </div>
                      <div style={styles.pendingOwner}>摊主: {booth.ownerName}</div>
                    </div>
                    <div style={styles.pendingActions}>
                      <button
                        className="bounce"
                        style={{ ...styles.actionBtn, backgroundColor: 'var(--success)' }}
                        onClick={() => approveBooth(market.id, booth.id)}
                      >
                        通过
                      </button>
                      <button
                        className="bounce"
                        style={{ ...styles.actionBtn, backgroundColor: '#EF5350' }}
                        onClick={() => rejectBooth(market.id, booth.id)}
                      >
                        拒绝
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedBooth && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>🎯 摊位详情</h2>
              <div style={styles.boothDetail}>
                <h3 style={styles.boothName}>{selectedBooth.name}</h3>
                <div style={styles.boothType}>{selectedBooth.type}</div>
                <div style={styles.boothMeta}>
                  <span>尺寸: {getSizeLabel(selectedBooth.size)}</span>
                  <span style={styles.heatDisplay}>
                    热度: {'🔥'.repeat(Math.ceil(selectedBooth.heat / 25))}
                  </span>
                </div>
                {selectedBooth.ownerName && (
                  <div style={styles.boothOwner}>摊主: {selectedBooth.ownerName}</div>
                )}
                {selectedBooth.description && (
                  <p style={styles.boothDesc}>{selectedBooth.description}</p>
                )}
                <div
                  style={{
                    ...styles.statusBadge,
                    backgroundColor: getStatusColor(selectedBooth.status),
                  }}
                >
                  {getStatusLabel(selectedBooth.status)}
                </div>
                {selectedBooth.status === 'approved' && (
                  <button
                    className="bounce"
                    style={{
                      ...styles.addRouteBtn,
                      backgroundColor: routeBooths.includes(selectedBooth.id)
                        ? '#FF7043'
                        : 'var(--success)',
                    }}
                    onClick={() => toggleRouteBooth(selectedBooth.id)}
                  >
                    {routeBooths.includes(selectedBooth.id)
                      ? '✓ 已加入路线'
                      : '➕ 加入逛集路线'}
                  </button>
                )}
              </div>
            </div>
          )}

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📊 市集信息</h2>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>摊位数量</span>
                <span style={styles.infoValue}>{approvedBooths.length}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>热门程度</span>
                <span style={styles.infoValue}>
                  {'⭐'.repeat(market.popularity)}
                </span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>类型</span>
                <span style={styles.infoValue}>
                  {market.type === 'secondhand' && '二手市集'}
                  {market.type === 'handmade' && '手作市集'}
                  {market.type === 'food' && '美食市集'}
                  {market.type === 'mixed' && '综合市集'}
                </span>
              </div>
            </div>
            <p style={styles.marketDesc}>{market.description}</p>
          </div>
        </div>
      </div>

      {showApplyModal && (
        <div style={styles.modalOverlay} onClick={() => setShowApplyModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>🎪 申请摊位</h2>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>摊位名称 *</label>
              <input
                type="text"
                style={styles.input}
                value={applyForm.name}
                onChange={e => setApplyForm({ ...applyForm, name: e.target.value })}
                placeholder="请输入摊位名称"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>商品类型</label>
              <select
                style={styles.input}
                value={applyForm.type}
                onChange={e => setApplyForm({ ...applyForm, type: e.target.value })}
              >
                <option value="手作文艺">手作文艺</option>
                <option value="二手复古">二手复古</option>
                <option value="美食小吃">美食小吃</option>
                <option value="创意设计">创意设计</option>
                <option value="绿植花卉">绿植花卉</option>
                <option value="潮玩手办">潮玩手办</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>摊位尺寸</label>
              <div style={styles.sizeOptions}>
                {(['small', 'medium', 'large'] as const).map(size => (
                  <button
                    key={size}
                    type="button"
                    style={{
                      ...styles.sizeOption,
                      backgroundColor: applyForm.size === size ? 'var(--accent)' : '#f5f5f5',
                      color: applyForm.size === size ? 'white' : 'var(--text-primary)',
                    }}
                    onClick={() => setApplyForm({ ...applyForm, size })}
                  >
                    {getSizeLabel(size)}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>摊主姓名 *</label>
              <input
                type="text"
                style={styles.input}
                value={applyForm.ownerName}
                onChange={e => setApplyForm({ ...applyForm, ownerName: e.target.value })}
                placeholder="请输入您的姓名"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>摊位简介</label>
              <textarea
                style={{ ...styles.input, height: '80px', resize: 'vertical' }}
                value={applyForm.description}
                onChange={e => setApplyForm({ ...applyForm, description: e.target.value })}
                placeholder="简单介绍一下您的摊位..."
              />
            </div>

            <div style={styles.modalActions}>
              <button
                style={{ ...styles.modalBtn, backgroundColor: '#9E9E9E' }}
                onClick={() => setShowApplyModal(false)}
              >
                取消
              </button>
              <button
                className="bounce"
                style={{ ...styles.modalBtn, backgroundColor: 'var(--accent)' }}
                onClick={handleApplySubmit}
              >
                提交申请
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    flex: 1,
    overflowY: 'auto',
  },
  errorContainer: {
    padding: '40px',
    textAlign: 'center',
  },
  backBtn: {
    padding: '8px 16px',
    borderRadius: '20px',
    backgroundColor: 'white',
    color: 'var(--text-primary)',
    fontWeight: 500,
    fontSize: '14px',
    marginBottom: '16px',
    border: '1px solid rgba(216, 67, 21, 0.3)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: '32px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
    marginBottom: '8px',
  },
  metaRow: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },
  metaItem: {
    fontSize: '15px',
    color: 'var(--text-secondary)',
  },
  headerRight: {
    display: 'flex',
    gap: '12px',
  },
  favoriteBtn: {
    padding: '10px 20px',
    borderRadius: '24px',
    fontWeight: 600,
    fontSize: '14px',
    border: '2px solid var(--accent)',
  },
  mainContent: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
  },
  leftPanel: {
    flex: '1 1 500px',
    minWidth: 0,
  },
  rightPanel: {
    flex: '0 0 320px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius)',
    border: '2px solid var(--border-color)',
    padding: '20px',
    boxShadow: 'var(--shadow)',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: 0,
    marginBottom: '16px',
  },
  applyBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '12px',
  },
  applyHint: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    margin: 0,
    textAlign: 'center',
  },
  pendingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  pendingItem: {
    padding: '12px',
    backgroundColor: '#FFF8E1',
    borderRadius: '10px',
    border: '1px solid rgba(216, 67, 21, 0.2)',
  },
  pendingInfo: {
    marginBottom: '10px',
  },
  pendingName: {
    fontWeight: 600,
    fontSize: '14px',
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  pendingMeta: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    marginBottom: '2px',
  },
  pendingOwner: {
    fontSize: '12px',
    color: 'var(--accent)',
  },
  pendingActions: {
    display: 'flex',
    gap: '8px',
  },
  actionBtn: {
    flex: 1,
    padding: '8px',
    borderRadius: '8px',
    color: 'white',
    fontSize: '13px',
    fontWeight: 600,
  },
  boothDetail: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  boothName: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
  },
  boothType: {
    fontSize: '14px',
    color: 'var(--accent)',
    fontWeight: 500,
  },
  boothMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  heatDisplay: {
    fontSize: '14px',
  },
  boothOwner: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  boothDesc: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    margin: 0,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    padding: '4px 12px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 600,
  },
  addRouteBtn: {
    width: '100%',
    padding: '10px',
    color: 'white',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
    marginTop: '8px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '16px',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  infoLabel: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  infoValue: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  marketDesc: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    margin: 0,
  },
  routeSection: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius)',
    border: '2px solid var(--accent)',
    padding: '16px 20px',
    marginTop: '20px',
  },
  routeTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: 0,
    marginBottom: '8px',
  },
  routeDesc: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    margin: 0,
    marginBottom: '12px',
  },
  routeActions: {
    display: 'flex',
    gap: '10px',
  },
  routeBtn: {
    flex: 1,
    padding: '10px',
    color: 'white',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 600,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(62, 39, 35, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius)',
    padding: '28px',
    width: '100%',
    maxWidth: '480px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  },
  modalTitle: {
    fontSize: '22px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
    marginBottom: '20px',
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '2px solid rgba(216, 67, 21, 0.3)',
    borderRadius: '10px',
    fontSize: '14px',
    fontFamily: 'inherit',
    transition: 'border-color 200ms ease',
    outline: 'none',
  },
  sizeOptions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  sizeOption: {
    flex: 1,
    minWidth: '100px',
    padding: '10px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 500,
    textAlign: 'center',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  },
  modalBtn: {
    flex: 1,
    padding: '12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '15px',
    fontWeight: 600,
  },
};

export default MarketDetail;

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';
import { logout } from '../api/authApi';

interface ToolbarProps {
  onNewProject: () => void;
  onSave: () => void;
  onExport: () => void;
  onClear: () => void;
  onProjects: () => void;
  isSaving: boolean;
  lastSaved: Date | null;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onNewProject,
  onSave,
  onExport,
  onClear,
  onProjects,
  isSaving,
  lastSaved,
}) => {
  const navigate = useNavigate();
  const { user, currentProject, calculateUsage, fabrics, clearAllCells, setUser } = useProjectStore();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showCostModal, setShowCostModal] = useState(false);

  const usage = calculateUsage();
  const fabricMap = new Map(fabrics.map((f) => [f.id, f]));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate('/');
  };

  return (
    <>
      <div style={styles.toolbar}>
        <div style={styles.leftSection}>
          <div style={styles.brand}>
            <span style={styles.brandIcon}>🧵</span>
            <span style={styles.brandText}>拼布工作室</span>
          </div>

          <div style={styles.divider} />

          <button onClick={onProjects} style={styles.navBtn}>
            📂 项目
          </button>
          <button onClick={onNewProject} style={styles.navBtn}>
            ➕ 新建
          </button>
        </div>

        <div style={styles.centerSection}>
          <div style={styles.projectName}>
            {currentProject ? currentProject.name : '未开始项目'}
          </div>
          {lastSaved && (
            <div style={styles.saveStatus}>
              {isSaving ? (
                <><span style={styles.savingDot} />正在保存...</>
              ) : (
                <span>
                  ✓ {lastSaved.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} 保存
                </span>
              )}
            </div>
          )}
        </div>

        <div style={styles.rightSection}>
          {currentProject && (
            <>
              <div
                style={styles.costPill}
                onClick={() => setShowCostModal(true)}
                title="点击查看布料用量明细"
              >
                <span style={styles.costLabel}>预估成本</span>
                <span style={styles.costValue}>¥{usage.totalCost.toFixed(2)}</span>
              </div>
              <button onClick={onClear} style={styles.actionBtn} title="清空画布">
                🗑️
              </button>
            </>
          )}
          <button
            onClick={onExport}
            style={styles.actionBtn}
            title="导出为PNG图片"
          >
            🖼️
          </button>
          <button
            onClick={onSave}
            style={{ ...styles.actionBtn, ...styles.primaryBtn }}
            title="手动保存"
          >
            💾
          </button>

          <div style={styles.divider} />

          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              style={styles.avatarBtn}
            >
              <div
                style={{
                  ...styles.avatar,
                  background: user?.avatarColor || '#B87333',
                }}
              >
                {user?.displayName?.charAt(0) || 'U'}
              </div>
            </button>

            {showMenu && (
              <div style={styles.userMenu}>
                <div style={styles.userInfo}>
                  <div
                    style={{
                      ...styles.avatar,
                      ...styles.bigAvatar,
                      background: user?.avatarColor || '#B87333',
                    }}
                  >
                    {user?.displayName?.charAt(0) || 'U'}
                  </div>
                  <div style={styles.userDetails}>
                    <div style={styles.userName}>{user?.displayName}</div>
                    <div style={styles.userRole}>
                      {user?.role === 'admin' ? '管理员' : '设计师'}
                    </div>
                  </div>
                </div>
                <div style={styles.menuDivider} />
                {user?.role === 'admin' && (
                  <button
                    onClick={() => {
                      navigate('/admin/fabrics');
                      setShowMenu(false);
                    }}
                    style={styles.menuItem}
                  >
                    ⚙️ 布料库管理
                  </button>
                )}
                <button onClick={handleLogout} style={styles.menuItem}>
                  🚪 退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCostModal && currentProject && (
        <>
          <div
            style={styles.modalOverlay}
            onClick={() => setShowCostModal(false)}
          />
          <div style={styles.costModal}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}>📋 布料用量与成本明细</div>
              <button
                onClick={() => setShowCostModal(false)}
                style={styles.modalClose}
              >
                ✕
              </button>
            </div>
            <div style={styles.costContent}>
              <div style={styles.costSummary}>
                <div style={styles.summaryLabel}>预估总成本</div>
                <div style={styles.summaryValue}>¥{usage.totalCost.toFixed(2)}</div>
              </div>
              <div style={styles.usageHeader}>
                <span>布料</span>
                <span>用量</span>
                <span>小计</span>
              </div>
              <div style={styles.usageList}>
                {usage.fabricUsage.length === 0 ? (
                  <div style={styles.emptyUsage}>暂无布料数据，请先在画布上放置色块</div>
                ) : (
                  usage.fabricUsage.map((u) => {
                    const fabric = fabricMap.get(u.fabricId);
                    if (!fabric) return null;
                    return (
                      <div key={u.fabricId} style={styles.usageRow}>
                        <div style={styles.fabricCol}>
                          <span
                            style={{
                              ...styles.fabricSwatch,
                              background: fabric.gradient,
                            }}
                          />
                          <span style={styles.fabricName}>{fabric.name}</span>
                        </div>
                        <div style={styles.usageCol}>
                          {u.cellCount} 格 / {u.areaM2.toFixed(4)} m²
                        </div>
                        <div style={styles.costCol}>¥{u.cost.toFixed(2)}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  toolbar: {
    height: 60,
    minHeight: 60,
    background: '#FFFAF4',
    borderBottom: '1px solid #D7C4A1',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    gap: 8,
    boxShadow: '0 2px 8px rgba(93, 64, 55, 0.05)',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    paddingRight: 8,
  },
  brandIcon: {
    fontSize: 22,
  },
  brandText: {
    fontSize: 15,
    fontWeight: 700,
    color: '#5D4037',
  },
  divider: {
    width: 1,
    height: 28,
    background: '#E8DDD0',
    margin: '0 8px',
  },
  navBtn: {
    padding: '8px 14px',
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    color: '#5D4037',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.15s',
    fontFamily: 'inherit',
  },
  centerSection: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  projectName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#5D4037',
    background: '#F5F0E8',
    padding: '6px 16px',
    borderRadius: 16,
    border: '1px solid #D7C4A1',
  },
  saveStatus: {
    fontSize: 11,
    color: '#8D6E63',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  savingDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#B87333',
    animation: 'pulse 1.5s infinite',
    display: 'inline-block',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  costPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    borderRadius: 20,
    background: 'linear-gradient(135deg, #B87333 0%, #A6622A 100%)',
    color: '#FFFAF4',
    cursor: 'pointer',
    border: 'none',
  },
  costLabel: {
    fontSize: 11,
    opacity: 0.9,
  },
  costValue: {
    fontSize: 14,
    fontWeight: 700,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    border: '1px solid #D7C4A1',
    background: '#FFFAF4',
    cursor: 'pointer',
    fontSize: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
  },
  primaryBtn: {
    background: 'linear-gradient(135deg, #B87333 0%, #A6622A 100%)',
    border: 'none',
    color: '#FFFAF4',
  },
  avatarBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFAF4',
    fontWeight: 700,
    fontSize: 14,
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
  },
  bigAvatar: {
    width: 48,
    height: 48,
    fontSize: 18,
  },
  userMenu: {
    position: 'absolute',
    top: 52,
    right: 0,
    width: 220,
    background: '#FFFAF4',
    borderRadius: 12,
    boxShadow: '0 12px 32px rgba(93, 64, 55, 0.2)',
    border: '1px solid #E8DDD0',
    overflow: 'hidden',
    zIndex: 200,
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#5D4037',
  },
  userRole: {
    fontSize: 11,
    color: '#8D6E63',
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    background: '#E8DDD0',
    margin: '0 16px',
  },
  menuItem: {
    width: '100%',
    padding: '12px 16px',
    border: 'none',
    background: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: 13,
    color: '#5D4037',
    fontFamily: 'inherit',
    transition: 'background 0.15s',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.4)',
    zIndex: 300,
    animation: 'fadeIn 0.3s ease',
  },
  costModal: {
    position: 'fixed',
    left: '50%',
    bottom: 0,
    transform: 'translateX(-50%)',
    width: 480,
    maxWidth: '90vw',
    maxHeight: '70vh',
    background: '#FFFAF4',
    borderRadius: '20px 20px 0 0',
    boxShadow: '0 -8px 40px rgba(0, 0, 0, 0.2)',
    zIndex: 301,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    animation: 'slideUp 0.35s ease',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #E8DDD0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#5D4037',
  },
  modalClose: {
    border: 'none',
    background: 'none',
    fontSize: 18,
    cursor: 'pointer',
    color: '#8D6E63',
    padding: 4,
  },
  costContent: {
    padding: 20,
    overflowY: 'auto',
  },
  costSummary: {
    background: 'linear-gradient(135deg, #B87333 0%, #A6622A 100%)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255, 250, 244, 0.8)',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 700,
    color: '#FFFAF4',
  },
  usageHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr',
    gap: 8,
    padding: '8px 4px',
    fontSize: 11,
    fontWeight: 600,
    color: '#8D6E63',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  usageList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  emptyUsage: {
    textAlign: 'center',
    padding: 32,
    color: '#8D6E63',
    fontSize: 13,
  },
  usageRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr',
    gap: 8,
    padding: '10px 12px',
    background: '#F5F0E8',
    borderRadius: 8,
    alignItems: 'center',
  },
  fabricCol: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  fabricSwatch: {
    width: 24,
    height: 24,
    borderRadius: 4,
    display: 'inline-block',
    border: '1px solid #D7C4A1',
  },
  fabricName: {
    fontSize: 13,
    fontWeight: 500,
    color: '#5D4037',
  },
  usageCol: {
    fontSize: 11,
    color: '#8D6E63',
  },
  costCol: {
    fontSize: 13,
    fontWeight: 600,
    color: '#B87333',
    textAlign: 'right',
  },
};

export default Toolbar;

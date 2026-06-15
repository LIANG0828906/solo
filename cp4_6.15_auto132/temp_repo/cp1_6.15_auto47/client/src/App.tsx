import { useState, useEffect, useCallback } from 'react';
import MapGrid from './components/MapGrid';
import PlantLog from './components/PlantLog';
import NoticeBoard from './components/NoticeBoard';
import type { Plot, Notice, GrowthLog } from './types';
import {
  getPlots,
  getNotices,
  addPlotLog,
  updatePlotLog,
  deletePlotLog,
  likeNotice,
  addComment,
} from './api/dataService';

type TabType = 'map' | 'notices';

const CURRENT_USER = '小明';

export default function App() {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('map');
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [panelClosing, setPanelClosing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewDetailPlotId, setViewDetailPlotId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [plotsData, noticesData] = await Promise.all([getPlots(), getNotices()]);
      setPlots(plotsData);
      setNotices(noticesData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedPlot = plots.find((p) => p.id === selectedPlotId) || null;
  const detailPlot = plots.find((p) => p.id === viewDetailPlotId) || null;

  const handlePlotClick = (plotId: string) => {
    setPanelClosing(false);
    setSelectedPlotId(plotId);
  };

  const handleClosePanel = () => {
    setPanelClosing(true);
    setTimeout(() => {
      setSelectedPlotId(null);
      setPanelClosing(false);
    }, 300);
  };

  const handleViewDetail = () => {
    if (selectedPlotId) {
      setViewDetailPlotId(selectedPlotId);
      handleClosePanel();
    }
  };

  const handleBackFromDetail = () => {
    setViewDetailPlotId(null);
  };

  const handleAddLog = async (plotId: string, log: Omit<GrowthLog, 'id'>) => {
    try {
      await addPlotLog(plotId, log);
      const updatedPlots = await getPlots();
      setPlots(updatedPlots);
    } catch (err) {
      console.error('Failed to add log:', err);
      alert('添加失败，请重试');
    }
  };

  const handleUpdateLog = async (
    plotId: string,
    logId: string,
    log: Partial<GrowthLog>
  ) => {
    try {
      await updatePlotLog(plotId, logId, log);
      const updatedPlots = await getPlots();
      setPlots(updatedPlots);
    } catch (err) {
      console.error('Failed to update log:', err);
      alert('更新失败，请重试');
    }
  };

  const handleDeleteLog = async (plotId: string, logId: string) => {
    try {
      await deletePlotLog(plotId, logId);
      const updatedPlots = await getPlots();
      setPlots(updatedPlots);
    } catch (err) {
      console.error('Failed to delete log:', err);
      alert('删除失败，请重试');
    }
  };

  const handleLikeNotice = async (noticeId: string) => {
    try {
      await likeNotice(noticeId, CURRENT_USER);
      const updatedNotices = await getNotices();
      setNotices(updatedNotices);
    } catch (err) {
      console.error('Failed to like notice:', err);
    }
  };

  const handleAddComment = async (noticeId: string, content: string) => {
    try {
      await addComment(noticeId, { author: CURRENT_USER, content });
      const updatedNotices = await getNotices();
      setNotices(updatedNotices);
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const stats = {
    total: plots.length,
    idle: plots.filter((p) => p.status === 'idle').length,
    claimed: plots.filter((p) => p.status === 'claimed').length,
    harvest: plots.filter((p) => p.status === 'harvest').length,
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🌱</div>
        <div style={{ fontSize: '18px', color: '#666' }}>菜园正在苏醒中...</div>
      </div>
    );
  }

  if (detailPlot) {
    return (
      <div style={styles.app}>
        <header style={styles.header}>
          <div style={styles.headerInner}>
            <button onClick={handleBackFromDetail} style={styles.backBtn}>
              ← 返回地图
            </button>
            <div style={styles.logo}>
              <span style={styles.logoEmoji}>🌿</span>
              <span style={styles.logoText}>社区共享菜园</span>
            </div>
            <div style={{ width: '100px' }} />
          </div>
        </header>

        <main style={styles.main}>
          <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
            <div style={styles.detailHeader}>
              <div>
                <div style={styles.detailPlotNumber}>
                  地块 {detailPlot.plotNumber}
                </div>
                <div style={styles.detailCrop}>
                  {detailPlot.status === 'idle'
                    ? '空闲地块'
                    : `种植：${detailPlot.crop} · 已生长 ${detailPlot.growthDays} 天`}
                </div>
              </div>
              {detailPlot.status !== 'idle' && (
                <div style={styles.detailClaimant}>
                  <div style={styles.claimantAvatar}>
                    {detailPlot.claimant.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: '#999' }}>认领人</div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#333' }}>
                      {detailPlot.claimant}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {detailPlot.status !== 'idle' && (
              <PlantLog
                plotId={detailPlot.id}
                logs={detailPlot.logs}
                onAdd={(log) => handleAddLog(detailPlot.id, log)}
                onUpdate={(logId, log) => handleUpdateLog(detailPlot.id, logId, log)}
                onDelete={(logId) => handleDeleteLog(detailPlot.id, logId)}
              />
            )}

            {detailPlot.status === 'idle' && (
              <div style={styles.idleDetail}>
                <div style={{ fontSize: '72px', marginBottom: '16px' }}>🌾</div>
                <div style={{ fontSize: '20px', color: '#333', marginBottom: '8px' }}>
                  这块菜地还没有被认领
                </div>
                <div style={{ fontSize: '14px', color: '#888' }}>
                  联系管理员来认领这块属于你的小菜园吧~
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>
            <span style={styles.logoEmoji}>🌿</span>
            <span style={styles.logoText}>社区共享菜园</span>
          </div>
          <nav style={styles.tabs}>
            <button
              onClick={() => setActiveTab('map')}
              style={{
                ...styles.tab,
                ...(activeTab === 'map' ? styles.tabActive : {}),
              }}
            >
              🗺️ 菜园地图
            </button>
            <button
              onClick={() => setActiveTab('notices')}
              style={{
                ...styles.tab,
                ...(activeTab === 'notices' ? styles.tabActive : {}),
              }}
            >
              📢 公告板
            </button>
          </nav>
          <div style={styles.userInfo}>
            <span style={styles.userAvatar}>{CURRENT_USER.charAt(0)}</span>
            <span style={styles.userName}>{CURRENT_USER}</span>
          </div>
        </div>
      </header>

      {activeTab === 'map' && (
        <div style={styles.statsBar}>
          <div style={styles.statItem}>
            <span style={{ ...styles.statNum, color: '#555' }}>{stats.total}</span>
            <span style={styles.statLabel}>总地块</span>
          </div>
          <div style={styles.statItem}>
            <span style={{ ...styles.statNum, color: '#66BB6A' }}>{stats.idle}</span>
            <span style={styles.statLabel}>空闲</span>
          </div>
          <div style={styles.statItem}>
            <span style={{ ...styles.statNum, color: '#FF9800' }}>{stats.claimed}</span>
            <span style={styles.statLabel}>已认领</span>
          </div>
          <div style={styles.statItem}>
            <span style={{ ...styles.statNum, color: '#E53935' }}>{stats.harvest}</span>
            <span style={styles.statLabel}>收获中</span>
          </div>
        </div>
      )}

      <main style={styles.main}>
        {activeTab === 'map' && (
          <MapGrid plots={plots} onPlotClick={handlePlotClick} />
        )}

        {activeTab === 'notices' && (
          <NoticeBoard
            notices={notices}
            currentUser={CURRENT_USER}
            onLike={handleLikeNotice}
            onAddComment={handleAddComment}
          />
        )}
      </main>

      {selectedPlot && (
        <div
          style={{
            ...styles.overlay,
            opacity: panelClosing ? 0 : 1,
            pointerEvents: panelClosing ? 'none' : 'auto',
          }}
          onClick={handleClosePanel}
        />
      )}

      {selectedPlot && (
        <div
          style={{
            ...styles.sidePanel,
            transform: panelClosing ? 'translateX(100%)' : 'translateX(0)',
            animation: !panelClosing ? 'slideInRight 0.3s ease' : undefined,
          }}
        >
          <button style={styles.closeBtn} onClick={handleClosePanel}>
            ✕
          </button>

          <div style={styles.panelHeader}>
            <div style={styles.panelPlotNumber}>地块 {selectedPlot.plotNumber}</div>
            <div
              style={{
                ...styles.panelStatusTag,
                backgroundColor:
                  selectedPlot.status === 'idle'
                    ? '#66BB6A'
                    : selectedPlot.status === 'claimed'
                    ? '#FF9800'
                    : '#E53935',
              }}
            >
              {selectedPlot.status === 'idle'
                ? '空闲'
                : selectedPlot.status === 'claimed'
                ? '已认领'
                : '收获中'}
            </div>
          </div>

          {selectedPlot.status !== 'idle' ? (
            <>
              <div style={styles.panelSection}>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>认领人</span>
                  <div style={styles.infoClaimant}>
                    <div style={styles.infoAvatar}>
                      {selectedPlot.claimant.charAt(0).toUpperCase()}
                    </div>
                    <span style={styles.infoValue}>{selectedPlot.claimant}</span>
                  </div>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>种植作物</span>
                  <span style={{ ...styles.infoValue, fontWeight: 600, fontSize: '16px' }}>
                    🌱 {selectedPlot.crop}
                  </span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>生长天数</span>
                  <span style={styles.infoValue}>
                    <strong style={{ color: 'var(--primary-green)', fontSize: '18px' }}>
                      {selectedPlot.growthDays}
                    </strong>{' '}
                    天
                  </span>
                </div>
              </div>

              <div style={styles.panelSection}>
                <div style={styles.sectionTitle}>最近记录</div>
                {selectedPlot.logs.length === 0 ? (
                  <div style={styles.noLogs}>暂无生长记录</div>
                ) : (
                  <div style={styles.recentLogs}>
                    {[...selectedPlot.logs]
                      .sort(
                        (a, b) =>
                          new Date(b.date).getTime() - new Date(a.date).getTime()
                      )
                      .slice(0, 2)
                      .map((log) => (
                        <div key={log.id} style={styles.recentLogItem}>
                          <div style={styles.logDot} />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 500, color: '#333' }}>
                              {log.date} · {log.height}cm
                            </div>
                            {log.note && (
                              <div
                                style={{
                                  fontSize: '12px',
                                  color: '#888',
                                  marginTop: '2px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: '200px',
                                }}
                              >
                                {log.note}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <button onClick={handleViewDetail} style={styles.viewDetailBtn}>
                查看详情 →
              </button>
            </>
          ) : (
            <div style={styles.panelIdle}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🌾</div>
              <div style={{ fontSize: '16px', color: '#333', marginBottom: '8px' }}>
                这块菜地空闲中
              </div>
              <div style={{ fontSize: '13px', color: '#888', textAlign: 'center', lineHeight: 1.6 }}>
                如果你想在这里种植自己喜欢的蔬菜，
                <br />
                可以联系社区管理员进行认领~
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    backgroundColor: 'var(--wood-color)',
  },
  loading: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--wood-color)',
  },
  header: {
    backgroundColor: '#fff',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  headerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
  },
  backBtn: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: 'var(--primary-green-dark)',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '6px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoEmoji: {
    fontSize: '28px',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--primary-green-dark)',
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    backgroundColor: '#f5f5f5',
    padding: '4px',
    borderRadius: '10px',
  },
  tab: {
    padding: '8px 20px',
    backgroundColor: 'transparent',
    fontSize: '14px',
    color: '#666',
    borderRadius: '7px',
    fontWeight: 500,
  },
  tabActive: {
    backgroundColor: '#fff',
    color: 'var(--primary-green-dark)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  userAvatar: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary-green)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: '14px',
  },
  userName: {
    fontSize: '14px',
    color: '#333',
    fontWeight: 500,
  },
  statsBar: {
    backgroundColor: '#fff',
    borderBottom: '1px solid rgba(0,0,0,0.04)',
  },
  statItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 28px',
  },
  statNum: {
    fontSize: '24px',
    fontWeight: 700,
  },
  statLabel: {
    fontSize: '13px',
    color: '#888',
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 100,
    transition: 'opacity 0.3s ease',
  },
  sidePanel: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '380px',
    maxWidth: '90vw',
    height: '100vh',
    backgroundColor: '#fff',
    zIndex: 101,
    boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
    padding: '32px 24px',
    overflowY: 'auto',
    transition: 'transform 0.3s ease',
  },
  closeBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#f5f5f5',
    color: '#666',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '20px',
    borderBottom: '1px solid #f0f0f0',
  },
  panelPlotNumber: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#333',
  },
  panelStatusTag: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#fff',
    padding: '5px 12px',
    borderRadius: '5px',
  },
  panelSection: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#999',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #fafafa',
  },
  infoLabel: {
    fontSize: '14px',
    color: '#888',
  },
  infoValue: {
    fontSize: '14px',
    color: '#333',
  },
  infoClaimant: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  infoAvatar: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary-green)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 600,
  },
  recentLogs: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  recentLogItem: {
    display: 'flex',
    gap: '10px',
    padding: '10px 12px',
    backgroundColor: '#FAF8F3',
    borderRadius: '8px',
  },
  logDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary-green)',
    marginTop: '6px',
    flexShrink: 0,
  },
  noLogs: {
    fontSize: '13px',
    color: '#bbb',
    padding: '16px',
    textAlign: 'center',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
  },
  panelIdle: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 10px',
  },
  viewDetailBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: 'var(--primary-green)',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 500,
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    padding: '24px',
    backgroundColor: '#fff',
    borderRadius: 'var(--border-radius)',
    boxShadow: 'var(--shadow)',
    flexWrap: 'wrap',
    gap: '16px',
  },
  detailPlotNumber: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#333',
    marginBottom: '6px',
  },
  detailCrop: {
    fontSize: '14px',
    color: '#888',
  },
  detailClaimant: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 16px',
    backgroundColor: 'var(--wood-color)',
    borderRadius: '8px',
  },
  claimantAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary-green)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: '16px',
  },
  idleDetail: {
    backgroundColor: '#fff',
    borderRadius: 'var(--border-radius)',
    boxShadow: 'var(--shadow)',
    padding: '80px 24px',
    textAlign: 'center',
  },
};

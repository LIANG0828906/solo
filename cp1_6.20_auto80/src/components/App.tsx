import { useState, useEffect, useMemo, useRef } from 'react';
import MapView from './MapView';
import LogForm from './LogForm';
import RoutePlanner from './RoutePlanner';
import { api } from '../utils/api';
import type { Log, Route } from '../types';

type Page = 'logs' | 'route' | 'share';

interface MarkerCardPos {
  x: number;
  y: number;
  lat: number;
  lng: number;
}

function parseHashRoute(): { page: Page; routeId?: string } {
  const hash = window.location.hash.slice(1);
  if (hash.startsWith('/routes/')) {
    return { page: 'share', routeId: hash.slice('/routes/'.length) };
  }
  return { page: 'logs' };
}

export default function App() {
  const [page, setPage] = useState<Page>('logs');
  const [shareRouteId, setShareRouteId] = useState<string | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [shareRouteLogs, setShareRouteLogs] = useState<Log[]>([]);
  const [shareRoute, setShareRoute] = useState<Route | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [formPosition, setFormPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [editingLog, setEditingLog] = useState<Log | null>(null);

  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [activeCardLog, setActiveCardLog] = useState<Log | null>(null);
  const [cardPosition, setCardPosition] = useState<MarkerCardPos | null>(null);

  const [deleteConfirmLog, setDeleteConfirmLog] = useState<Log | null>(null);
  const [selectedRouteLogIds, setSelectedRouteLogIds] = useState<string[]>([]);

  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initial = parseHashRoute();
    setPage(initial.page);
    if (initial.page === 'share' && initial.routeId) {
      setShareRouteId(initial.routeId);
    }

    const handleHashChange = () => {
      const parsed = parseHashRoute();
      setPage(parsed.page);
      if (parsed.page === 'share' && parsed.routeId) {
        setShareRouteId(parsed.routeId);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (page === 'share' && shareRouteId) {
      loadShareRoute(shareRouteId);
    } else {
      loadLogs();
    }
  }, [page, shareRouteId]);

  async function loadLogs() {
    try {
      const data = await api.getLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load logs:', err);
    }
  }

  async function loadShareRoute(routeId: string) {
    try {
      const route = await api.getRoute(routeId);
      setShareRoute(route);
      const routeLogs = await Promise.all(
        route.logIds.map(id => api.getLog(id).catch(() => null))
      );
      setShareRouteLogs(routeLogs.filter(Boolean) as Log[]);
    } catch (err) {
      console.error('Failed to load share route:', err);
    }
  }

  const handleMapClick = (lat: number, lng: number) => {
    setFormPosition({ lat, lng });
    setEditingLog(null);
    setShowForm(true);
    setActiveCardLog(null);
    setCardPosition(null);
  };

  const handleMarkerClick = (log: Log, pos: MarkerCardPos) => {
    if (page === 'share') return;
    setActiveCardLog(log);
    setCardPosition(pos);
    setSelectedLogId(log.id);
  };

  const handleFormSubmit = async (data: { name: string; date: string; description: string; photos: string[]; lat: number; lng: number }) => {
    try {
      if (editingLog) {
        await api.updateLog(editingLog.id, data);
      } else {
        await api.createLog(data);
      }
      setShowForm(false);
      setFormPosition(null);
      setEditingLog(null);
      await loadLogs();
    } catch (err) {
      console.error('Failed to save log:', err);
    }
  };

  const handleDeleteLog = async () => {
    if (!deleteConfirmLog) return;
    try {
      await api.deleteLog(deleteConfirmLog.id);
      setDeleteConfirmLog(null);
      setActiveCardLog(null);
      setCardPosition(null);
      setSelectedLogId(null);
      setSelectedRouteLogIds(ids => ids.filter(id => id !== deleteConfirmLog.id));
      await loadLogs();
    } catch (err) {
      console.error('Failed to delete log:', err);
    }
  };

  const handleEditLog = () => {
    if (!activeCardLog) return;
    setEditingLog(activeCardLog);
    setFormPosition({ lat: activeCardLog.lat, lng: activeCardLog.lng });
    setShowForm(true);
    setActiveCardLog(null);
    setCardPosition(null);
  };

  const handleListItemClick = (log: Log) => {
    if (page === 'route') {
      toggleRouteLog(log.id);
    } else {
      setSelectedLogId(log.id);
      setActiveCardLog(null);
      setCardPosition(null);
      if (window.innerWidth < 768) {
        setSidebarMobileOpen(false);
      }
    }
  };

  const toggleRouteLog = (logId: string) => {
    setSelectedRouteLogIds(ids =>
      ids.includes(logId) ? ids.filter(id => id !== logId) : [...ids, logId]
    );
  };

  const handleRouteCreated = (_route: Route) => {
    // Route created and URL copied to clipboard
  };

  const sortedLogs = useMemo(
    () => [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [logs]
  );

  const handlePageChange = (p: Page) => {
    if (p === 'share') return;
    window.location.hash = '';
    setPage(p);
    setActiveCardLog(null);
    setCardPosition(null);
    setSelectedLogId(null);
  };

  if (page === 'share') {
    return (
      <div className="share-view">
        <div className="share-header">
          <h1>🗺️ {shareRoute?.name || '旅行路线'}</h1>
          <div style={{ fontSize: '13px', color: 'rgba(62, 39, 35, 0.6)', marginTop: '4px' }}>
            共 {shareRouteLogs.length} 个途经点
          </div>
        </div>
        <div className="share-map">
          <MapView
            logs={shareRouteLogs}
            selectedLogId={null}
            onMapClick={() => {}}
            onMarkerClick={() => {}}
            routeLogIds={shareRoute?.logIds || []}
            isShareView={true}
            animateRoute={true}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">
          <span className="navbar-brand-icon">✈️</span>
          <span>旅行日志</span>
        </div>
        <div className="navbar-nav">
          <button
            className={`nav-btn ${page === 'logs' ? 'active' : ''}`}
            onClick={() => handlePageChange('logs')}
          >
            📍 日志
          </button>
          <button
            className={`nav-btn ${page === 'route' ? 'active' : ''}`}
            onClick={() => handlePageChange('route')}
          >
            🗺️ 路线
          </button>
          <button
            className={`nav-btn ${page === 'share' ? 'active' : ''}`}
            disabled
            style={{ opacity: 0.5 }}
          >
            🔗 分享
          </button>
        </div>
      </nav>

      <div className="main-layout">
        <aside
          className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${sidebarMobileOpen ? 'open' : ''}`}
        >
          <button
            className="sidebar-toggle"
            onClick={() => {
              if (window.innerWidth < 768) {
                setSidebarMobileOpen(!sidebarMobileOpen);
              } else {
                setSidebarCollapsed(!sidebarCollapsed);
              }
            }}
          >
            {window.innerWidth < 768
              ? sidebarMobileOpen
                ? '«'
                : '»'
              : sidebarCollapsed
              ? '»'
              : '«'}
          </button>

          {page === 'route' ? (
            <RoutePlanner
              logs={logs}
              selectedLogIds={selectedRouteLogIds}
              onToggleLog={toggleRouteLog}
              onClearSelection={() => setSelectedRouteLogIds([])}
              onRouteCreated={handleRouteCreated}
            />
          ) : (
            <>
              <div className="sidebar-header">
                <span>📍</span>
                <span className="sidebar-title">我的足迹</span>
              </div>

              <div className="sidebar-list">
                {sortedLogs.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">✈️</div>
                    <div className="empty-state-text">
                      还没有旅行日志<br />点击地图任意位置创建第一个吧
                    </div>
                  </div>
                ) : (
                  sortedLogs.map(log => (
                    <div
                      key={log.id}
                      className={`log-item ${selectedLogId === log.id ? 'selected' : ''}`}
                      onClick={() => handleListItemClick(log)}
                    >
                      <div className="log-thumb">
                        {log.photos[0] ? (
                          <img src={log.photos[0]} alt="" loading="lazy" />
                        ) : (
                          '📍'
                        )}
                      </div>
                      <div className="log-info">
                        <div className="log-name">{log.name}</div>
                        <div className="log-date">{log.date}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </aside>

        <div style={{ position: 'relative', flex: 1 }} ref={mapContainerRef}>
          <MapView
            logs={logs}
            selectedLogId={selectedLogId}
            onMapClick={handleMapClick}
            onMarkerClick={handleMarkerClick}
            onFlyToLog={(log) => setSelectedLogId(log.id)}
            routeLogIds={page === 'route' ? selectedRouteLogIds : []}
            isShareView={false}
            animateRoute={false}
          />

          {activeCardLog && cardPosition && (
            <div
              className="marker-card"
              style={{
                left: `${cardPosition.x}px`,
                top: `${cardPosition.y}px`,
              }}
            >
              <div className="marker-card-name">{activeCardLog.name}</div>
              <div className="marker-card-date">{activeCardLog.date}</div>
              <div className="marker-card-desc">{activeCardLog.description}</div>
              {activeCardLog.photos.length > 0 && (
                <div className="marker-card-photos">
                  {activeCardLog.photos.slice(0, 3).map((photo, i) => (
                    <div className="marker-card-photo" key={i}>
                      <img
                        src={photo}
                        alt=""
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="marker-card-actions">
                <button className="btn btn-outline btn-sm" onClick={() => { setActiveCardLog(null); setCardPosition(null); }}>
                  关闭
                </button>
                <button className="btn btn-outline btn-sm" onClick={handleEditLog}>
                  ✏️ 编辑
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirmLog(activeCardLog)}>
                  🗑️ 删除
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showForm && formPosition && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setFormPosition(null); setEditingLog(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <LogForm
              lat={formPosition.lat}
              lng={formPosition.lng}
              existingLog={editingLog}
              onSubmit={handleFormSubmit}
              onCancel={() => { setShowForm(false); setFormPosition(null); setEditingLog(null); }}
            />
          </div>
        </div>
      )}

      {deleteConfirmLog && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmLog(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">确认删除</div>
            <div className="modal-body">
              确定要删除「{deleteConfirmLog.name}」这条旅行日志吗？此操作无法撤销。
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setDeleteConfirmLog(null)}>
                取消
              </button>
              <button className="btn btn-danger" onClick={handleDeleteLog}>
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

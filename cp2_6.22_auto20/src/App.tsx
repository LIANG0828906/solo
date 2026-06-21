import React, { useState, useEffect, useCallback } from 'react';
import TripBoard from './components/TripBoard';
import DayPlan from './components/DayPlan';
import MapView from './components/MapView';
import { fetchTrips, fetchTrip, createTrip, updateTrip, deleteTrip, Trip, DayPlan as DayPlanData } from './dataStore';

function ensureDays(trip: Trip): Trip {
  if (trip.days.length > 0 || !trip.startDate || !trip.endDate) return trip;
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return trip;
  const days: DayPlanData[] = [];
  const current = new Date(start);
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    days.push({ date: dateStr, activities: [] });
    current.setDate(current.getDate() + 1);
  }
  return { ...trip, days };
}

type View = 'board' | 'detail';
type ActiveTab = 'itinerary' | 'map';

const globalCSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #F5F3F0;
    color: #2D2D2D;
    -webkit-font-smoothing: antialiased;
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  @media (max-width: 768px) {
    .detail-header { padding: 12px 16px !important; }
    .detail-tabs { padding: 0 16px !important; }
    .detail-content { padding: 16px !important; }
    .detail-title { font-size: 20px !important; }
  }
  @media print {
    body { background: #fff !important; }
    .no-print { display: none !important; }
    .print-only { display: block !important; }
  }
  .print-only { display: none; }
  .back-btn:hover { background-color: #e8e5e2 !important; }
  .tab-btn:hover { opacity: 0.85; }
  .export-btn:hover { background-color: #009e8a !important; transform: translateY(-1px); }
  .modal-close-btn:hover { background-color: #e0e0e0 !important; }
`;

const styles = {
  app: {
    minHeight: '100vh',
    background: '#F5F3F0',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '16px',
    color: '#888',
  },
  detailContainer: {
    minHeight: '100vh',
    background: '#F5F3F0',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  detailHeader: {
    padding: '16px 32px',
    background: '#fff',
    borderBottom: '1px solid #E8E5E2',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    animation: 'fadeIn 0.3s ease',
  },
  backBtn: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '24px',
    background: '#F5F3F0',
    color: '#555',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    fontWeight: 500 as const,
    whiteSpace: 'nowrap' as const,
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
  },
  detailTitle: {
    fontSize: '22px',
    fontWeight: 700 as const,
    color: '#2D2D2D',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  detailDate: {
    fontSize: '13px',
    color: '#888',
    marginTop: '2px',
  },
  exportBtn: {
    padding: '8px 20px',
    border: 'none',
    borderRadius: '24px',
    background: '#00BCA4',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600 as const,
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    whiteSpace: 'nowrap' as const,
  },
  detailTabs: {
    padding: '0 32px',
    background: '#fff',
    display: 'flex',
    gap: '0',
    borderBottom: '1px solid #E8E5E2',
  },
  tabBtn: {
    padding: '12px 24px',
    border: 'none',
    background: 'transparent',
    fontSize: '14px',
    fontWeight: 500 as const,
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative' as const,
    color: '#888',
  },
  tabBtnActive: {
    color: '#00BCA4',
    fontWeight: 600 as const,
  },
  tabUnderline: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: '#00BCA4',
    borderRadius: '3px 3px 0 0',
  },
  detailContent: {
    flex: 1,
    padding: '24px 32px',
    animation: 'slideUp 0.3s ease',
    overflowY: 'auto' as const,
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.2s ease',
  },
  modalContent: {
    background: '#fff',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '800px',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    animation: 'modalIn 0.3s ease',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #E8E5E2',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: 700 as const,
    color: '#2D2D2D',
  },
  modalCloseBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    background: '#F5F3F0',
    color: '#555',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  modalBody: {
    padding: '24px',
  },
  pdfCover: {
    width: '100%',
    height: '200px',
    objectFit: 'cover' as const,
    borderRadius: '8px',
    marginBottom: '16px',
  },
  pdfGradientCover: {
    width: '100%',
    height: '200px',
    background: 'linear-gradient(135deg, #00BCA4, #00897B)',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  pdfTripTitle: {
    fontSize: '24px',
    fontWeight: 700 as const,
    color: '#2D2D2D',
    marginBottom: '4px',
  },
  pdfTripDate: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '24px',
  },
  pdfDaySection: {
    marginBottom: '20px',
  },
  pdfDayHeader: {
    fontSize: '16px',
    fontWeight: 600 as const,
    color: '#00BCA4',
    marginBottom: '8px',
    paddingBottom: '4px',
    borderBottom: '2px solid #00BCA4',
  },
  pdfTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '13px',
  },
  pdfTh: {
    padding: '8px 12px',
    textAlign: 'left' as const,
    background: '#F5F3F0',
    fontWeight: 600 as const,
    color: '#555',
    borderBottom: '2px solid #E8E5E2',
    fontSize: '12px',
  },
  pdfTd: {
    padding: '8px 12px',
    borderBottom: '1px solid #F0EDEA',
    color: '#2D2D2D',
    verticalAlign: 'top' as const,
  },
  pdfEmpty: {
    textAlign: 'center' as const,
    padding: '12px',
    color: '#999',
    fontSize: '13px',
  },
  printBtn: {
    display: 'block',
    margin: '24px auto 0',
    padding: '12px 32px',
    border: 'none',
    borderRadius: '24px',
    background: '#00BCA4',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600 as const,
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

function parseHash(hash: string): { view: View; tripId: string | null; activeTab: ActiveTab; showExport: boolean } {
  const path = hash.replace(/^#\/?/, '');
  if (!path || path === '/') {
    return { view: 'board', tripId: null, activeTab: 'itinerary', showExport: false };
  }
  const tripMatch = path.match(/^trip\/([^/]+)(?:\/(.+))?$/);
  if (tripMatch) {
    const id = tripMatch[1];
    const sub = tripMatch[2] || '';
    if (sub === 'map') {
      return { view: 'detail', tripId: id, activeTab: 'map', showExport: false };
    }
    if (sub === 'export') {
      return { view: 'detail', tripId: id, activeTab: 'itinerary', showExport: true };
    }
    return { view: 'detail', tripId: id, activeTab: 'itinerary', showExport: false };
  }
  return { view: 'board', tripId: null, activeTab: 'itinerary', showExport: false };
}

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
};

const App: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('board');
  const [activeTab, setActiveTab] = useState<ActiveTab>('itinerary');
  const [showExport, setShowExport] = useState(false);

  const navigateTo = useCallback((hash: string) => {
    window.location.hash = hash;
  }, []);

  const handleHashChange = useCallback(() => {
    const parsed = parseHash(window.location.hash);
    setView(parsed.view);
    setActiveTab(parsed.activeTab);
    setShowExport(parsed.showExport);
    if (parsed.tripId) {
      fetchTrip(parsed.tripId).then(trip => {
        const ensured = ensureDays(trip);
        if (ensured.days.length !== trip.days.length) {
          updateTrip(ensured).then(setCurrentTrip);
        } else {
          setCurrentTrip(ensured);
        }
      }).catch(() => setCurrentTrip(null));
    } else {
      setCurrentTrip(null);
    }
  }, []);

  useEffect(() => {
    fetchTrips().then(data => {
      setTrips(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [handleHashChange]);

  const handleTripSelect = useCallback((id: string) => {
    navigateTo(`#/trip/${id}`);
  }, [navigateTo]);

  const handleTripCreate = useCallback(async (tripData: Omit<Trip, 'id'>) => {
    const created = await createTrip(tripData);
    setTrips(prev => [...prev, created]);
  }, []);

  const handleTripUpdate = useCallback(async (trip: Trip) => {
    const updated = await updateTrip(trip);
    setCurrentTrip(updated);
    setTrips(prev => prev.map(t => t.id === updated.id ? updated : t));
  }, []);

  const handleTripDelete = useCallback(async (id: string) => {
    await deleteTrip(id);
    setTrips(prev => prev.filter(t => t.id !== id));
    if (currentTrip?.id === id) {
      navigateTo('#/');
    }
  }, [currentTrip, navigateTo]);

  const handleBack = useCallback(() => {
    navigateTo('#/');
  }, [navigateTo]);

  const handleTabChange = useCallback((tab: ActiveTab) => {
    if (currentTrip) {
      if (tab === 'map') {
        navigateTo(`#/trip/${currentTrip.id}/map`);
      } else {
        navigateTo(`#/trip/${currentTrip.id}`);
      }
    }
  }, [currentTrip, navigateTo]);

  const handleExport = useCallback(() => {
    if (currentTrip) {
      navigateTo(`#/trip/${currentTrip.id}/export`);
    }
  }, [currentTrip, navigateTo]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (loading) {
    return (
      <div style={styles.app}>
        <style>{globalCSS}</style>
        <div style={styles.loading}>加载中...</div>
      </div>
    );
  }

  if (view === 'board') {
    return (
      <div style={styles.app}>
        <style>{globalCSS}</style>
        <TripBoard
          trips={trips}
          onTripSelect={handleTripSelect}
          onTripCreate={handleTripCreate}
          onTripDelete={handleTripDelete}
        />
      </div>
    );
  }

  if (!currentTrip) {
    return (
      <div style={styles.app}>
        <style>{globalCSS}</style>
        <div style={styles.loading}>加载旅行数据...</div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <style>{globalCSS}</style>

      <div style={styles.detailContainer}>
        <div className="detail-header no-print" style={styles.detailHeader}>
          <button className="back-btn" style={styles.backBtn} onClick={handleBack}>
            ← 返回
          </button>
          <div style={styles.headerInfo}>
            <h1 className="detail-title" style={styles.detailTitle}>{currentTrip.destination}</h1>
            <div style={styles.detailDate}>
              {formatDate(currentTrip.startDate)} — {formatDate(currentTrip.endDate)}
            </div>
          </div>
          <button className="export-btn" style={styles.exportBtn} onClick={handleExport}>
            导出PDF
          </button>
        </div>

        <div className="detail-tabs no-print" style={styles.detailTabs}>
          <button
            className="tab-btn"
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'itinerary' ? styles.tabBtnActive : {}),
            }}
            onClick={() => handleTabChange('itinerary')}
          >
            行程
            {activeTab === 'itinerary' && <span style={styles.tabUnderline} />}
          </button>
          <button
            className="tab-btn"
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'map' ? styles.tabBtnActive : {}),
            }}
            onClick={() => handleTabChange('map')}
          >
            地图
            {activeTab === 'map' && <span style={styles.tabUnderline} />}
          </button>
        </div>

        <div className="detail-content" style={styles.detailContent}>
          {activeTab === 'itinerary' ? (
            <DayPlan trip={currentTrip} onTripUpdate={handleTripUpdate} />
          ) : (
            <MapView trip={currentTrip} onTripUpdate={handleTripUpdate} />
          )}
        </div>
      </div>

      {showExport && (
        <div style={styles.modalOverlay} onClick={() => navigateTo(`#/trip/${currentTrip.id}`)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className="no-print" style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>PDF 导出预览</h2>
              <button
                className="modal-close-btn"
                style={styles.modalCloseBtn}
                onClick={() => navigateTo(`#/trip/${currentTrip.id}`)}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              {currentTrip.coverImage ? (
                <img style={styles.pdfCover} src={currentTrip.coverImage} alt={currentTrip.destination} />
              ) : (
                <div style={styles.pdfGradientCover} />
              )}
              <div style={styles.pdfTripTitle}>{currentTrip.destination}</div>
              <div style={styles.pdfTripDate}>
                {formatDate(currentTrip.startDate)} — {formatDate(currentTrip.endDate)}
              </div>

              {currentTrip.days.map((day, dayIndex) => (
                <div key={dayIndex} style={styles.pdfDaySection}>
                  <div style={styles.pdfDayHeader}>
                    Day {dayIndex + 1} — {formatDate(day.date)}
                  </div>
                  {day.activities.length === 0 ? (
                    <div style={styles.pdfEmpty}>暂无活动安排</div>
                  ) : (
                    <table style={styles.pdfTable}>
                      <thead>
                        <tr>
                          <th style={styles.pdfTh}>时间</th>
                          <th style={styles.pdfTh}>地点</th>
                          <th style={styles.pdfTh}>描述</th>
                          <th style={styles.pdfTh}>备注</th>
                        </tr>
                      </thead>
                      <tbody>
                        {day.activities.map(act => (
                          <tr key={act.id}>
                            <td style={styles.pdfTd}>{act.time || '-'}</td>
                            <td style={styles.pdfTd}>{act.location || '-'}</td>
                            <td style={styles.pdfTd}>{act.description || '-'}</td>
                            <td style={styles.pdfTd}>{act.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}

              <button className="no-print export-btn" style={styles.printBtn} onClick={handlePrint}>
                打印/导出PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

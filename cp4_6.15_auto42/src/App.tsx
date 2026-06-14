import React, { useState, useEffect, useCallback } from 'react';
import { useTrips } from '@/hooks/useTrips';
import TripManager from '@/components/TripManager';
import ExpenseTracker from '@/components/ExpenseTracker';
import type { Trip } from '@/types';

type ViewMode = 'list' | 'detail';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean; hiding: boolean } | null>(null);
  const [detailTab, setDetailTab] = useState<'activities' | 'expenses'>('activities');

  const {
    trips,
    activities,
    addTrip,
    deleteTrip,
    addActivity,
    toggleActivityCompleted,
    deleteActivity,
    getTripTotalSpent,
    getTripDays,
    getCategoryTotals,
    getDailySpending,
    getTripById
  } = useTrips();

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true, hiding: false });
    setTimeout(() => {
      setToast(prev => prev ? { ...prev, hiding: true } : null);
      setTimeout(() => {
        setToast(null);
      }, 300);
    }, 2000);
  }, []);

  const handleSelectTrip = (tripId: string) => {
    setSelectedTripId(tripId);
    setViewMode('detail');
    setDetailTab('activities');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedTripId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShareTrip = useCallback(() => {
    if (!selectedTripId) return;
    const trip = getTripById(selectedTripId);
    if (!trip) return;

    const totalSpent = getTripTotalSpent(selectedTripId);
    const days = getTripDays(trip);
    const tripActivities = activities.filter(a => a.tripId === selectedTripId);

    const summary = [
      `🌍 ${trip.destination}旅行`,
      `📅 ${trip.startDate} ~ ${trip.endDate} (${days}天)`,
      `💰 总花费: ¥${totalSpent.toLocaleString()} / 预算: ¥${trip.budget.toLocaleString()}`,
      `📝 共${tripActivities.length}个活动安排`
    ].join('\n');

    navigator.clipboard.writeText(summary)
      .then(() => {
        showToast('✓ 行程摘要已复制到剪贴板');
      })
      .catch(() => {
        showToast('复制失败，请手动复制');
      });
  }, [selectedTripId, getTripById, getTripTotalSpent, getTripDays, activities, showToast]);

  const handleDeleteTrip = useCallback((tripId: string) => {
    deleteTrip(tripId);
    showToast('行程已删除');
  }, [deleteTrip, showToast]);

  const handleAddTrip = useCallback((data: Omit<Trip, 'id' | 'createdAt'>) => {
    addTrip(data);
    showToast('✓ 行程创建成功');
  }, [addTrip, showToast]);

  const handleAddActivity = useCallback((data: Omit<typeof activities[0], 'id' | 'completed'>) => {
    addActivity(data);
    showToast('✓ 活动已添加');
  }, [addActivity, showToast]);

  const handleToggleActivity = useCallback((activityId: string) => {
    toggleActivityCompleted(activityId);
  }, [toggleActivityCompleted]);

  const handleDeleteActivity = useCallback((activityId: string) => {
    deleteActivity(activityId);
    showToast('活动已删除');
  }, [deleteActivity, showToast]);

  const handleDetailTabChange = (tab: 'activities' | 'expenses') => {
    setDetailTab(tab);
  };

  const currentTrip = selectedTripId ? getTripById(selectedTripId) : null;

  return (
    <div className="app-container">
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-content">
          <h1 className="navbar-title">
            {viewMode === 'list' ? (
              <>✈️ 旅行行程规划</>
            ) : (
              <>📍 {currentTrip?.destination || '行程详情'}</>
            )}
          </h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            {viewMode === 'detail' && (
              <>
                <button className="nav-back-btn share-btn" onClick={handleShareTrip}>
                  📤 分享
                </button>
                <button className="nav-back-btn" onClick={handleBackToList}>
                  ← 返回列表
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="main-content">
        {viewMode === 'list' ? (
          <TripManager
            mode="list"
            trips={trips}
            activities={activities}
            onSelectTrip={handleSelectTrip}
            onAddTrip={handleAddTrip}
            onDeleteTrip={handleDeleteTrip}
            onAddActivity={handleAddActivity}
            onToggleActivity={handleToggleActivity}
            onDeleteActivity={handleDeleteActivity}
            getTripTotalSpent={getTripTotalSpent}
            getTripDays={getTripDays}
          />
        ) : (
          selectedTripId && (
            <div className="fade-in">
              <TripManager
                mode="detail"
                tripId={selectedTripId}
                detailView="dashboard"
                trips={trips}
                activities={activities}
                onSelectTrip={handleSelectTrip}
                onAddTrip={handleAddTrip}
                onDeleteTrip={handleDeleteTrip}
                onAddActivity={handleAddActivity}
                onToggleActivity={handleToggleActivity}
                onDeleteActivity={handleDeleteActivity}
                getTripTotalSpent={getTripTotalSpent}
                getTripDays={getTripDays}
              />

              <div className="tabs" style={{ marginTop: '24px' }}>
                <button
                  className={`tab-btn ${detailTab === 'activities' ? 'active' : ''}`}
                  onClick={() => handleDetailTabChange('activities')}
                >
                  📋 活动列表 ({activities.filter(a => a.tripId === selectedTripId).length})
                </button>
                <button
                  className={`tab-btn ${detailTab === 'expenses' ? 'active' : ''}`}
                  onClick={() => handleDetailTabChange('expenses')}
                >
                  📊 支出统计
                </button>
              </div>

              <div className="tab-content" key={detailTab}>
                {detailTab === 'activities' && (
                  <TripManager
                    mode="detail"
                    tripId={selectedTripId}
                    detailView="activities"
                    trips={trips}
                    activities={activities}
                    onSelectTrip={handleSelectTrip}
                    onAddTrip={handleAddTrip}
                    onDeleteTrip={handleDeleteTrip}
                    onAddActivity={handleAddActivity}
                    onToggleActivity={handleToggleActivity}
                    onDeleteActivity={handleDeleteActivity}
                    getTripTotalSpent={getTripTotalSpent}
                    getTripDays={getTripDays}
                  />
                )}

                {detailTab === 'expenses' && (
                  <ExpenseTracker
                    tripId={selectedTripId}
                    categoryTotals={getCategoryTotals(selectedTripId)}
                    dailySpending={getDailySpending(selectedTripId)}
                  />
                )}
              </div>
            </div>
          )
        )}
      </main>

      {toast && (
        <div className={`toast ${toast.hiding ? 'hiding' : ''}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default App;

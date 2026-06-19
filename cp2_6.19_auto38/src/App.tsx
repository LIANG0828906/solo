import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import TripManager from './modules/trip/TripManager';
import ExpenseTracker from './modules/expense/ExpenseTracker';
import { useTripStore } from './modules/trip/store';
import { useExpenseStore } from './modules/expense/store';
import { initializeMockData } from './modules/expense/store';
import { formatCurrency } from './utils/currency';
import { CURRENCY_SYMBOLS } from './modules/trip/types';
import { CATEGORY_ICONS, CATEGORY_CLASS_MAP } from './modules/expense/types';
import BudgetAlert from './components/BudgetAlert';

type ViewMode = 'dashboard' | 'detail';

const App: React.FC = () => {
  const { trips, currentTripId, switchTrip } = useTripStore((state) => ({
    trips: state.trips,
    currentTripId: state.currentTripId,
    switchTrip: state.switchTrip,
  }));

  const {
    getTotalExpenses,
    getBudgetPercentage,
    getCategoryTotals,
    getExpensesByTrip,
  } = useExpenseStore((state) => ({
    getTotalExpenses: state.getTotalExpenses,
    getBudgetPercentage: state.getBudgetPercentage,
    getCategoryTotals: state.getCategoryTotals,
    getExpensesByTrip: state.getExpensesByTrip,
  }));

  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current && trips.length > 0) {
      initializeMockData(trips.map((t) => t.id));
      initializedRef.current = true;
    }
  }, [trips]);

  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState<'warning' | 'danger' | null>(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentTrip = useMemo(() => {
    if (!currentTripId) return null;
    return trips.find((t) => t.id === currentTripId) || null;
  }, [currentTripId, trips]);

  useEffect(() => {
    if (alertDismissed) return;

    let maxPercentage = 0;
    let dangerTrip = '';

    trips.forEach((trip) => {
      const percentage = getBudgetPercentage(trip.id, trip.budget);
      if (percentage > maxPercentage) {
        maxPercentage = percentage;
        if (percentage >= 80) {
          dangerTrip = trip.destination;
        }
      }
    });

    if (maxPercentage >= 100) {
      setAlertType('danger');
      setAlertMessage(`「${dangerTrip}」已超出预算！请立即控制开销。`);
      setShowAlert(true);
    } else if (maxPercentage >= 80) {
      setAlertType('warning');
      setAlertMessage(`「${dangerTrip}」预算使用已超过80%，请注意控制花费。`);
      setShowAlert(true);
    } else {
      setShowAlert(false);
      setAlertType(null);
    }
  }, [trips, getBudgetPercentage, alertDismissed]);

  const handleSelectTrip = useCallback((tripId: string) => {
    switchTrip(tripId);
    setViewMode('detail');
    setAlertDismissed(false);
    setMobileMenuOpen(false);
  }, [switchTrip]);

  const handleBackToDashboard = useCallback(() => {
    setViewMode('dashboard');
    setAlertDismissed(false);
    setMobileMenuOpen(false);
  }, []);

  const handleDismissAlert = useCallback(() => {
    setShowAlert(false);
    setAlertDismissed(true);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const overallStats = useMemo(() => {
    let totalBudget = 0;
    let totalSpent = 0;

    trips.forEach((trip) => {
      totalBudget += trip.budget;
      totalSpent += getTotalExpenses(trip.id);
    });

    return {
      totalBudget,
      totalSpent,
      remaining: totalBudget - totalSpent,
    };
  }, [trips, getTotalExpenses]);

  const rightPanelContent = useMemo(() => {
    if (viewMode === 'dashboard') {
      return (
        <div>
          <h3 className="text-lg font-semibold mb-4">总览统计</h3>

          <div className="space-y-4">
            <div className="glass p-4 animate-fade-in-up stagger-1">
              <div className="text-sm text-muted mb-1">总预算</div>
              <div className="text-xl font-semibold text-cyan">
                ¥{overallStats.totalBudget.toLocaleString()}
              </div>
            </div>

            <div className="glass p-4 animate-fade-in-up stagger-2">
              <div className="text-sm text-muted mb-1">已花费</div>
              <div className="text-xl font-semibold">
                ¥{overallStats.totalSpent.toLocaleString()}
              </div>
            </div>

            <div className="glass p-4 animate-fade-in-up stagger-3">
              <div className="text-sm text-muted mb-1">剩余预算</div>
              <div className={`text-xl font-semibold ${overallStats.remaining < 0 ? 'text-orange' : ''}`}>
                ¥{overallStats.remaining.toLocaleString()}
              </div>
            </div>

            <div className="glass p-4 animate-fade-in-up stagger-4">
              <div className="text-sm text-muted mb-2">旅行项目</div>
              <div className="text-2xl font-bold text-cyan">{trips.length}</div>
            </div>
          </div>

          {trips.length > 0 && (
            <div className="mt-6">
              <h4 className="text-base font-semibold mb-3">快速切换</h4>
              <div className="space-y-2">
                {trips.map((trip) => {
                  const percentage = getBudgetPercentage(trip.id, trip.budget);
                  return (
                    <div
                      key={trip.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        currentTripId === trip.id
                          ? 'bg-cyan-500/20 border border-cyan-500/50'
                          : 'bg-[#0f3460] hover:bg-[#1a4971]'
                      }`}
                      onClick={() => handleSelectTrip(trip.id)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{trip.destination}</span>
                        <span className={`text-sm ${percentage >= 80 ? 'text-orange' : 'text-cyan'}`}>
                          {percentage}%
                        </span>
                      </div>
                      <div className="progress-bar mt-2">
                        <div
                          className={`progress-fill ${
                            percentage >= 100 ? 'danger' : percentage >= 80 ? 'warning' : 'success'
                          }`}
                          style={{ width: `${Math.min(100, percentage)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (!currentTrip) return null;

    const categoryTotals = getCategoryTotals(currentTrip.id);
    const recentExpenses = getExpensesByTrip(currentTrip.id).slice(0, 5);

    return (
      <div>
        <h3 className="text-lg font-semibold mb-4">项目统计</h3>

        <div className="space-y-4">
          <div className="glass p-4">
            <div className="text-sm text-muted mb-1">项目预算</div>
            <div className="text-xl font-semibold text-cyan">
              {CURRENCY_SYMBOLS[currentTrip.currency]}{currentTrip.budget.toLocaleString()}
            </div>
          </div>

          <div className="glass p-4">
            <div className="text-sm text-muted mb-1">已花费</div>
            <div className="text-xl font-semibold">
              {formatCurrency(getTotalExpenses(currentTrip.id), currentTrip.currency)}
            </div>
          </div>

          <div className="glass p-4">
            <div className="text-sm text-muted mb-2">类别分布</div>
            <div className="space-y-2">
              {Object.entries(categoryTotals).map(([category, amount]) => (
                amount > 0 && (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]}</span>
                      <span className={`category-tag ${CATEGORY_CLASS_MAP[category as keyof typeof CATEGORY_CLASS_MAP]}`}>
                        {category}
                      </span>
                    </div>
                    <span className="text-sm">
                      {CURRENCY_SYMBOLS[currentTrip.currency]}{amount.toLocaleString()}
                    </span>
                  </div>
                )
              ))}
            </div>
          </div>

          <div className="glass p-4">
            <div className="text-sm text-muted mb-2">最近开销</div>
            <div className="space-y-2">
              {recentExpenses.length === 0 ? (
                <div className="text-sm text-muted text-center py-2">暂无记录</div>
              ) : (
                recentExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <span>{CATEGORY_ICONS[expense.category]}</span>
                      <span className="text-sm truncate max-w-[120px]">
                        {expense.note || expense.category}
                      </span>
                    </div>
                    <span className="text-sm font-medium">
                      {CURRENCY_SYMBOLS[currentTrip.currency]}{expense.amount.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }, [viewMode, currentTrip, overallStats, trips, currentTripId, getTotalExpenses, getBudgetPercentage, getCategoryTotals, getExpensesByTrip, handleSelectTrip]);

  return (
    <div className="app-container">
      <BudgetAlert
        type={alertType || 'warning'}
        message={alertMessage}
        visible={showAlert && alertType !== null}
        onDismiss={handleDismissAlert}
      />

      <button
        className="hamburger-menu"
        onClick={toggleMobileMenu}
        aria-label="切换导航菜单"
      >
        {mobileMenuOpen ? '✕' : '☰'}
      </button>

      <nav className={`nav-sidebar ${mobileMenuOpen ? 'expanded' : 'collapsed'}`}>
        <div className="mb-8">
          <h1 className="text-xl font-bold text-cyan mb-1">✈️ 旅行管家</h1>
          <p className="text-xs text-muted">Trip Expense Tracker</p>
        </div>

        <div className="space-y-2">
          <div
            className={`nav-item ${viewMode === 'dashboard' ? 'active' : ''}`}
            onClick={handleBackToDashboard}
          >
            <span className="nav-item-icon">📊</span>
            <span>仪表盘</span>
          </div>

          {viewMode === 'detail' && currentTrip && (
            <div className="nav-item active">
              <span className="nav-item-icon">📍</span>
              <span>{currentTrip.destination}</span>
            </div>
          )}
        </div>

        {viewMode === 'detail' && currentTrip && (
          <div className="mt-8">
            <h4 className="text-sm font-semibold text-muted mb-3 px-4">其他项目</h4>
            <div className="space-y-1">
              {trips
                .filter((t) => t.id !== currentTripId)
                .map((trip) => {
                  const percentage = getBudgetPercentage(trip.id, trip.budget);
                  return (
                    <div
                      key={trip.id}
                      className="nav-item text-sm"
                      onClick={() => handleSelectTrip(trip.id)}
                    >
                      <span className="nav-item-icon">✈️</span>
                      <span>
                        {trip.destination}
                        <span className={`ml-2 text-xs ${percentage >= 80 ? 'text-orange' : 'text-cyan'}`}>
                          {percentage}%
                        </span>
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </nav>

      <main className="main-content">
        {viewMode === 'dashboard' ? (
          <TripManager onSelectTrip={handleSelectTrip} />
        ) : currentTripId ? (
          <div>
            <button
              className="btn btn-secondary mb-4"
              onClick={handleBackToDashboard}
            >
              ← 返回仪表盘
            </button>
            <ExpenseTracker tripId={currentTripId} />
          </div>
        ) : (
          <TripManager onSelectTrip={handleSelectTrip} />
        )}
      </main>

      <aside className="stats-panel">
        {rightPanelContent}
      </aside>
    </div>
  );
};

export default App;

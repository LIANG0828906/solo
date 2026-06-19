import React, { useState, useEffect, useMemo, useCallback } from 'react';
import TripManager from './modules/trip/TripManager';
import ExpenseTracker from './modules/expense/ExpenseTracker';
import { useAppStore } from './modules/expense/store';
import { formatCurrency } from './utils/currency';
import { CURRENCY_SYMBOLS } from './modules/trip/types';
import { CATEGORY_ICONS, CATEGORY_CLASS_MAP } from './modules/expense/types';

type ViewMode = 'dashboard' | 'detail';

const App: React.FC = () => {
  const {
    trips,
    currentTripId,
    switchTrip,
    getTotalExpenses,
    getBudgetPercentage,
    getCategoryTotals,
    getExpensesByTrip,
  } = useAppStore((state) => ({
    trips: state.trips,
    currentTripId: state.currentTripId,
    switchTrip: state.switchTrip,
    getTotalExpenses: state.getTotalExpenses,
    getBudgetPercentage: state.getBudgetPercentage,
    getCategoryTotals: state.getCategoryTotals,
    getExpensesByTrip: state.getExpensesByTrip,
  }));
  
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState<'warning' | 'danger' | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  
  const currentTrip = useMemo(() => {
    if (!currentTripId) return null;
    return trips.find((t) => t.id === currentTripId) || null;
  }, [currentTripId, trips]);
  
  const overallStats = useMemo(() => {
    let totalBudget = 0;
    let totalSpent = 0;
    let maxPercentage = 0;
    
    trips.forEach((trip) => {
      totalBudget += trip.budget;
      const spent = getTotalExpenses(trip.id);
      totalSpent += spent;
      const percentage = getBudgetPercentage(trip.id);
      maxPercentage = Math.max(maxPercentage, percentage);
    });
    
    return {
      totalBudget,
      totalSpent,
      maxPercentage,
      remaining: totalBudget - totalSpent,
    };
  }, [trips, getTotalExpenses, getBudgetPercentage]);
  
  useEffect(() => {
    if (alertDismissed) return;
    
    const { maxPercentage } = overallStats;
    if (maxPercentage >= 100) {
      setAlertType('danger');
      setShowAlert(true);
    } else if (maxPercentage >= 80) {
      setAlertType('warning');
      setShowAlert(true);
    } else {
      setShowAlert(false);
      setAlertType(null);
    }
  }, [overallStats, alertDismissed]);
  
  const handleSelectTrip = useCallback((tripId: string) => {
    switchTrip(tripId);
    setViewMode('detail');
    setAlertDismissed(false);
  }, [switchTrip]);
  
  const handleBackToDashboard = useCallback(() => {
    setViewMode('dashboard');
    setAlertDismissed(false);
  }, []);
  
  const handleDismissAlert = useCallback(() => {
    setShowAlert(false);
    setAlertDismissed(true);
  }, []);
  
  const rightPanelContent = useMemo(() => {
    if (viewMode === 'dashboard') {
      return (
        <div>
          <h3 className="text-lg font-semibold mb-4">总览统计</h3>
          
          <div className="space-y-4">
            <div className="glass p-4">
              <div className="text-sm text-muted mb-1">总预算</div>
              <div className="text-xl font-semibold text-cyan">
                ¥{overallStats.totalBudget.toLocaleString()}
              </div>
            </div>
            
            <div className="glass p-4">
              <div className="text-sm text-muted mb-1">已花费</div>
              <div className="text-xl font-semibold">
                ¥{overallStats.totalSpent.toLocaleString()}
              </div>
            </div>
            
            <div className="glass p-4">
              <div className="text-sm text-muted mb-1">剩余预算</div>
              <div className={`text-xl font-semibold ${overallStats.remaining < 0 ? 'text-orange' : ''}`}>
                ¥{overallStats.remaining.toLocaleString()}
              </div>
            </div>
            
            <div className="glass p-4">
              <div className="text-sm text-muted mb-2">旅行项目</div>
              <div className="text-2xl font-bold text-cyan">{trips.length}</div>
            </div>
          </div>
          
          {trips.length > 0 && (
            <div className="mt-6">
              <h4 className="text-base font-semibold mb-3">快速切换</h4>
              <div className="space-y-2">
                {trips.map((trip) => {
                  const percentage = getBudgetPercentage(trip.id);
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
      {showAlert && alertType && (
        <div className={`alert-banner ${alertType} ${showAlert ? 'show' : ''}`}>
          <div className="flex items-center gap-3">
            <span className="text-xl">{alertType === 'danger' ? '🚨' : '⚠️'}</span>
            <span className="font-medium">
              {alertType === 'danger'
                ? '警告：有项目已超出预算！请控制开销。'
                : '提醒：有项目预算使用已超过80%，请注意控制花费。'}
            </span>
          </div>
          <button
            className="px-3 py-1 rounded bg-white/20 hover:bg-white/30 transition-all text-sm"
            onClick={handleDismissAlert}
          >
            知道了
          </button>
        </div>
      )}
      
      <nav className="nav-sidebar">
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
            <span className="hidden lg:inline">仪表盘</span>
          </div>
          
          {viewMode === 'detail' && currentTrip && (
            <div className="nav-item active">
              <span className="nav-item-icon">📍</span>
              <span className="hidden lg:inline">{currentTrip.destination}</span>
            </div>
          )}
        </div>
        
        {viewMode === 'detail' && currentTrip && (
          <div className="mt-8">
            <div className="hidden lg:block">
              <h4 className="text-sm font-semibold text-muted mb-3 px-4">其他项目</h4>
              <div className="space-y-1">
                {trips
                  .filter((t) => t.id !== currentTripId)
                  .map((trip) => {
                    const percentage = getBudgetPercentage(trip.id);
                    return (
                      <div
                        key={trip.id}
                        className="nav-item text-sm"
                        onClick={() => handleSelectTrip(trip.id)}
                      >
                        <span className="nav-item-icon">✈️</span>
                        <span className="hidden lg:inline">
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

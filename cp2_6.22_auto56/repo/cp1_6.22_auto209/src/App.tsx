import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Dashboard from './components/Dashboard';
import AnalyticsPanel from './components/AnalyticsPanel';
import AddSubscriptionModal from './components/AddSubscriptionModal';
import {
  Subscription,
  loadFromLocalStorage,
  saveToLocalStorage,
  getExpiringSubscriptions,
  calculateDaysUntilExpiry,
} from './utils/subscriptionLogic';

interface AppState {
  subscriptions: Subscription[];
  activeTab: 'dashboard' | 'analytics';
  searchQuery: string;
  highlightedId: string | null;
  bannerVisible: boolean;
}

type Action =
  | { type: 'SET_SUBSCRIPTIONS'; payload: Subscription[] }
  | { type: 'ADD_SUBSCRIPTION'; payload: Subscription }
  | { type: 'UPDATE_SUBSCRIPTION'; payload: Subscription }
  | { type: 'DELETE_SUBSCRIPTION'; payload: string }
  | { type: 'SET_ACTIVE_TAB'; payload: 'dashboard' | 'analytics' }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_HIGHLIGHTED_ID'; payload: string | null }
  | { type: 'SET_BANNER_VISIBLE'; payload: boolean };

const initialState: AppState = {
  subscriptions: [],
  activeTab: 'dashboard',
  searchQuery: '',
  highlightedId: null,
  bannerVisible: true,
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_SUBSCRIPTIONS':
      return { ...state, subscriptions: action.payload };
    case 'ADD_SUBSCRIPTION':
      return { ...state, subscriptions: [action.payload, ...state.subscriptions] };
    case 'UPDATE_SUBSCRIPTION':
      return {
        ...state,
        subscriptions: state.subscriptions.map((s) =>
          s.id === action.payload.id ? action.payload : s
        ),
      };
    case 'DELETE_SUBSCRIPTION':
      return {
        ...state,
        subscriptions: state.subscriptions.filter((s) => s.id !== action.payload),
      };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_HIGHLIGHTED_ID':
      return { ...state, highlightedId: action.payload };
    case 'SET_BANNER_VISIBLE':
      return { ...state, bannerVisible: action.payload };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  toggleSubscription: (id: string) => void;
  addSubscription: (sub: Omit<Subscription, 'id' | 'createdAt'>) => void;
  scrollToSubscription: (id: string) => void;
  exportCSV: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      const localData = loadFromLocalStorage();
      if (localData.length > 0) {
        dispatch({ type: 'SET_SUBSCRIPTIONS', payload: localData });
      } else {
        try {
          const response = await fetch('/api/subscriptions');
          const data = await response.json();
          dispatch({ type: 'SET_SUBSCRIPTIONS', payload: data });
        } catch (e) {
          console.error('Failed to fetch initial data:', e);
        }
      }
      setIsLoading(false);
    };

    initializeData();
  }, []);

  useEffect(() => {
    if (!isLoading && state.subscriptions.length > 0) {
      saveToLocalStorage(state.subscriptions);
    }
  }, [state.subscriptions, isLoading]);

  const toggleSubscription = useCallback((id: string) => {
    const sub = state.subscriptions.find((s) => s.id === id);
    if (sub) {
      dispatch({
        type: 'UPDATE_SUBSCRIPTION',
        payload: { ...sub, isActive: !sub.isActive },
      });
    }
  }, [state.subscriptions]);

  const addSubscription = useCallback((subData: Omit<Subscription, 'id' | 'createdAt'>) => {
    const newSub: Subscription = {
      ...subData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_SUBSCRIPTION', payload: newSub });
  }, []);

  const scrollToSubscription = useCallback((id: string) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: 'dashboard' });
    setTimeout(() => {
      const element = document.getElementById(`sub-card-${id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        dispatch({ type: 'SET_HIGHLIGHTED_ID', payload: id });
        setTimeout(() => {
          dispatch({ type: 'SET_HIGHLIGHTED_ID', payload: null });
        }, 3000);
      }
    }, 100);
  }, []);

  const exportCSV = useCallback(async () => {
    try {
      const response = await fetch('/api/export-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(state.subscriptions),
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'subscriptions.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setShowToast(true);
      setTimeout(() => setShowToast(false), 500);
    } catch (e) {
      console.error('Export failed:', e);
    }
  }, [state.subscriptions]);

  const expiringSubs = getExpiringSubscriptions(state.subscriptions, 7);
  const activeExpiringSubs = expiringSubs.filter((s) => s.isActive);

  const contextValue: AppContextType = {
    state,
    dispatch,
    toggleSubscription,
    addSubscription,
    scrollToSubscription,
    exportCSV,
  };

  if (isLoading) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '1.2rem', color: '#64748B' }}>加载中...</div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      <div className="app-container">
        <nav className="navbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="hamburger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              ☰
            </button>
            <div className="navbar-brand">
              <span>📋</span>
              <span>订阅管家</span>
            </div>
          </div>

          <div className={`navbar-tabs ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <button
              className={`tab-btn ${state.activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => {
                dispatch({ type: 'SET_ACTIVE_TAB', payload: 'dashboard' });
                setMobileMenuOpen(false);
              }}
            >
              仪表盘
            </button>
            <button
              className={`tab-btn ${state.activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => {
                dispatch({ type: 'SET_ACTIVE_TAB', payload: 'analytics' });
                setMobileMenuOpen(false);
              }}
            >
              分析
            </button>
          </div>

          <div className="navbar-actions">
            <button className="export-btn" onClick={exportCSV}>
              <span>📤 导出</span>
            </button>
            {!state.bannerVisible && activeExpiringSubs.length > 0 && (
              <button
                className="bell-icon"
                onClick={() => dispatch({ type: 'SET_BANNER_VISIBLE', payload: true })}
              >
                🔔
                <span className="bell-badge">{activeExpiringSubs.length}</span>
              </button>
            )}
          </div>
        </nav>

        {activeExpiringSubs.length > 0 && (
          <div className={`banner ${state.bannerVisible ? '' : 'minimized'}`}>
            <div className="banner-content">
              <span className="banner-title">
                ⚠️ 您有 {activeExpiringSubs.length} 项订阅即将到期
              </span>
              <div className="banner-items">
                {activeExpiringSubs.map((sub) => {
                  const days = calculateDaysUntilExpiry(sub.expiryDate);
                  return (
                    <span
                      key={sub.id}
                      className="banner-item"
                      onClick={() => scrollToSubscription(sub.id)}
                    >
                      {sub.name} ({days <= 0 ? '今天' : `${days}天后`})
                    </span>
                  );
                })}
              </div>
            </div>
            <button
              className="banner-close"
              onClick={() => dispatch({ type: 'SET_BANNER_VISIBLE', payload: false })}
            >
              ×
            </button>
          </div>
        )}

        <main className="main-content">
          {state.activeTab === 'dashboard' ? <Dashboard /> : <AnalyticsPanel />}
        </main>

        <button className="fab" onClick={() => setShowModal(true)}>
          +
        </button>

        {showModal && (
          <AddSubscriptionModal
            onClose={() => setShowModal(false)}
            onSubmit={(data) => {
              addSubscription(data);
              setShowModal(false);
            }}
          />
        )}

        {showToast && (
          <div className="toast">
            <span>✓</span>
            <span>导出成功</span>
          </div>
        )}
      </div>
    </AppContext.Provider>
  );
}

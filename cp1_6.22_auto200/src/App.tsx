import React from 'react';
import {
  DailyGoals,
  MealRecord,
  DailySummary,
  Suggestion,
  MealType,
  MEAL_TYPE_MAP,
  getGoals,
  getTodayMeals,
  getHistoryMeals,
  getDailySummary,
  getSuggestions,
  addMeal as apiAddMeal,
  updateGoals as apiUpdateGoals,
} from './services/api';
import DietForm from './components/DietForm';
import NutritionDashboard from './components/NutritionDashboard';
import MealHistory from './components/MealHistory';

interface AppState {
  goals: DailyGoals | null;
  todayMeals: MealRecord[];
  historyMeals: MealRecord[];
  todaySummary: DailySummary | null;
  suggestions: Suggestion[];
  showSettings: boolean;
  bannerHidden: boolean;
  mobileDashboardOpen: boolean;
}

type Action =
  | { type: 'SET_GOALS'; payload: DailyGoals }
  | { type: 'SET_TODAY_MEALS'; payload: MealRecord[] }
  | { type: 'SET_HISTORY_MEALS'; payload: MealRecord[] }
  | { type: 'SET_TODAY_SUMMARY'; payload: DailySummary }
  | { type: 'SET_SUGGESTIONS'; payload: Suggestion[] }
  | { type: 'ADD_MEAL'; payload: MealRecord }
  | { type: 'TOGGLE_SETTINGS'; payload?: boolean }
  | { type: 'SET_BANNER_HIDDEN'; payload: boolean }
  | { type: 'TOGGLE_MOBILE_DASHBOARD'; payload?: boolean };

const initialState: AppState = {
  goals: null,
  todayMeals: [],
  historyMeals: [],
  todaySummary: null,
  suggestions: [],
  showSettings: false,
  bannerHidden: false,
  mobileDashboardOpen: false,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_GOALS':
      return { ...state, goals: action.payload };
    case 'SET_TODAY_MEALS':
      return { ...state, todayMeals: action.payload };
    case 'SET_HISTORY_MEALS':
      return { ...state, historyMeals: action.payload };
    case 'SET_TODAY_SUMMARY':
      return { ...state, todaySummary: action.payload };
    case 'SET_SUGGESTIONS':
      return { ...state, suggestions: action.payload };
    case 'ADD_MEAL':
      return {
        ...state,
        todayMeals: [...state.todayMeals, action.payload],
        historyMeals: [...state.historyMeals, action.payload],
      };
    case 'TOGGLE_SETTINGS':
      return {
        ...state,
        showSettings: action.payload !== undefined ? action.payload : !state.showSettings,
      };
    case 'SET_BANNER_HIDDEN':
      return { ...state, bannerHidden: action.payload };
    case 'TOGGLE_MOBILE_DASHBOARD':
      return {
        ...state,
        mobileDashboardOpen:
          action.payload !== undefined ? action.payload : !state.mobileDashboardOpen,
      };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = React.createContext<AppContextValue | null>(null);

export const useAppContext = (): AppContextValue => {
  const ctx = React.useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};

const getTodayStr = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const Navbar: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => (
  <div style={styles.navbar}>
    <div style={styles.navbarInner}>
      <div style={styles.brand}>
        <span style={styles.brandIcon}>🥗</span>
        <span style={styles.brandText}>NutriLog</span>
      </div>
      <button onClick={onOpenSettings} style={styles.settingsBtn} title="设置">
        ⚙️
      </button>
    </div>
  </div>
);

const SuggestionBanner: React.FC<{
  suggestions: Suggestion[];
  hidden: boolean;
  onClose: () => void;
}> = ({ suggestions, hidden, onClose }) => {
  if (hidden || suggestions.length === 0) return null;
  const s = suggestions[0];
  const isWarning = s.type === 'warning';
  const bg = isWarning ? '#FEE2E2' : '#DBEAFE';
  const textColor = isWarning ? '#991B1B' : '#1E40AF';
  return (
    <div style={{ ...styles.banner, background: bg, color: textColor }}>
      <div style={styles.bannerContent}>
        <span style={styles.bannerIcon}>{isWarning ? '⚠️' : '💡'}</span>
        <span style={styles.bannerText}>{s.text}</span>
      </div>
      <button onClick={onClose} style={{ ...styles.bannerClose, color: textColor }}>
        ×
      </button>
    </div>
  );
};

const SettingsModal: React.FC<{
  open: boolean;
  goals: DailyGoals | null;
  onClose: () => void;
  onSave: (g: DailyGoals) => Promise<void>;
}> = ({ open, goals, onClose, onSave }) => {
  const [draft, setDraft] = React.useState<DailyGoals | null>(goals);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (goals) setDraft({ ...goals });
  }, [goals, open]);

  if (!open || !draft) return null;

  const goalFields: Array<{ key: keyof DailyGoals; label: string; unit: string; min: number; max: number; step: number }> = [
    { key: 'calories', label: '每日总热量', unit: 'kcal', min: 800, max: 5000, step: 50 },
    { key: 'protein', label: '蛋白质目标', unit: 'g', min: 20, max: 300, step: 5 },
    { key: 'fat', label: '脂肪上限', unit: 'g', min: 10, max: 200, step: 5 },
    { key: 'carbs', label: '碳水化合物目标', unit: 'g', min: 50, max: 600, step: 10 },
    { key: 'sodium', label: '钠上限', unit: 'mg', min: 500, max: 5000, step: 100 },
  ];

  const handleChange = (key: keyof DailyGoals, val: number) => {
    setDraft(prev => (prev ? { ...prev, [key]: val } : prev));
  };

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await onSave(draft);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>每日营养目标设置</h2>
          <button onClick={onClose} style={styles.modalClose}>
            ×
          </button>
        </div>
        <div style={styles.modalBody}>
          {goalFields.map(f => (
            <div key={f.key} style={styles.sliderRow}>
              <div style={styles.sliderLabel}>
                <span style={styles.sliderLabelText}>{f.label}</span>
                <div style={styles.numberInputWrap}>
                  <input
                    type="number"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={draft[f.key]}
                    onChange={e => handleChange(f.key, Number(e.target.value) || 0)}
                    style={styles.numberInput}
                  />
                  <span style={styles.sliderUnit}>{f.unit}</span>
                </div>
              </div>
              <input
                type="range"
                min={f.min}
                max={f.max}
                step={f.step}
                value={draft[f.key]}
                onChange={e => handleChange(f.key, Number(e.target.value))}
                style={styles.slider}
              />
            </div>
          ))}
        </div>
        <div style={styles.modalFooter}>
          <button onClick={onClose} style={styles.modalCancelBtn}>
            取消
          </button>
          <button onClick={handleSave} disabled={saving} style={styles.modalSaveBtn}>
            {saving ? '保存中...' : '保存目标'}
          </button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const bannerTimerRef = React.useRef<number | null>(null);

  const loadAllData = React.useCallback(async () => {
    const today = getTodayStr();
    try {
      const [goals, todayMeals, historyMeals, summary, suggestions] = await Promise.all([
        getGoals(),
        getTodayMeals(today),
        getHistoryMeals(7),
        getDailySummary(today),
        getSuggestions(today),
      ]);
      dispatch({ type: 'SET_GOALS', payload: goals });
      dispatch({ type: 'SET_TODAY_MEALS', payload: todayMeals });
      dispatch({ type: 'SET_HISTORY_MEALS', payload: historyMeals });
      dispatch({ type: 'SET_TODAY_SUMMARY', payload: summary });
      dispatch({ type: 'SET_SUGGESTIONS', payload: suggestions });
    } catch (err) {
      console.error('加载数据失败:', err);
    }
  }, []);

  React.useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleBannerClose = () => {
    dispatch({ type: 'SET_BANNER_HIDDEN', payload: true });
    if (bannerTimerRef.current) window.clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = window.setTimeout(async () => {
      const today = getTodayStr();
      try {
        const suggestions = await getSuggestions(today);
        dispatch({ type: 'SET_SUGGESTIONS', payload: suggestions });
      } catch {}
      dispatch({ type: 'SET_BANNER_HIDDEN', payload: false });
    }, 5 * 60 * 1000);
  };

  React.useEffect(() => {
    return () => {
      if (bannerTimerRef.current) window.clearTimeout(bannerTimerRef.current);
    };
  }, []);

  const handleAddMeal = async (
    mealType: MealType,
    items: Array<{ foodId: number; grams: number }>
  ) => {
    const today = getTodayStr();
    const newMeal = await apiAddMeal({ date: today, mealType, foods: items });
    dispatch({ type: 'ADD_MEAL', payload: newMeal });
    const [summary, suggestions] = await Promise.all([
      getDailySummary(today),
      getSuggestions(today),
    ]);
    dispatch({ type: 'SET_TODAY_SUMMARY', payload: summary });
    dispatch({ type: 'SET_SUGGESTIONS', payload: suggestions });
    dispatch({ type: 'SET_BANNER_HIDDEN', payload: false });
  };

  const handleUpdateGoals = async (g: DailyGoals) => {
    const updated = await apiUpdateGoals(g);
    dispatch({ type: 'SET_GOALS', payload: updated });
    const today = getTodayStr();
    const [summary, suggestions] = await Promise.all([
      getDailySummary(today),
      getSuggestions(today),
    ]);
    dispatch({ type: 'SET_TODAY_SUMMARY', payload: summary });
    dispatch({ type: 'SET_SUGGESTIONS', payload: suggestions });
  };

  const ctxValue = React.useMemo(() => ({ state, dispatch }), [state]);

  return (
    <AppContext.Provider value={ctxValue}>
      <div style={styles.app}>
        <Navbar onOpenSettings={() => dispatch({ type: 'TOGGLE_SETTINGS', payload: true })} />

        <SuggestionBanner
          suggestions={state.suggestions}
          hidden={state.bannerHidden}
          onClose={handleBannerClose}
        />

        <div className="main-layout" style={styles.mainLayout}>
          <div className="left-col" style={styles.leftCol}>
            <DietForm onAddMeal={handleAddMeal} />
            <MealHistory historyMeals={state.historyMeals} goals={state.goals} />
          </div>

          <div className="right-col" style={styles.rightCol}>
            <div className="dashboard-desktop" style={styles.dashboardDesktop}>
              <NutritionDashboard summary={state.todaySummary} />
            </div>

            <div className="dashboard-mobile" style={styles.dashboardMobile}>
              <button
                onClick={() => dispatch({ type: 'TOGGLE_MOBILE_DASHBOARD' })}
                style={styles.dashboardToggleBtn}
              >
                <span>{state.mobileDashboardOpen ? '▼' : '▲'}</span>
                <span style={{ marginLeft: 8 }}>
                  营养仪表盘 {state.mobileDashboardOpen ? '收起' : '展开'}
                </span>
              </button>
              {state.mobileDashboardOpen && (
                <NutritionDashboard summary={state.todaySummary} />
              )}
            </div>
          </div>
        </div>

        <SettingsModal
          open={state.showSettings}
          goals={state.goals}
          onClose={() => dispatch({ type: 'TOGGLE_SETTINGS', payload: false })}
          onSave={handleUpdateGoals}
        />
      </div>
    </AppContext.Provider>
  );
};

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  navbar: {
    height: 60,
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
  },
  navbarInner: {
    maxWidth: 1400,
    height: '100%',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  brandIcon: {
    fontSize: 24,
  },
  brandText: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1F2937',
    letterSpacing: '-0.02em',
  },
  settingsBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: 22,
    cursor: 'pointer',
    padding: 8,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    width: '100%',
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    fontSize: 14,
    fontWeight: 500,
    borderBottom: '1px solid rgba(0,0,0,0.05)',
  },
  bannerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    maxWidth: 1400,
    margin: '0 auto',
    width: '100%',
  },
  bannerIcon: {
    fontSize: 18,
    flexShrink: 0,
  },
  bannerText: {
    flex: 1,
    lineHeight: 1.5,
  },
  bannerClose: {
    background: 'transparent',
    border: 'none',
    fontSize: 22,
    cursor: 'pointer',
    padding: '0 4px',
    fontWeight: 600,
    lineHeight: 1,
  },
  mainLayout: {
    flex: 1,
    maxWidth: 1400,
    width: '100%',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 350px',
    gap: 24,
    padding: 24,
    alignItems: 'start',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  rightCol: {
    minWidth: 0,
  },
  dashboardDesktop: {
    position: 'sticky',
    top: 84,
  },
  dashboardMobile: {
    display: 'none',
  },
  dashboardToggleBtn: {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(10px)',
    border: 'none',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    marginBottom: 12,
    fontSize: 15,
    fontWeight: 600,
    color: '#1F2937',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    width: '100%',
    maxWidth: 500,
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#1F2937',
  },
  modalClose: {
    background: 'transparent',
    border: 'none',
    fontSize: 28,
    cursor: 'pointer',
    color: '#6B7280',
    lineHeight: 1,
    padding: 0,
  },
  modalBody: {
    padding: '20px 24px',
    overflowY: 'auto',
    flex: 1,
  },
  sliderRow: {
    marginBottom: 22,
  },
  sliderLabel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sliderLabelText: {
    fontSize: 14,
    fontWeight: 500,
    color: '#374151',
  },
  numberInputWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  numberInput: {
    width: 80,
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid #E5E7EB',
    fontSize: 14,
    fontWeight: 600,
    color: '#1F2937',
    textAlign: 'right',
    outline: 'none',
  },
  sliderUnit: {
    fontSize: 12,
    color: '#6B7280',
    minWidth: 24,
  },
  slider: {
    width: '100%',
    accentColor: '#3B82F6',
    cursor: 'pointer',
  },
  modalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #F3F4F6',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    padding: '10px 20px',
    borderRadius: 8,
    border: '1px solid #E5E7EB',
    background: '#fff',
    color: '#374151',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  modalSaveBtn: {
    padding: '10px 22px',
    borderRadius: 8,
    border: 'none',
    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
};

export default App;

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import DeckManager from './DeckManager';
import StudySession from './StudySession';
import StatsDashboard from './StatsDashboard';
import {
  Card,
  Deck,
  DailyLog,
  generateId,
  createNewCard,
  formatDate,
} from './utils/spacedRepetition';

export interface DeckWithCards extends Deck {
  cards: Card[];
}

export interface AppState {
  decks: DeckWithCards[];
  dailyLogs: Record<string, DailyLog>;
}

interface AppContextType {
  state: AppState;
  addDeck: (name: string, description: string) => void;
  deleteDeck: (deckId: string) => void;
  updateDeck: (deckId: string, data: Partial<DeckWithCards>) => void;
  addCard: (deckId: string, front: string, back: string) => void;
  updateCard: (deckId: string, card: Card) => void;
  addLog: (correct: boolean) => void;
  exportData: () => string;
  importData: (json: string) => boolean;
  addSampleData: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

type ViewType = 'decks' | 'study' | 'stats';

function createInitialState(): AppState {
  return {
    decks: [],
    dailyLogs: {},
  };
}

function loadState(): AppState {
  try {
    const saved = localStorage.getItem('flashcard-app-state');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load state', e);
  }
  return createInitialState();
}

function saveState(state: AppState) {
  try {
    localStorage.setItem('flashcard-app-state', JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state', e);
  }
}

export default function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [view, setView] = useState<ViewType>('decks');
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [viewKey, setViewKey] = useState(0);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    setViewKey((k) => k + 1);
  }, [view]);

  const addDeck = (name: string, description: string) => {
    const newDeck: DeckWithCards = {
      id: generateId(),
      name,
      description,
      cards: [],
      createdAt: formatDate(new Date()),
      lastReviewedAt: null,
      reviewCount: 0,
    };
    setState((s) => ({ ...s, decks: [...s.decks, newDeck] }));
  };

  const deleteDeck = (deckId: string) => {
    setState((s) => ({ ...s, decks: s.decks.filter((d) => d.id !== deckId) }));
    if (selectedDeckId === deckId) {
      setSelectedDeckId(null);
      setView('decks');
    }
  };

  const updateDeck = (deckId: string, data: Partial<DeckWithCards>) => {
    setState((s) => ({
      ...s,
      decks: s.decks.map((d) => (d.id === deckId ? { ...d, ...data } : d)),
    }));
  };

  const addCard = (deckId: string, front: string, back: string) => {
    const card = createNewCard(deckId, front, back);
    setState((s) => ({
      ...s,
      decks: s.decks.map((d) =>
        d.id === deckId ? { ...d, cards: [...d.cards, card] } : d
      ),
    }));
  };

  const updateCard = (deckId: string, card: Card) => {
    setState((s) => ({
      ...s,
      decks: s.decks.map((d) =>
        d.id === deckId
          ? { ...d, cards: d.cards.map((c) => (c.id === card.id ? card : c)) }
          : d
      ),
    }));
  };

  const addLog = (correct: boolean) => {
    const today = formatDate(new Date());
    setState((s) => {
      const log = s.dailyLogs[today] || { date: today, reviewed: 0, correct: 0 };
      return {
        ...s,
        dailyLogs: {
          ...s.dailyLogs,
          [today]: {
            ...log,
            reviewed: log.reviewed + 1,
            correct: log.correct + (correct ? 1 : 0),
          },
        },
      };
    });
  };

  const exportData = (): string => {
    return JSON.stringify(state, null, 2);
  };

  const importData = (json: string): boolean => {
    try {
      const data = JSON.parse(json) as AppState;
      if (!data.decks || !Array.isArray(data.decks)) return false;
      setState(data);
      return true;
    } catch {
      return false;
    }
  };

  const addSampleData = () => {
    const englishId = generateId();
    const historyId = generateId();
    const chemistryId = generateId();
    const today = formatDate(new Date());

    const englishCards: Card[] = [
      { id: generateId(), deckId: englishId, front: 'Abundant', back: '丰富的，充裕的', interval: 1, easeFactor: 2.5, repetitions: 2, nextReviewDate: today, correctCount: 5, wrongCount: 1 },
      { id: generateId(), deckId: englishId, front: 'Benevolent', back: '仁慈的，善良的', interval: 3, easeFactor: 2.6, repetitions: 3, nextReviewDate: today, correctCount: 6, wrongCount: 0 },
      { id: generateId(), deckId: englishId, front: 'Candid', back: '坦率的，直言的', interval: 0, easeFactor: 2.5, repetitions: 0, nextReviewDate: today, correctCount: 0, wrongCount: 0 },
      { id: generateId(), deckId: englishId, front: 'Diligent', back: '勤勉的，用功的', interval: 1, easeFactor: 2.5, repetitions: 1, nextReviewDate: today, correctCount: 2, wrongCount: 1 },
      { id: generateId(), deckId: englishId, front: 'Eloquent', back: '雄辩的，有口才的', interval: 0, easeFactor: 2.5, repetitions: 0, nextReviewDate: today, correctCount: 0, wrongCount: 0 },
      { id: generateId(), deckId: englishId, front: 'Frugal', back: '节俭的，节约的', interval: 2, easeFactor: 2.4, repetitions: 2, nextReviewDate: today, correctCount: 4, wrongCount: 2 },
    ];

    const historyCards: Card[] = [
      { id: generateId(), deckId: historyId, front: '秦始皇统一六国', back: '公元前221年', interval: 7, easeFactor: 2.8, repetitions: 5, nextReviewDate: today, correctCount: 10, wrongCount: 1 },
      { id: generateId(), deckId: historyId, front: '辛亥革命爆发', back: '1911年10月10日', interval: 3, easeFactor: 2.5, repetitions: 3, nextReviewDate: today, correctCount: 6, wrongCount: 2 },
      { id: generateId(), deckId: historyId, front: '新中国成立', back: '1949年10月1日', interval: 14, easeFactor: 3.0, repetitions: 6, nextReviewDate: today, correctCount: 12, wrongCount: 0 },
      { id: generateId(), deckId: historyId, front: '五四运动', back: '1919年5月4日', interval: 1, easeFactor: 2.3, repetitions: 1, nextReviewDate: today, correctCount: 2, wrongCount: 3 },
    ];

    const chemistryCards: Card[] = [
      { id: generateId(), deckId: chemistryId, front: '水的化学式', back: 'H₂O', interval: 30, easeFactor: 3.0, repetitions: 8, nextReviewDate: today, correctCount: 15, wrongCount: 0 },
      { id: generateId(), deckId: chemistryId, front: '硫酸的化学式', back: 'H₂SO₄', interval: 7, easeFactor: 2.7, repetitions: 4, nextReviewDate: today, correctCount: 8, wrongCount: 1 },
      { id: generateId(), deckId: chemistryId, front: '阿伏伽德罗常数', back: '约6.02×10²³ mol⁻¹', interval: 2, easeFactor: 2.4, repetitions: 2, nextReviewDate: today, correctCount: 4, wrongCount: 2 },
    ];

    const now = new Date();
    const logs: Record<string, DailyLog> = {};
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);
      const reviewed = Math.floor(Math.random() * 25) + 5;
      const correct = Math.floor(reviewed * (0.6 + Math.random() * 0.35));
      if (i < 7 || Math.random() > 0.3) {
        logs[dateStr] = { date: dateStr, reviewed, correct };
      }
    }

    setState({
      decks: [
        {
          id: englishId,
          name: '英语单词',
          description: 'GRE高频词汇，每天坚持记忆10个新单词',
          cards: englishCards,
          createdAt: today,
          lastReviewedAt: today,
          reviewCount: 28,
        },
        {
          id: historyId,
          name: '历史年代',
          description: '中国近现代史重要事件时间节点',
          cards: historyCards,
          createdAt: today,
          lastReviewedAt: today,
          reviewCount: 15,
        },
        {
          id: chemistryId,
          name: '化学公式',
          description: '常用化学方程式与物理常数',
          cards: chemistryCards,
          createdAt: today,
          lastReviewedAt: today,
          reviewCount: 10,
        },
      ],
      dailyLogs: logs,
    });
  };

  const selectedDeck = state.decks.find((d) => d.id === selectedDeckId) || null;

  const ctxValue: AppContextType = {
    state,
    addDeck,
    deleteDeck,
    updateDeck,
    addCard,
    updateCard,
    addLog,
    exportData,
    importData,
    addSampleData,
  };

  return (
    <AppContext.Provider value={ctxValue}>
      <div className="app-container">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <span className="sidebar-logo-icon">📚</span>
            <span>知识闪卡</span>
          </div>
          <button
            className={`nav-item ${view === 'decks' ? 'active' : ''}`}
            onClick={() => {
              setView('decks');
              setSelectedDeckId(null);
            }}
          >
            <span className="nav-icon">📁</span>
            <span>卡片集</span>
          </button>
          <button
            className={`nav-item ${view === 'stats' ? 'active' : ''}`}
            onClick={() => setView('stats')}
          >
            <span className="nav-icon">📊</span>
            <span>学习统计</span>
          </button>
          <div style={{ flex: 1 }} />
          {state.decks.length === 0 && (
            <button
              className="glass-btn primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={addSampleData}
            >
              ✨ 加载示例数据
            </button>
          )}
        </aside>

        <main className="main-content">
          <div key={viewKey} className="view-enter">
            {view === 'decks' && !selectedDeckId && (
              <DeckManager
                onStudy={(deckId) => {
                  setSelectedDeckId(deckId);
                  setView('study');
                }}
              />
            )}
            {view === 'study' && selectedDeck && (
              <StudySession
                deck={selectedDeck}
                onBack={() => {
                  setView('decks');
                  setSelectedDeckId(null);
                }}
              />
            )}
            {view === 'study' && !selectedDeck && (
              <DeckManager
                onStudy={(deckId) => {
                  setSelectedDeckId(deckId);
                  setView('study');
                }}
              />
            )}
            {view === 'stats' && <StatsDashboard />}
          </div>
        </main>

        <nav className="bottom-nav">
          <div className="bottom-nav-inner">
            <button
              className={`bottom-nav-item ${view === 'decks' ? 'active' : ''}`}
              onClick={() => {
                setView('decks');
                setSelectedDeckId(null);
              }}
            >
              <span className="bottom-nav-icon">📁</span>
              <span>卡片集</span>
            </button>
            <button
              className={`bottom-nav-item ${view === 'stats' ? 'active' : ''}`}
              onClick={() => setView('stats')}
            >
              <span className="bottom-nav-icon">📊</span>
              <span>统计</span>
            </button>
          </div>
        </nav>
      </div>
    </AppContext.Provider>
  );
}

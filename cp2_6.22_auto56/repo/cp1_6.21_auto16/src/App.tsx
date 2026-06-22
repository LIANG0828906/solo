import React, { useState, useEffect, useCallback } from 'react';
import WeatherCard from './WeatherCard';
import CollectionPage from './CollectionPage';
import { WeatherCardData, CITIES, generateWeatherCard, getTodayStr, getDateNDaysAgo } from './weatherData';

const COLLECTION_KEY = 'weather_collections';
const LAST_OPEN_KEY = 'last_open_date';

function loadCollections(): WeatherCardData[] {
  try {
    const raw = localStorage.getItem(COLLECTION_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCollections(list: WeatherCardData[]) {
  const trimmed = list.slice(-30);
  localStorage.setItem(COLLECTION_KEY, JSON.stringify(trimmed));
}

const App: React.FC = () => {
  const [tab, setTab] = useState<'today' | 'collection'>('today');
  const [pageKey, setPageKey] = useState(0);
  const [city, setCity] = useState<string>(CITIES[0]);
  const [todayCard, setTodayCard] = useState<WeatherCardData | null>(null);
  const [collections, setCollections] = useState<WeatherCardData[]>([]);
  const [toast, setToast] = useState<{ msg: string; visible: boolean; leaving: boolean }>({ msg: '', visible: false, leaving: false });

  useEffect(() => {
    const saved = loadCollections();
    const today = new Date();
    const todayStr = getTodayStr();
    const lastOpen = localStorage.getItem(LAST_OPEN_KEY);

    if (lastOpen && lastOpen !== todayStr) {
      const lastDate = new Date(lastOpen);
      const todayD = new Date(todayStr);
      const diffDays = Math.max(0, Math.min(30, Math.floor((todayD.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))));

      const toAdd: WeatherCardData[] = [];
      for (let i = diffDays; i >= 1; i--) {
        const d = getDateNDaysAgo(i);
        for (const c of CITIES.slice(0, 1)) {
          const card = generateWeatherCard(c, d);
          if (!saved.find((s) => s.id === card.id)) {
            toAdd.push(card);
          }
        }
      }
      if (toAdd.length > 0) {
        const merged = [...saved, ...toAdd].slice(-30);
        saveCollections(merged);
        setCollections(merged);
      } else {
        setCollections(saved);
      }
    } else {
      setCollections(saved);
    }

    localStorage.setItem(LAST_OPEN_KEY, todayStr);
    setTodayCard(generateWeatherCard(city, today));
  }, []);

  useEffect(() => {
    if (todayCard) {
      setTodayCard(generateWeatherCard(city, new Date()));
    }
  }, [city]);

  const showToast = useCallback((msg: string) => {
    setToast({ msg, visible: true, leaving: false });
    setTimeout(() => {
      setToast((t) => ({ ...t, leaving: true }));
      setTimeout(() => setToast({ msg: '', visible: false, leaving: false }), 300);
    }, 3000);
  }, []);

  const toggleCollect = useCallback((data: WeatherCardData) => {
    setCollections((prev) => {
      const exists = prev.find((c) => c.id === data.id);
      let next: WeatherCardData[];
      if (exists) {
        next = prev.filter((c) => c.id !== data.id);
      } else {
        next = [...prev, data].slice(-30);
      }
      saveCollections(next);
      return next;
    });
  }, []);

  const removeCard = useCallback((id: string) => {
    setCollections((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveCollections(next);
      return next;
    });
    showToast('已移除收藏');
  }, [showToast]);

  const viewCard = useCallback((card: WeatherCardData) => {
    setCity(card.city);
    setTab('today');
    setPageKey((k) => k + 1);
    setTimeout(() => {
      setTodayCard(card);
    }, 50);
  }, []);

  const handleCityChange = useCallback((nextCity: string) => {
    setCity(nextCity);
  }, []);

  const handleTabClick = (t: 'today' | 'collection') => {
    if (t === tab) return;
    setTab(t);
    setPageKey((k) => k + 1);
  };

  const isCollected = todayCard ? collections.some((c) => c.id === todayCard.id) : false;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ padding: '28px 20px 12px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', letterSpacing: 2 }}>
          WEATHER CARD COLLECTION
        </div>
        <div style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>
          {tab === 'today' ? '今日天气' : '我的收藏'}
        </div>
      </div>

      <div key={pageKey} className="page-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {tab === 'today' && todayCard && (
          <div style={{ padding: '20px 20px 80px', overflowY: 'auto', flex: 1 }}>
            <WeatherCard
              data={todayCard}
              isCollected={isCollected}
              onToggleCollect={toggleCollect}
              onCityChange={handleCityChange}
              onShowToast={showToast}
            />
            <div style={{ maxWidth: 600, margin: '28px auto 0', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
              点击城市名切换城市 · 点击心形收藏卡片
            </div>
          </div>
        )}
        {tab === 'collection' && (
          <CollectionPage cards={collections} onViewCard={viewCard} onRemoveCard={removeCard} />
        )}
      </div>

      <div
        className="glass"
        style={{
          position: 'fixed',
          left: 20,
          right: 20,
          bottom: 20,
          height: 60,
          borderRadius: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 10
        }}
      >
        {(['today', 'collection'] as const).map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => handleTabClick(t)}
              style={{
                flex: 1,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                color: active ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
                transition: 'all 0.25s'
              }}
            >
              <span style={{ fontSize: 18 }}>{t === 'today' ? '☀' : '♥'}</span>
              <span>{t === 'today' ? '今日天气' : '我的收藏'}</span>
            </button>
          );
        })}
      </div>

      {toast.visible && (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 100,
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            background: '#FFFFFF',
            color: '#333',
            fontSize: 13,
            borderRadius: 8,
            border: '1px solid #E0E0E0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            zIndex: 100,
            animation: toast.leaving ? 'toastOut 0.3s ease forwards' : 'toastIn 0.3s ease forwards',
            whiteSpace: 'nowrap'
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default App;

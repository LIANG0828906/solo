import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import MapView from './components/MapView';
import ARScene from './components/ARScene';
import HUD from './components/HUD';
import type { Treasure, Player, TreasureType } from './types';
import { SCORE_MAP } from './types';
import './App.css';

type ViewMode = 'map' | 'ar';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [treasures, setTreasures] = useState<Treasure[]>([]);
  const [player, setPlayer] = useState<Player | null>(null);
  const [leaderboard, setLeaderboard] = useState<Player[]>([]);
  const [selectedTreasure, setSelectedTreasure] = useState<Treasure | null>(null);
  const [gameRound, setGameRound] = useState(1);
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdownEndTime, setCountdownEndTime] = useState(0);
  const [centerLat, setCenterLat] = useState(31.2304);
  const [centerLng, setCenterLng] = useState(121.4737);
  const [showClaimAnimation, setShowClaimAnimation] = useState(false);
  const [lastPoints, setLastPoints] = useState(0);
  const playerIdRef = useRef<string>(uuidv4());
  const playerNameRef = useRef<string>(`玩家${Math.floor(Math.random() * 1000)}`);

  const fetchTreasures = useCallback(async () => {
    try {
      const res = await fetch('/api/treasures');
      const data = await res.json();
      setTreasures(data.treasures);
      setGameRound(data.gameRound);
      setCountdownActive(data.countdownActive);
      setCountdownEndTime(data.countdownEndTime);
      setCenterLat(data.centerLat);
      setCenterLng(data.centerLng);
    } catch (err) {
      console.error('获取宝藏失败:', err);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      setLeaderboard(data.leaderboard);
    } catch (err) {
      console.error('获取排行榜失败:', err);
    }
  }, []);

  const initPlayer = useCallback(async () => {
    try {
      const res = await fetch('/api/player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: playerIdRef.current,
          playerName: playerNameRef.current,
        }),
      });
      const data = await res.json();
      setPlayer(data);
    } catch (err) {
      console.error('初始化玩家失败:', err);
      setPlayer({
        id: playerIdRef.current,
        name: playerNameRef.current,
        score: 0,
      });
    }
  }, []);

  const claimTreasure = useCallback(async (treasureId: string) => {
    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          treasureId,
          playerId: playerIdRef.current,
          playerName: playerNameRef.current,
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        setTreasures(prev =>
          prev.map(t => (t.id === treasureId ? { ...t, collected: true } : t))
        );
        setPlayer(prev => prev ? { ...prev, score: data.totalScore } : null);
        setLastPoints(data.points);
        setShowClaimAnimation(true);
        setTimeout(() => setShowClaimAnimation(false), 1000);
        setCountdownActive(data.countdownActive);
        setCountdownEndTime(data.countdownEndTime);
      }
      
      return data.success;
    } catch (err) {
      console.error('拾取宝藏失败:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    initPlayer();
    fetchTreasures();
    fetchLeaderboard();
  }, [initPlayer, fetchTreasures, fetchLeaderboard]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeaderboard();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchTreasures();
    }, 2000);
    return () => clearInterval(interval);
  }, [fetchTreasures]);

  const handleTreasureClick = (treasure: Treasure) => {
    if (treasure.collected) return;
    setSelectedTreasure(treasure);
    setViewMode('ar');
  };

  const handleBackToMap = () => {
    setViewMode('map');
    setSelectedTreasure(null);
  };

  const handleTreasureCollected = async (treasureId: string) => {
    const success = await claimTreasure(treasureId);
    if (success) {
      setTimeout(() => {
        handleBackToMap();
      }, 800);
    }
  };

  const remainingTreasures = treasures.filter(t => !t.collected);

  return (
    <div className="app-container">
      {viewMode === 'map' ? (
        <MapView
          treasures={treasures}
          centerLat={centerLat}
          centerLng={centerLng}
          onTreasureClick={handleTreasureClick}
        />
      ) : (
        <ARScene
          treasure={selectedTreasure}
          playerLat={centerLat}
          playerLng={centerLng}
          onTreasureCollected={handleTreasureCollected}
          onBack={handleBackToMap}
        />
      )}
      
      <HUD
        player={player}
        leaderboard={leaderboard}
        viewMode={viewMode}
        gameRound={gameRound}
        countdownActive={countdownActive}
        countdownEndTime={countdownEndTime}
        remainingTreasures={remainingTreasures.length}
        showClaimAnimation={showClaimAnimation}
        lastPoints={lastPoints}
        onBackToMap={handleBackToMap}
      />
    </div>
  );
}

export default App;

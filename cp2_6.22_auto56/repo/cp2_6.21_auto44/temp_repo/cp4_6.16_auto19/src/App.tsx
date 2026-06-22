import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { Sidebar } from '@/ui/components/Sidebar';
import { HomePage } from '@/ui/pages/HomePage';
import { ActivityDetailPage } from '@/ui/pages/ActivityDetailPage';
import { BoardgamesPage } from '@/ui/pages/BoardgamesPage';
import { JoinActivityPage } from '@/ui/pages/JoinActivityPage';
import { PlayerProfile } from '@/modules/player/PlayerProfile';
import { initializeBoardgames } from '@/modules/boardgame/BoardgameService';
import { getCurrentPlayer } from '@/modules/player/PlayerService';
import { useAppStore } from '@/store/useAppStore';
import styles from './App.module.css';

function AppContent() {
  const { sidebarCollapsed, setCurrentPlayer, setActivities } = useAppStore();

  useEffect(() => {
    const init = async () => {
      await initializeBoardgames();
      const player = await getCurrentPlayer();
      if (player) {
        setCurrentPlayer(player);
      }
    };
    init();
  }, [setCurrentPlayer]);

  return (
    <div className={styles.app}>
      <Sidebar />
      <main
        className={styles.mainContent}
        style={{ marginLeft: sidebarCollapsed ? '72px' : '260px' }}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/boardgames" element={<BoardgamesPage />} />
          <Route path="/activity/:id" element={<ActivityDetailPage />} />
          <Route path="/join" element={<JoinActivityPage />} />
          <Route path="/profile/:playerId" element={<PlayerProfile />} />
          <Route path="/profile/me" element={<PlayerProfile />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

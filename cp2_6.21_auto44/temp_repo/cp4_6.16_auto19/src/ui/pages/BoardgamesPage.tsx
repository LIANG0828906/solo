import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { getAllBoardgames, searchBoardgames, addCustomBoardgame } from '@/modules/boardgame/BoardgameService';
import { AddBoardgameModal } from '@/ui/components/AddBoardgameModal';
import type { Boardgame } from '@/types';
import styles from './BoardgamesPage.module.css';

export function BoardgamesPage() {
  const { boardgames, setBoardgames, addBoardgame } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGames = async () => {
      setLoading(true);
      try {
        const games = await getAllBoardgames();
        setBoardgames(games);
      } catch (error) {
        console.error('加载桌游库失败:', error);
      } finally {
        setLoading(false);
      }
    };
    loadGames();
  }, [setBoardgames]);

  useEffect(() => {
    const search = async () => {
      if (!searchQuery.trim()) {
        const games = await getAllBoardgames();
        setBoardgames(games);
        return;
      }
      const results = await searchBoardgames(searchQuery);
      setBoardgames(results);
    };

    const timeout = setTimeout(search, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, setBoardgames]);

  const handleAddGame = async (game: Omit<Boardgame, 'id' | 'isCustom'>) => {
    const newGame = await addCustomBoardgame(game);
    addBoardgame(newGame);
    setShowAddModal(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>桌游库</h1>
        <p className={styles.subtitle}>探索精彩的桌游世界</p>
      </div>

      <div className={styles.toolbar}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="搜索桌游名称或描述..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
          + 添加桌游
        </button>
      </div>

      {loading ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>⏳</div>
          <div className={styles.emptyText}>加载中...</div>
        </div>
      ) : boardgames.length > 0 ? (
        <div className={styles.grid}>
          {boardgames.map((game, index) => (
            <div
              key={game.id}
              className={styles.card}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={styles.cardHeader}>
                <div className={styles.cardEmoji}>{game.emoji}</div>
                <div className={styles.cardInfo}>
                  <div className={styles.cardName}>
                    {game.name}
                    {game.isCustom && <span className={styles.customBadge}>自定义</span>}
                  </div>
                  <div className={styles.cardRating}>⭐ BGG {game.bggRating.toFixed(1)}</div>
                </div>
              </div>
              <div className={styles.cardMeta}>
                <span className={styles.metaTag}>
                  👥 {game.minPlayers}-{game.maxPlayers} 人
                </span>
                <span className={styles.metaTag}>⏱️ {game.averageDuration} 分钟</span>
              </div>
              <p className={styles.cardDescription}>{game.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔍</div>
          <div className={styles.emptyText}>没有找到匹配的桌游</div>
        </div>
      )}

      {showAddModal && (
        <AddBoardgameModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddGame}
        />
      )}
    </div>
  );
}

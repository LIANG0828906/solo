import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAppStore } from '@/store/useAppStore';
import { getPlayerById, createPlayer, updatePlayerName } from './PlayerService';
import { getPlayerStats } from '../activity/ActivityService';
import type { Player, PlayerStats as PlayerStatsType } from '@/types';
import styles from './PlayerProfile.module.css';

export function PlayerProfile() {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const { currentPlayer, setCurrentPlayer } = useAppStore();

  const [player, setPlayer] = useState<Player | null>(null);
  const [stats, setStats] = useState<PlayerStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        let targetPlayer: Player | null = null;

        if (playerId === 'me' || !playerId) {
          targetPlayer = currentPlayer;
          setIsOwnProfile(true);
          if (!targetPlayer) {
            setIsEditing(true);
            setLoading(false);
            return;
          }
        } else {
          targetPlayer = (await getPlayerById(playerId)) || null;
          setIsOwnProfile(currentPlayer?.id === playerId);
        }

        setPlayer(targetPlayer);
        if (targetPlayer) {
          setEditName(targetPlayer.name);
          const playerStats = await getPlayerStats(targetPlayer.id);
          setStats(playerStats);
        }
      } catch (error) {
        console.error('加载玩家资料失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [playerId, currentPlayer]);

  const handleSaveName = async () => {
    if (!editName.trim()) {
      alert('请输入昵称');
      return;
    }

    try {
      if (player) {
        const updated = await updatePlayerName(player.id, editName.trim());
        if (updated) {
          setPlayer(updated);
          if (isOwnProfile) {
            setCurrentPlayer(updated);
          }
        }
      } else {
        const newPlayer = await createPlayer(editName.trim());
        setPlayer(newPlayer);
        setCurrentPlayer(newPlayer);
        setIsOwnProfile(true);
        const playerStats = await getPlayerStats(newPlayer.id);
        setStats(playerStats);
      }
      setIsEditing(false);
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '60px' }}>加载中...</div>
      </div>
    );
  }

  const maxCount = stats?.gamePreferences?.length
    ? Math.max(...stats.gamePreferences.map((g) => g.count))
    : 0;

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>
        ← 返回
      </button>

      <div className={styles.header}>
        <div className={styles.avatar}>
          {player ? player.avatarInitial : '?'}
        </div>

        {isEditing ? (
          <>
            <input
              type="text"
              className={styles.nameInput}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="输入你的昵称"
              autoFocus
            />
            <div>
              <button className={styles.saveBtn} onClick={handleSaveName}>
                保存
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className={styles.name}>{player?.name || '未命名玩家'}</h1>
            {player && (
              <p className={styles.joinedDate}>
                加入于 {format(new Date(player.createdAt), 'yyyy年M月d日', { locale: zhCN })}
              </p>
            )}
            {isOwnProfile && (
              <button
                style={{
                  marginTop: '12px',
                  padding: '6px 16px',
                  borderRadius: '6px',
                  background: 'transparent',
                  color: 'var(--color-wood-medium)',
                  fontSize: '13px',
                  border: '1px solid var(--color-wood-light)',
                  cursor: 'pointer',
                }}
                onClick={() => setIsEditing(true)}
              >
                编辑资料
              </button>
            )}
          </>
        )}
      </div>

      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.totalActivities}</div>
            <div className={styles.statLabel}>参与活动</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.wins}</div>
            <div className={styles.statLabel}>胜利场次</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{(stats.winRate * 100).toFixed(0)}%</div>
            <div className={styles.statLabel}>总胜率</div>
          </div>
        </div>
      )}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>🎮</span>
          桌游偏好
        </h2>

        {stats?.gamePreferences?.length ? (
          <div className={styles.preferenceList}>
            {stats.gamePreferences.map((pref, index) => (
              <div
                key={pref.gameId}
                className={styles.preferenceItem}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className={styles.preferenceHeader}>
                  <span className={styles.preferenceName}>
                    <span className={styles.preferenceEmoji}>🎲</span>
                    {pref.gameName}
                  </span>
                  <span className={styles.preferenceCount}>{pref.count} 次</span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${maxCount > 0 ? (pref.count / maxCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🎲</div>
            <div className={styles.emptyText}>还没有参与过任何活动</div>
          </div>
        )}
      </div>
    </div>
  );
}

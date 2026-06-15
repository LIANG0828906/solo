import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAppStore } from '@/store/useAppStore';
import {
  getActivityById,
  getActivityPlayers,
  joinActivity,
  leaveActivity,
  recordGameResult,
} from '@/modules/activity/ActivityService';
import { getBoardgameById } from '@/modules/boardgame/BoardgameService';
import { getCurrentPlayer, createPlayer } from '@/modules/player/PlayerService';
import { RecordResultModal } from '@/ui/components/RecordResultModal';
import type { Activity, Boardgame, ActivityPlayer, Player } from '@/types';
import styles from './ActivityDetailPage.module.css';

export function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentPlayer, setCurrentPlayer } = useAppStore();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [boardgame, setBoardgame] = useState<Boardgame | null>(null);
  const [players, setPlayers] = useState<ActivityPlayer[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [playerNameInput, setPlayerNameInput] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const act = await getActivityById(id);
      if (!act) {
        navigate('/');
        return;
      }
      setActivity(act);

      const game = await getBoardgameById(act.boardgameId);
      setBoardgame(game || null);

      const playerList = await getActivityPlayers(id);
      setPlayers(playerList);

      const player = await getCurrentPlayer();
      if (player) {
        setCurrentPlayer(player);
        const joined = playerList.some((p) => p.playerId === player.id);
        setIsJoined(joined);
        setIsHost(act.hostId === player.id);
      }
    } catch (error) {
      console.error('加载活动详情失败:', error);
    } finally {
      setLoading(false);
    }
  }, [id, navigate, setCurrentPlayer]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleJoin = async () => {
    if (!id || !activity) return;

    let player: Player | null = currentPlayer;
    if (!player) {
      if (!playerNameInput.trim()) {
        setShowNameInput(true);
        return;
      }
      player = await createPlayer(playerNameInput.trim());
      setCurrentPlayer(player);
      setShowNameInput(false);
    }

    const result = await joinActivity(id, player.id, player.name);
    if (result) {
      setIsJoined(true);
      loadData();
    }
  };

  const handleLeave = async () => {
    if (!id || !currentPlayer) return;
    if (!confirm('确定要取消报名吗？')) return;

    const success = await leaveActivity(id, currentPlayer.id);
    if (success) {
      setIsJoined(false);
      loadData();
    }
  };

  const handleCopyInviteCode = async () => {
    if (!activity) return;
    try {
      await navigator.clipboard.writeText(activity.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      alert(`邀请码：${activity.inviteCode}`);
    }
  };

  const handleRecordResult = async (results: { playerId: string; rank?: number }[]) => {
    if (!id) return;
    await recordGameResult(id, results);
    setShowRecordModal(false);
    loadData();
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '60px' }}>加载中...</div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '60px' }}>活动不存在</div>
      </div>
    );
  }

  const sortedPlayers = [...players].sort((a, b) => {
    if (a.rank !== undefined && b.rank !== undefined) {
      return a.rank - b.rank;
    }
    if (a.rank !== undefined) return -1;
    if (b.rank !== undefined) return 1;
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
  });

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>
        ← 返回
      </button>

      <div className={styles.headerCard}>
        <span
          className={`${styles.statusBadge} ${
            activity.status === 'upcoming' ? styles.statusUpcoming : styles.statusFinished
          }`}
        >
          {activity.status === 'upcoming' ? '即将开始' : '已结束'}
        </span>

        <div className={styles.gameEmoji}>{boardgame?.emoji || '🎲'}</div>
        <h1 className={styles.title}>{activity.title}</h1>
        <p className={styles.gameName}>{boardgame?.name || '未知桌游'}</p>

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoIcon}>📅</span>
            <div className={styles.infoContent}>
              <div className={styles.infoLabel}>时间</div>
              <div className={styles.infoValue}>
                {format(new Date(activity.dateTime), 'yyyy年M月d日 HH:mm', { locale: zhCN })}
              </div>
            </div>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.infoIcon}>📍</span>
            <div className={styles.infoContent}>
              <div className={styles.infoLabel}>地点</div>
              <div className={styles.infoValue}>{activity.location}</div>
            </div>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.infoIcon}>👤</span>
            <div className={styles.infoContent}>
              <div className={styles.infoLabel}>主办方</div>
              <div className={styles.infoValue}>{activity.hostName}</div>
            </div>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.infoIcon}>👥</span>
            <div className={styles.infoContent}>
              <div className={styles.infoLabel}>报名人数</div>
              <div className={styles.infoValue}>{players.length} 人</div>
            </div>
          </div>
        </div>

        <div className={styles.inviteCodeSection}>
          <span className={styles.inviteCodeLabel}>邀请码</span>
          <span className={styles.inviteCode}>{activity.inviteCode}</span>
          <button className={styles.copyBtn} onClick={handleCopyInviteCode}>
            {copied ? '已复制 ✓' : '复制'}
          </button>
        </div>

        {activity.notes && <div className={styles.notes}>📝 {activity.notes}</div>}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>👥</span>
          报名列表
        </h2>

        {sortedPlayers.length > 0 ? (
          <div className={styles.playerList}>
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={styles.playerCard}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={styles.playerAvatar}>
                  {player.playerName.charAt(0).toUpperCase()}
                </div>
                <div className={styles.playerInfo}>
                  <div className={styles.playerName}>{player.playerName}</div>
                  {player.rank !== undefined && (
                    <div className={styles.playerRank}>第 {player.rank} 名</div>
                  )}
                  {player.playerId === activity.hostId && (
                    <span className={styles.hostBadge}>主办方</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyPlayers}>
            <div className={styles.emptyIcon}>😕</div>
            <div className={styles.emptyText}>暂无报名，快来第一个报名吧！</div>
          </div>
        )}

        {activity.status === 'upcoming' && (
          <>
            {showNameInput && !currentPlayer && (
              <div style={{ marginTop: 16 }}>
                <input
                  type="text"
                  placeholder="请输入你的昵称"
                  value={playerNameInput}
                  onChange={(e) => setPlayerNameInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-wood-light)',
                    marginBottom: '12px',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            )}

            {!isJoined ? (
              <button className={styles.joinBtn} onClick={handleJoin}>
                我要报名
              </button>
            ) : (
              <button className={styles.leaveBtn} onClick={handleLeave}>
                取消报名
              </button>
            )}
          </>
        )}

        {isHost && activity.status === 'finished' && (
          <button className={styles.recordBtn} onClick={() => setShowRecordModal(true)}>
            编辑比赛结果
          </button>
        )}

        {isHost && activity.status === 'upcoming' && (
          <button className={styles.recordBtn} onClick={() => setShowRecordModal(true)}>
            录入比赛结果
          </button>
        )}
      </div>

      {showRecordModal && (
        <RecordResultModal
          players={players}
          onClose={() => setShowRecordModal(false)}
          onSubmit={handleRecordResult}
        />
      )}
    </div>
  );
}

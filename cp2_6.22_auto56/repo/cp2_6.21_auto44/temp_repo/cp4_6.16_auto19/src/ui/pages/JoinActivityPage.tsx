import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAppStore } from '@/store/useAppStore';
import {
  getActivityByInviteCode,
  joinActivity,
  getActivityPlayers,
} from '@/modules/activity/ActivityService';
import { getBoardgameById } from '@/modules/boardgame/BoardgameService';
import { getCurrentPlayer, createPlayer } from '@/modules/player/PlayerService';
import type { Activity, Boardgame } from '@/types';
import styles from './JoinActivityPage.module.css';

export function JoinActivityPage() {
  const navigate = useNavigate();
  const { currentPlayer, setCurrentPlayer } = useAppStore();

  const [inviteCode, setInviteCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [foundActivity, setFoundActivity] = useState<Activity | null>(null);
  const [foundGame, setFoundGame] = useState<Boardgame | null>(null);
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [step, setStep] = useState<'input' | 'confirm'>('input');

  useEffect(() => {
    const loadPlayer = async () => {
      const player = await getCurrentPlayer();
      if (player) {
        setCurrentPlayer(player);
        setPlayerName(player.name);
      }
    };
    loadPlayer();
  }, [setCurrentPlayer]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || inviteCode.length !== 6) {
      setError('请输入6位数字邀请码');
      return;
    }

    setError('');
    setIsSearching(true);
    try {
      const activity = await getActivityByInviteCode(inviteCode.trim());
      if (activity) {
        setFoundActivity(activity);
        const game = await getBoardgameById(activity.boardgameId);
        setFoundGame(game || null);
        setStep('confirm');
      } else {
        setError('未找到该活动，请检查邀请码是否正确');
      }
    } catch (err) {
      setError('查找活动失败，请稍后重试');
    } finally {
      setIsSearching(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundActivity) return;

    let player = currentPlayer;
    if (!player) {
      if (!playerName.trim()) {
        setError('请输入你的昵称');
        return;
      }
      try {
        player = await createPlayer(playerName.trim());
        setCurrentPlayer(player);
      } catch (err) {
        setError('创建玩家失败，请重试');
        return;
      }
    }

    setIsJoining(true);
    try {
      const result = await joinActivity(
        foundActivity.id,
        player.id,
        player.name
      );
      if (result) {
        navigate(`/activity/${foundActivity.id}`);
      } else {
        setError('你已经报名了这个活动');
      }
    } catch (err) {
      setError('加入活动失败，请重试');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}>🔗</div>
        <h1 className={styles.title}>加入活动</h1>
        <p className={styles.subtitle}>输入邀请码加入桌游局</p>

        {error && <div className={styles.error}>{error}</div>}

        {step === 'input' ? (
          <form className={styles.form} onSubmit={handleSearch}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>活动邀请码</label>
              <input
                type="text"
                className={styles.formInput}
                value={inviteCode}
                onChange={(e) => {
                  setInviteCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setError('');
                }}
                placeholder="000000"
                maxLength={6}
                autoFocus
              />
            </div>

            <div className={styles.info}>
              💡 小贴士：向活动主办方获取6位数字邀请码，输入后即可加入活动
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSearching}
            >
              {isSearching ? '查找中...' : '查找活动'}
            </button>
          </form>
        ) : (
          <form className={styles.form} onSubmit={handleJoin}>
            {foundActivity && (
              <div className={styles.resultCard}>
                <div className={styles.resultTitle}>
                  <span className={styles.resultEmoji}>
                    {foundGame?.emoji || '🎲'}
                  </span>
                  {foundActivity.title}
                </div>
                <div className={styles.resultMeta}>
                  <div>🎮 {foundGame?.name || '未知桌游'}</div>
                  <div>
                    📅{' '}
                    {format(new Date(foundActivity.dateTime), 'yyyy年M月d日 HH:mm', {
                      locale: zhCN,
                    })}
                  </div>
                  <div>📍 {foundActivity.location}</div>
                  <div>👤 主办方：{foundActivity.hostName}</div>
                </div>
              </div>
            )}

            {!currentPlayer && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>你的昵称</label>
                <input
                  type="text"
                  className={`${styles.formInput} ${styles.formInputNormal}`}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="请输入你的昵称"
                />
              </div>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isJoining}
            >
              {isJoining ? '加入中...' : '确认加入'}
            </button>

            <button
              type="button"
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '10px',
                background: 'transparent',
                color: 'var(--color-wood-medium)',
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
              }}
              onClick={() => {
                setStep('input');
                setFoundActivity(null);
                setFoundGame(null);
              }}
            >
              ← 返回重新输入
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

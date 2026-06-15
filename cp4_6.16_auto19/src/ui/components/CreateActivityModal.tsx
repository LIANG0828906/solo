import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { createActivity, joinActivity } from '@/modules/activity/ActivityService';
import { getCurrentPlayer, createPlayer } from '@/modules/player/PlayerService';
import type { Boardgame } from '@/types';
import styles from './Modal.module.css';

interface CreateActivityModalProps {
  boardgames: Boardgame[];
  onClose: () => void;
  onCreated: () => void;
}

export function CreateActivityModal({ boardgames, onClose, onCreated }: CreateActivityModalProps) {
  const { currentPlayer, setCurrentPlayer } = useAppStore();
  const [title, setTitle] = useState('');
  const [boardgameId, setBoardgameId] = useState(boardgames[0]?.id || '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!title || !boardgameId || !date || !time || !location) {
      alert('请填写完整信息');
      return;
    }

    let player = currentPlayer;
    if (!player) {
      if (!playerName.trim()) {
        alert('请输入你的昵称');
        return;
      }
      player = await createPlayer(playerName.trim());
      setCurrentPlayer(player);
    }

    const dateTime = new Date(`${date}T${time}`).toISOString();

    setIsSubmitting(true);
    try {
      const activity = await createActivity({
        boardgameId,
        title,
        dateTime,
        location,
        notes,
        hostId: player.id,
        hostName: player.name,
      });

      if (activity) {
        await joinActivity(activity.id, player.id, player.name);
        onCreated();
      }
    } catch (error) {
      console.error('创建活动失败:', error);
      alert('创建活动失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>发起新活动</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.body}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>活动名称</label>
              <input
                type="text"
                className={styles.formInput}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：周末卡坦岛欢乐局"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>选择桌游</label>
              <select
                className={styles.formSelect}
                value={boardgameId}
                onChange={(e) => setBoardgameId(e.target.value)}
              >
                {boardgames.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.emoji} {game.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>日期</label>
                <input
                  type="date"
                  className={styles.formInput}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>时间</label>
                <input
                  type="time"
                  className={styles.formInput}
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>地点</label>
              <input
                type="text"
                className={styles.formInput}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="例如：XX桌游吧 / 某某小区"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>备注说明</label>
              <textarea
                className={styles.formTextarea}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="可以写一些活动说明，比如新手友好、有教学等"
              />
            </div>

            {!currentPlayer && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>你的昵称</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="请输入你的昵称"
                />
              </div>
            )}
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={onClose}
            >
              取消
            </button>
            <button
              type="submit"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? '创建中...' : '创建活动'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

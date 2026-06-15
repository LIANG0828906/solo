import { useState } from 'react';
import type { ActivityPlayer } from '@/types';
import modalStyles from './Modal.module.css';
import styles from './RecordResultModal.module.css';

interface RecordResultModalProps {
  players: ActivityPlayer[];
  onClose: () => void;
  onSubmit: (results: { playerId: string; rank?: number }[]) => void;
}

export function RecordResultModal({ players, onClose, onSubmit }: RecordResultModalProps) {
  const [ranks, setRanks] = useState<Record<string, number | ''>>(() => {
    const initial: Record<string, number | ''> = {};
    players.forEach((p) => {
      initial[p.playerId] = p.rank ?? '';
    });
    return initial;
  });

  const handleRankChange = (playerId: string, value: string) => {
    const num = value === '' ? '' : parseInt(value, 10);
    setRanks((prev) => ({
      ...prev,
      [playerId]: isNaN(num as number) ? '' : num,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const results = players.map((p) => ({
      playerId: p.playerId,
      rank: typeof ranks[p.playerId] === 'number' ? (ranks[p.playerId] as number) : undefined,
    }));

    const hasRanks = results.some((r) => r.rank !== undefined);
    if (!hasRanks) {
      alert('请至少为一名玩家设置名次');
      return;
    }

    onSubmit(results);
  };

  return (
    <div className={modalStyles.overlay} onClick={onClose}>
      <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={modalStyles.header}>
          <h2 className={modalStyles.title}>录入比赛结果</h2>
          <button className={modalStyles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={modalStyles.body}>
            <p style={{ marginBottom: '16px', color: 'var(--color-wood-medium)', fontSize: '14px' }}>
              为每位玩家设置名次（第1名为胜方）
            </p>

            <div className={styles.playerList}>
              {players.map((player) => (
                <div key={player.id} className={styles.playerRow}>
                  <div className={styles.playerInfo}>
                    <div className={styles.playerAvatar}>
                      {player.playerName.charAt(0).toUpperCase()}
                    </div>
                    <span className={styles.playerName}>{player.playerName}</span>
                  </div>
                  <div className={styles.rankInput}>
                    <input
                      type="number"
                      min="1"
                      value={ranks[player.playerId]}
                      onChange={(e) => handleRankChange(player.playerId, e.target.value)}
                      placeholder="名次"
                      className={styles.input}
                    />
                    <span className={styles.rankSuffix}>名</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={modalStyles.footer}>
            <button
              type="button"
              className={`${modalStyles.btn} ${modalStyles.btnSecondary}`}
              onClick={onClose}
            >
              取消
            </button>
            <button type="submit" className={`${modalStyles.btn} ${modalStyles.btnPrimary}`}>
              保存结果
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

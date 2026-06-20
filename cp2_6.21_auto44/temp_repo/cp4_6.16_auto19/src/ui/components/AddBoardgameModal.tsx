import { useState } from 'react';
import type { Boardgame } from '@/types';
import modalStyles from './Modal.module.css';

interface AddBoardgameModalProps {
  onClose: () => void;
  onAdd: (game: Omit<Boardgame, 'id' | 'isCustom'>) => void;
}

const EMOJI_OPTIONS = ['🎲', '🃏', '🎴', '♟️', '🧩', '🎯', '🏆', '💎', '🌴', '🏝️', '⚔️', '🎨'];

export function AddBoardgameModal({ onClose, onAdd }: AddBoardgameModalProps) {
  const [name, setName] = useState('');
  const [minPlayers, setMinPlayers] = useState(2);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [averageDuration, setAverageDuration] = useState(60);
  const [bggRating, setBggRating] = useState(7.0);
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('🎲');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('请输入桌游名称');
      return;
    }

    onAdd({
      name: name.trim(),
      minPlayers: parseInt(minPlayers as unknown as string, 10) || 2,
      maxPlayers: parseInt(maxPlayers as unknown as string, 10) || 4,
      averageDuration: parseInt(averageDuration as unknown as string, 10) || 60,
      bggRating: parseFloat(bggRating as unknown as string) || 7.0,
      description: description.trim(),
      emoji,
    });
  };

  return (
    <div className={modalStyles.overlay} onClick={onClose}>
      <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={modalStyles.header}>
          <h2 className={modalStyles.title}>添加自定义桌游</h2>
          <button className={modalStyles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={modalStyles.body}>
            <div className={modalStyles.formGroup}>
              <label className={modalStyles.formLabel}>选择图标</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    style={{
                      width: '44px',
                      height: '44px',
                      fontSize: '24px',
                      borderRadius: '8px',
                      background: emoji === e ? 'var(--color-gold)' : 'rgba(201, 168, 76, 0.1)',
                      border: emoji === e ? '2px solid var(--color-gold-dark)' : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className={modalStyles.formGroup}>
              <label className={modalStyles.formLabel}>桌游名称 *</label>
              <input
                type="text"
                className={modalStyles.formInput}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入桌游名称"
                autoFocus
              />
            </div>

            <div className={modalStyles.formRow}>
              <div className={modalStyles.formGroup}>
                <label className={modalStyles.formLabel}>最少人数</label>
                <input
                  type="number"
                  min="1"
                  className={modalStyles.formInput}
                  value={minPlayers}
                  onChange={(e) => setMinPlayers(parseInt(e.target.value, 10) || 1)}
                />
              </div>
              <div className={modalStyles.formGroup}>
                <label className={modalStyles.formLabel}>最多人数</label>
                <input
                  type="number"
                  min="1"
                  className={modalStyles.formInput}
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(parseInt(e.target.value, 10) || 1)}
                />
              </div>
            </div>

            <div className={modalStyles.formRow}>
              <div className={modalStyles.formGroup}>
                <label className={modalStyles.formLabel}>平均时长（分钟）</label>
                <input
                  type="number"
                  min="5"
                  className={modalStyles.formInput}
                  value={averageDuration}
                  onChange={(e) => setAverageDuration(parseInt(e.target.value, 10) || 30)}
                />
              </div>
              <div className={modalStyles.formGroup}>
                <label className={modalStyles.formLabel}>BGG 评分</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  className={modalStyles.formInput}
                  value={bggRating}
                  onChange={(e) => setBggRating(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className={modalStyles.formGroup}>
              <label className={modalStyles.formLabel}>简介</label>
              <textarea
                className={modalStyles.formTextarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简单介绍一下这款桌游"
              />
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
              添加桌游
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

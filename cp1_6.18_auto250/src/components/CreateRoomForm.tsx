import { useState } from 'react';
import type { CreateRoomRequest } from '../types';

interface Props {
  onSubmit: (data: CreateRoomRequest) => Promise<void>;
  loading: boolean;
}

const SONG_COLORS = [
  '#6C63FF',
  '#FF6B9D',
  '#00D4AA',
  '#FF9F43',
  '#00B894',
  '#E17055',
];

export default function CreateRoomForm({ onSubmit, loading }: Props) {
  const [name, setName] = useState('');
  const [songs, setSongs] = useState<string[]>(['', '']);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateSong = (idx: number, value: string) => {
    setSongs((prev) => prev.map((s, i) => (i === idx ? value : s)));
  };

  const addSong = () => {
    if (songs.length >= 6) return;
    setSongs((prev) => [...prev, '']);
  };

  const removeSong = (idx: number) => {
    if (songs.length <= 2) return;
    setSongs((prev) => prev.filter((_, i) => i !== idx));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = '请输入房间名称';
    if (name.trim().length > 40) errs.name = '房间名称最多40字';

    const validSongs = songs.map((s) => s.trim()).filter(Boolean);
    if (validSongs.length < 2) errs.songs = '至少需要2首候选曲目';
    if (validSongs.length > 6) errs.songs = '最多6首候选曲目';
    songs.forEach((s, i) => {
      if (!s.trim()) errs[`song_${i}`] = '曲目名称不能为空';
      if (s.trim().length > 60) errs[`song_${i}`] = '曲名最多60字';
    });

    if (durationMinutes < 5 || durationMinutes > 60)
      errs.duration = '投票时长需在5~60分钟之间';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      name: name.trim(),
      songs: songs.map((s) => s.trim()).filter(Boolean),
      durationMinutes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="create-form">
      <div className="form-group">
        <label className="form-label">
          房间名称 <span className="required">*</span>
        </label>
        <input
          type="text"
          className={`form-input ${errors.name ? 'has-error' : ''}`}
          placeholder="例如：本周翻唱曲目决选"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
        />
        <div className="form-hint">
          {name.length}/40
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          候选曲目 <span className="required">*</span>
          <span className="label-hint">（2~6首）</span>
        </label>
        <div className="song-list">
          {songs.map((song, idx) => (
            <div key={idx} className="song-row">
              <div
                className="song-index"
                style={{
                  background: SONG_COLORS[idx % SONG_COLORS.length],
                }}
              >
                {idx + 1}
              </div>
              <input
                type="text"
                className={`form-input song-input ${
                  errors[`song_${idx}`] ? 'has-error' : ''
                }`}
                placeholder={`曲目 ${idx + 1}：例如《晴天》`}
                value={song}
                onChange={(e) => updateSong(idx, e.target.value)}
                maxLength={60}
              />
              <button
                type="button"
                className="song-remove-btn"
                onClick={() => removeSong(idx)}
                disabled={songs.length <= 2}
                aria-label="删除曲目"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="add-song-btn"
          onClick={addSong}
          disabled={songs.length >= 6}
        >
          <span className="plus">+</span> 添加一首候选曲目
        </button>
        {errors.songs && (
          <div className="form-hint">
            <span className="form-error">{errors.songs}</span>
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">
          投票时长：<span className="duration-value">{durationMinutes} 分钟</span>
        </label>
        <div className="duration-wrapper">
          <input
            type="range"
            className="duration-slider"
            min={5}
            max={60}
            step={1}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
          />
          <div className="duration-marks">
            <span>5分</span>
            <span>30分</span>
            <span>60分</span>
          </div>
        </div>
        {errors.duration && (
          <div className="form-hint">
            <span className="form-error">{errors.duration}</span>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="submit-btn gradient-btn"
        disabled={loading}
      >
        {loading ? '创建中...' : '🚀 创建投票房间'}
      </button>

      <style>{`
        .create-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding: 8px 0;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .form-label {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .required {
          color: var(--time-red);
        }
        .label-hint {
          font-size: 0.8rem;
          color: var(--text-tertiary);
          font-weight: 400;
        }
        .form-input {
          padding: 12px 16px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: var(--text-primary);
          font-size: 0.95rem;
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        .form-input::placeholder {
          color: var(--text-tertiary);
        }
        .form-input:focus {
          border-color: var(--btn-gradient-start);
          background: rgba(108, 99, 255, 0.08);
        }
        .form-input.has-error {
          border-color: var(--time-red);
        }
        .form-hint {
          font-size: 0.78rem;
          color: var(--text-tertiary);
          display: flex;
          justify-content: space-between;
        }
        .form-error {
          color: var(--time-red);
        }
        .song-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .song-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .song-index {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.85rem;
          color: #fff;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
        }
        .song-input {
          flex: 1;
        }
        .song-remove-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(231, 76, 60, 0.12);
          color: var(--time-red);
          flex-shrink: 0;
          font-size: 0.9rem;
          font-weight: 700;
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .song-remove-btn:hover:not(:disabled) {
          background: rgba(231, 76, 60, 0.25);
          transform: scale(1.05);
        }
        .song-remove-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .add-song-btn {
          align-self: flex-start;
          padding: 10px 18px;
          border-radius: 10px;
          background: rgba(108, 99, 255, 0.12);
          border: 1px dashed rgba(108, 99, 255, 0.4);
          color: var(--btn-gradient-start);
          font-size: 0.88rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }
        .add-song-btn:hover:not(:disabled) {
          background: rgba(108, 99, 255, 0.2);
          transform: translateY(-2px);
        }
        .add-song-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .plus {
          font-size: 1.1rem;
          font-weight: 700;
          line-height: 1;
        }
        .duration-value {
          background: rgba(108, 99, 255, 0.18);
          padding: 2px 10px;
          border-radius: 6px;
          color: var(--btn-gradient-start);
          font-weight: 700;
        }
        .duration-wrapper {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .duration-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 8px;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            var(--btn-gradient-start) 0%,
            var(--btn-gradient-end)
              ${((durationMinutes - 5) / 55) * 100}%,
            var(--bar-bg) ${((durationMinutes - 5) / 55) * 100}%,
            var(--bar-bg) 100%
          );
          outline: none;
        }
        .duration-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #fff;
          border: 3px solid var(--btn-gradient-start);
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(108, 99, 255, 0.4);
          transition: transform 0.15s ease;
        }
        .duration-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        .duration-slider::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #fff;
          border: 3px solid var(--btn-gradient-start);
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(108, 99, 255, 0.4);
        }
        .duration-marks {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--text-tertiary);
          padding: 0 4px;
        }
        .submit-btn {
          margin-top: 8px;
          padding: 14px 28px;
          font-size: 1rem;
          align-self: stretch;
        }
      `}</style>
    </form>
  );
}

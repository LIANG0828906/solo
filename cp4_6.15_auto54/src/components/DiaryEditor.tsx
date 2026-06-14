import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Mood, MoodEntry, MOOD_CONFIG } from '../types';
import { format } from 'date-fns';

interface DiaryEditorProps {
  moodEntry: MoodEntry | undefined;
  onSave: (date: string, mood: Mood, diary: string) => void;
  onToast: (message: string) => void;
}

const MAX_LENGTH = 200;

const playCongratsSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.1);
      gainNode.gain.setValueAtTime(0.0001, audioCtx.currentTime + i * 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.18, audioCtx.currentTime + i * 0.1 + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.1 + 0.4);
      oscillator.start(audioCtx.currentTime + i * 0.1);
      oscillator.stop(audioCtx.currentTime + i * 0.1 + 0.45);
    });
    setTimeout(() => {
      audioCtx.close().catch(() => {});
    }, 800);
  } catch {
    // 浏览器可能限制音频播放，静默失败
  }
};

const DiaryEditor: React.FC<DiaryEditorProps> = ({ moodEntry, onSave, onToast }) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayLabel = format(new Date(), 'yyyy年M月d日 EEEE', { locale: undefined });

  const [diary, setDiary] = useState(moodEntry?.diary || '');
  const [selectedMood, setSelectedMood] = useState<Mood | undefined>(moodEntry?.mood);
  const [bouncingMood, setBouncingMood] = useState<Mood | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    setDiary(moodEntry?.diary || '');
    setSelectedMood(moodEntry?.mood);
  }, [moodEntry]);

  const handleMoodSelect = useCallback((mood: Mood) => {
    setSelectedMood(mood);
    setBouncingMood(mood);
    setTimeout(() => setBouncingMood(null), 550);
  }, []);

  const handleDiaryChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_LENGTH) {
      setDiary(value);
    } else {
      setDiary(value.slice(0, MAX_LENGTH));
    }
  }, []);

  const handleDiaryInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const value = target.value;
    if (value.length > MAX_LENGTH) {
      target.value = value.slice(0, MAX_LENGTH);
      setDiary(target.value);
    }
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData('text');
    const current = diary.length;
    const remaining = MAX_LENGTH - current;
    if (pasted.length > remaining) {
      e.preventDefault();
      const sliced = pasted.slice(0, remaining);
      setDiary(diary + sliced);
    }
  }, [diary]);

  const handleSave = useCallback(() => {
    if (!selectedMood) {
      onToast('请先选择今天的心情 😊');
      return;
    }
    const trimmedDiary = diary.trim();
    onSave(today, selectedMood, trimmedDiary);
    playCongratsSound();
    if (trimmedDiary.length > 0) {
      onToast('日记保存成功，今天也要开心哦 🎉');
    } else {
      onToast('心情已记录，好的心情从今天开始 ✨');
    }
  }, [today, selectedMood, diary, onSave, onToast]);

  const moods: Mood[] = ['happy', 'calm', 'sad', 'angry', 'surprised'];
  const charCount = diary.length;
  const isWarning = charCount >= MAX_LENGTH * 0.9;
  const isMax = charCount >= MAX_LENGTH;

  return (
    <div className="diary-card">
      <div className="diary-date">📝 {todayLabel}</div>
      <div className="mood-selector">
        {moods.map((mood) => {
          const config = MOOD_CONFIG[mood];
          const isSelected = selectedMood === mood;
          const isBouncing = bouncingMood === mood;
          return (
            <button
              key={mood}
              type="button"
              className={`mood-btn ${isSelected ? 'selected' : ''}`}
              onClick={() => handleMoodSelect(mood)}
              title={config.label}
            >
              <span
                className="mood-emoji"
                style={
                  isBouncing
                    ? { animation: 'emoji-bounce 0.55s cubic-bezier(0.68, -0.55, 0.27, 1.55)' }
                    : undefined
                }
              >
                {config.emoji}
              </span>
              <span className="mood-label">{config.label}</span>
            </button>
          );
        })}
      </div>
      <textarea
        className="diary-textarea"
        placeholder="写下今天的心情吧，记录生活中的小美好~（最多200字）"
        value={diary}
        onChange={handleDiaryChange}
        onInput={handleDiaryInput}
        onPaste={handlePaste}
        maxLength={MAX_LENGTH}
        rows={5}
      />
      <div className="diary-footer">
        <span
          className={`char-counter ${isWarning ? 'warning' : ''}`}
          style={isMax ? { color: '#E06060', fontWeight: 600 } : undefined}
        >
          已输入 <strong>{charCount}</strong>/{MAX_LENGTH} 字
          {isMax && <span> （已到达上限）</span>}
        </span>
        <button className="save-diary-btn" type="button" onClick={handleSave}>
          💾 保存日记
        </button>
      </div>
    </div>
  );
};

export default DiaryEditor;

import React, { useState, useCallback, useRef } from 'react';
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
    const audioCtx = new AudioContext();
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.12);
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime + i * 0.12);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.12 + 0.4);
      oscillator.start(audioCtx.currentTime + i * 0.12);
      oscillator.stop(audioCtx.currentTime + i * 0.12 + 0.4);
    });
  } catch {}
};

const DiaryEditor: React.FC<DiaryEditorProps> = ({ moodEntry, onSave, onToast }) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const entry = moodEntry;
  const [diary, setDiary] = useState(entry?.diary || '');
  const [selectedMood, setSelectedMood] = useState<Mood | undefined>(entry?.mood);
  const [bouncingMood, setBouncingMood] = useState<Mood | null>(null);
  const prevEntryRef = useRef(entry);
  const todayLabel = format(new Date(), 'yyyy年M月d日');

  if (entry !== prevEntryRef.current) {
    prevEntryRef.current = entry;
    setDiary(entry?.diary || '');
    setSelectedMood(entry?.mood);
  }

  const handleMoodSelect = useCallback((mood: Mood) => {
    setSelectedMood(mood);
    setBouncingMood(mood);
    setTimeout(() => setBouncingMood(null), 500);
  }, []);

  const handleDiaryChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_LENGTH) {
      setDiary(value);
    }
  }, []);

  const handleSave = useCallback(() => {
    if (!selectedMood) {
      onToast('请先选择今天的心情 😊');
      return;
    }
    onSave(today, selectedMood, diary);
    playCongratsSound();
    onToast('日记保存成功 🎉');
  }, [today, selectedMood, diary, onSave, onToast]);

  const moods: Mood[] = ['happy', 'calm', 'sad', 'angry', 'surprised'];
  const charCount = diary.length;
  const isWarning = charCount > MAX_LENGTH * 0.9;

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
              className={`mood-btn ${isSelected ? 'selected' : ''}`}
              onClick={() => handleMoodSelect(mood)}
            >
              <span
                className="mood-emoji"
                style={isBouncing ? { animation: 'emoji-bounce 0.5s ease' } : undefined}
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
        placeholder="今天有什么想记录的吗？"
        value={diary}
        onChange={handleDiaryChange}
        maxLength={MAX_LENGTH}
      />
      <div className="diary-footer">
        <span className={`char-counter ${isWarning ? 'warning' : ''}`}>
          {charCount}/{MAX_LENGTH}
        </span>
        <button className="save-diary-btn" onClick={handleSave}>
          保存日记
        </button>
      </div>
    </div>
  );
};

export default DiaryEditor;

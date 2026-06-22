import { useState, useMemo, useCallback } from 'react';
import { Diary, getWeekStart, getWeekDates, getWeekLabel } from './utils';
import { mockDiaries } from './data';
import EmotionSpectrum from './EmotionSpectrum';
import DiaryList from './DiaryList';
import DiaryDetail from './DiaryDetail';
import DiaryEditor from './DiaryEditor';
import './styles.css';

export default function App() {
  const [diaries, setDiaries] = useState<Diary[]>(mockDiaries);
  const [selectedDate, setSelectedDate] = useState<string | null>(
    mockDiaries.length > 0 ? mockDiaries[mockDiaries.length - 1].date : null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [newDiaryId, setNewDiaryId] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<string>(() => {
    const latestDate = mockDiaries.length > 0
      ? mockDiaries[mockDiaries.length - 1].date
      : new Date().toISOString().split('T')[0];
    return getWeekStart(latestDate);
  });
  const [weekDirection, setWeekDirection] = useState<'left' | 'right' | null>(null);

  const weekDates = useMemo(() => getWeekDates(currentWeekStart), [currentWeekStart]);

  const weekColors = useMemo(() => {
    return weekDates.map(date => {
      const diary = diaries.find(d => d.date === date);
      return diary ? diary.emotionColor : null;
    });
  }, [weekDates, diaries]);

  const selectedDiary = useMemo(() => {
    return diaries.find(d => d.date === selectedDate) || null;
  }, [diaries, selectedDate]);

  const weekDiaries = useMemo(() => {
    return diaries.filter(d => weekDates.includes(d.date));
  }, [diaries, weekDates]);

  const earliestWeek = useMemo(() => {
    if (diaries.length === 0) return getWeekStart(new Date().toISOString().split('T')[0]);
    const earliest = diaries.reduce((min, d) =>
      new Date(d.date) < new Date(min) ? d.date : min, diaries[0].date);
    return getWeekStart(earliest);
  }, [diaries]);

  const latestWeek = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    if (diaries.length === 0) return getWeekStart(today);
    const latest = diaries.reduce((max, d) =>
      new Date(d.date) > new Date(max) ? d.date : max, diaries[0].date);
    const todayWeek = getWeekStart(today);
    return new Date(latest) > new Date(today) ? getWeekStart(latest) : todayWeek;
  }, [diaries]);

  const canGoPrev = new Date(currentWeekStart) > new Date(earliestWeek);
  const canGoNext = new Date(currentWeekStart) < new Date(latestWeek);

  const handlePrevWeek = useCallback(() => {
    if (!canGoPrev) return;
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setWeekDirection('left');
    setCurrentWeekStart(prev.toISOString().split('T')[0]);
    setTimeout(() => setWeekDirection(null), 500);
  }, [currentWeekStart, canGoPrev]);

  const handleNextWeek = useCallback(() => {
    if (!canGoNext) return;
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setWeekDirection('right');
    setCurrentWeekStart(next.toISOString().split('T')[0]);
    setTimeout(() => setWeekDirection(null), 500);
  }, [currentWeekStart, canGoNext]);

  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date);
    setIsEditing(false);
    setEditingDate(null);
  }, []);

  const handleAddClick = useCallback(() => {
    setIsEditing(true);
    setEditingDate(null);
    setSelectedDate(null);
  }, []);

  const handleSave = useCallback((diary: Diary) => {
    setDiaries(prev => {
      const existingIndex = prev.findIndex(d => d.id === diary.id || d.date === diary.date);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = diary;
        return updated;
      }
      return [...prev, diary];
    });
    setNewDiaryId(diary.id);
    setIsEditing(false);
    setSelectedDate(diary.date);
    setEditingDate(null);
    
    const diaryWeek = getWeekStart(diary.date);
    if (diaryWeek !== currentWeekStart) {
      const dir = new Date(diaryWeek) < new Date(currentWeekStart) ? 'left' : 'right';
      setWeekDirection(dir);
      setCurrentWeekStart(diaryWeek);
      setTimeout(() => setWeekDirection(null), 500);
    }

    setTimeout(() => setNewDiaryId(null), 500);
  }, [currentWeekStart]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditingDate(null);
    if (!selectedDate && diaries.length > 0) {
      setSelectedDate(diaries[diaries.length - 1].date);
    }
  }, [selectedDate, diaries]);

  return (
    <div className="app">
      <div className="app-header">
        <h1 className="app-title">情绪调色板</h1>
        <EmotionSpectrum
          colors={weekColors}
          weekLabel={getWeekLabel(currentWeekStart)}
          weekDirection={weekDirection}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
        />
      </div>

      <div className="app-body">
        <DiaryList
          diaries={diaries}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onAddClick={handleAddClick}
          newDiaryId={newDiaryId}
        />

        <div className="main-content">
          {isEditing ? (
            <DiaryEditor
              initialDate={editingDate || undefined}
              initialDiary={selectedDiary || undefined}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          ) : selectedDiary ? (
            <DiaryDetail diary={selectedDiary} />
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">✨</div>
              <div className="empty-state-text">
                选择一篇日记查看，或点击左上角 + 开始记录今天的心情
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

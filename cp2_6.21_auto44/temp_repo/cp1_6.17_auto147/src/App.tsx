import { useState } from 'react';
import { useDiaryStore } from './store/useDiaryStore';
import type { DiaryEntry } from './types';
import CalendarView from './modules/calendar/CalendarView';
import AnalyticsPanel from './modules/analytics/AnalyticsPanel';
import DiaryEditor from './modules/diary/DiaryEditor';

function App() {
  const { view, setView, isLoading } = useDiaryStore();
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const handleEditEntry = (entry: DiaryEntry) => {
    setEditingEntry(entry);
    setShowEditor(true);
    setView('editor');
  };

  const handleNewEntry = () => {
    setEditingEntry(null);
    setShowEditor(true);
    setView('editor');
  };

  const handleCloseEditor = ()
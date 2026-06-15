import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { MapView } from '@/components/MapView';
import { SearchSidebar } from '@/components/SearchSidebar';
import { Toast } from '@/components/Toast';
import { useDiaryStore } from '@/data/DiaryStore';
import type { Diary } from '@/types';

export const MapPage: React.FC = () => {
  const navigate = useNavigate();
  const initializeData = useDiaryStore((s) => s.initializeData);
  const locations = useDiaryStore((s) => s.locations);
  const isInitialized = useDiaryStore((s) => s.isInitialized);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  const handleLocationClick = (locationId: string) => {
    navigate(`/location/${locationId}`);
  };

  const handleDiaryClick = (diary: Diary) => {
    setIsSidebarOpen(false);
    navigate(`/diary/${diary.id}`);
  };

  const handleNewDiary = () => {
    navigate('/diary/new');
  };

  if (!isInitialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-sand-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sand-300 border-t-sand-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sand-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen relative overflow-hidden">
      <header className="absolute top-0 left-0 right-0 z-30 p-4 flex items-center justify-between">
        <div className="glass-card rounded-2xl px-5 py-3 shadow-lg">
          <h1 className="font-display text-2xl font-bold text-sand-800">
            🌍 旅行日记
          </h1>
          <p className="text-xs text-sand-500 mt-1">
            足迹遍布 {locations.length} 个地点
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="glass-card rounded-xl px-4 py-3 shadow-lg flex items-center gap-2 text-sand-700 hover-lift"
          >
            <Search className="w-5 h-5" />
            <span className="hidden sm:inline text-sm font-medium">搜索日记</span>
          </button>
          
          <button
            onClick={handleNewDiary}
            className="bg-sand-600 hover:bg-sand-700 text-white rounded-xl px-5 py-3 shadow-lg flex items-center gap-2 hover-lift transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline text-sm font-medium">写日记</span>
          </button>
        </div>
      </header>

      <main className="h-full">
        <MapView
          onLocationClick={handleLocationClick}
          onDiaryClick={handleDiaryClick}
        />
      </main>

      <SearchSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onDiaryClick={handleDiaryClick}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

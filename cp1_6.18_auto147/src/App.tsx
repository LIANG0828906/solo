import { useState, useEffect, useCallback } from 'react';
import { NotebookPen, Sparkles, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import audioEngine from '@/engine/audioEngine';
import { mockRecords } from '@/data/mockRecords';
import { useUserStore } from '@/stores/userStore';
import type { VinylRecord, AudioState } from '@/types';
import VinylDisc from '@/components/VinylDisc';
import PlayerPanel from '@/components/PlayerPanel';
import NoteModal from '@/components/NoteModal';
import CoverModal from '@/components/CoverModal';
import NotesList from '@/components/NotesList';
import Sidebar from '@/components/Sidebar';

export default function App() {
  const [currentRecord, setCurrentRecord] = useState<VinylRecord | null>(null);
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    progress: 0,
    currentRecord: null,
    frequencyData: new Array(64).fill(0),
  });
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);

  const { notes, favorites, playHistory, addNote, toggleFavorite, isFavorite, saveCover, addToHistory } = useUserStore();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const unsubscribe = audioEngine.subscribe((state) => {
      setAudioState(state);
      if (state.currentRecord) {
        setCurrentRecord(state.currentRecord);
      }
    });
    return unsubscribe;
  }, []);

  const playRandomRecord = useCallback(() => {
    const availableRecords = mockRecords.filter(
      (r) => r.id !== currentRecord?.id
    );
    const randomRecord = availableRecords[Math.floor(Math.random() * availableRecords.length)] || mockRecords[0];
    setCurrentRecord(randomRecord);
    addToHistory(randomRecord.id);
    audioEngine.play(randomRecord);
  }, [currentRecord, addToHistory]);

  const handlePlayPause = useCallback(() => {
    if (!currentRecord) {
      playRandomRecord();
      return;
    }
    if (audioState.isPlaying) {
      audioEngine.pause();
    } else {
      audioEngine.resume();
    }
  }, [currentRecord, audioState.isPlaying, playRandomRecord]);

  const handleNext = useCallback(() => {
    playRandomRecord();
  }, [playRandomRecord]);

  const handleSeek = useCallback((progress: number) => {
    audioEngine.seek(progress);
  }, []);

  const handleFavorite = useCallback(() => {
    if (currentRecord) {
      toggleFavorite(currentRecord.id);
    }
  }, [currentRecord, toggleFavorite]);

  const handleAddNote = useCallback((content: string) => {
    if (currentRecord) {
      addNote(currentRecord.id, currentRecord.title, content);
    }
  }, [currentRecord, addNote]);

  const handleSaveCover = useCallback((svg: string, style: string, keyword: string) => {
    saveCover(svg, style, keyword);
  }, [saveCover]);

  const handleRecordClick = useCallback((record: VinylRecord) => {
    setCurrentRecord(record);
    addToHistory(record.id);
    audioEngine.play(record);
    if (isMobile) {
      setLeftDrawerOpen(false);
      setRightDrawerOpen(false);
    }
  }, [addToHistory, isMobile]);

  const favoriteRecords = mockRecords.filter((r) => favorites.includes(r.id));
  const historyWithRecords = playHistory
    .map((h) => {
      const record = mockRecords.find((r) => r.id === h.recordId);
      return record ? { record, timestamp: h.timestamp } : null;
    })
    .filter(Boolean) as { record: VinylRecord; timestamp: number }[];

  const currentIsFavorite = currentRecord ? isFavorite(currentRecord.id) : false;

  const LeftPanel = () => (
    <div
      className="h-full overflow-y-auto scrollbar-thin flex flex-col"
      style={{
        width: '220px',
        backgroundColor: '#0F3460',
        borderRadius: '8px',
        padding: '12px',
      }}
    >
      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
        <NotebookPen size={16} style={{ color: '#E94560' }} />
        听感笔记
      </h3>
      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <p className="text-gray-500 text-xs text-center py-8">
            暂无笔记
            <br />
            点击右下角按钮记录心情
          </p>
        ) : (
          <NotesList notes={notes} />
        )}
      </div>
    </div>
  );

  const RightPanel = () => (
    <Sidebar
      favorites={favoriteRecords}
      history={historyWithRecords}
      onRecordClick={handleRecordClick}
    />
  );

  return (
    <div className="w-full h-full flex flex-col" style={{ backgroundColor: '#1A1A2E' }}>
      {isMobile && (
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <button
            onClick={() => setLeftDrawerOpen(true)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Menu size={24} className="text-white" />
          </button>
          <h1 className="text-xl font-bold text-white font-display">唱片时光机</h1>
          <button
            onClick={() => setRightDrawerOpen(true)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Menu size={24} className="text-white" />
          </button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {!isMobile && <LeftPanel />}

        <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-y-auto">
          {!isMobile && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2">
              <h1 className="text-3xl font-bold text-white font-display tracking-wider">
                唱片时光机
              </h1>
            </div>
          )}

          {!isMobile && (
            <button
              onClick={() => setIsCoverModalOpen(true)}
              className="absolute top-6 right-6 px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 transition-all hover:scale-105"
              style={{ backgroundColor: '#533483' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#6A4C93';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#533483';
              }}
            >
              <Sparkles size={18} />
              生成封面
            </button>
          )}

          <div className="flex flex-col items-center gap-8 mt-12">
            <VinylDisc
              color={currentRecord?.coverColor || '#533483'}
              isPlaying={audioState.isPlaying}
              onClick={playRandomRecord}
              title={currentRecord?.title || '点击随机播放'}
              artist={currentRecord?.artist || '唱片时光机'}
              year={currentRecord?.year || new Date().getFullYear()}
            />

            <PlayerPanel
              record={currentRecord}
              audioState={audioState}
              onPlayPause={handlePlayPause}
              onNext={handleNext}
              onSeek={handleSeek}
              onFavorite={handleFavorite}
              isFavorite={currentIsFavorite}
            />
          </div>

          <button
            onClick={() => setIsNoteModalOpen(true)}
            className="absolute bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105"
            style={{ backgroundColor: '#E94560' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FF6B6B';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#E94560';
            }}
          >
            <NotebookPen size={24} className="text-white" />
          </button>

          {isMobile && (
            <button
              onClick={() => setIsCoverModalOpen(true)}
              className="absolute bottom-6 left-6 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105"
              style={{ backgroundColor: '#533483' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#6A4C93';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#533483';
              }}
            >
              <Sparkles size={20} className="text-white" />
            </button>
          )}
        </div>

        {!isMobile && <RightPanel />}
      </div>

      {isMobile && leftDrawerOpen && (
        <div
          className="fixed inset-0 z-50"
          style={{ backgroundColor: '#00000080' }}
          onClick={() => setLeftDrawerOpen(false)}
        >
          <div
            className="absolute top-0 left-0 w-full animate-slide-up"
            style={{
              height: '60vh',
              backgroundColor: '#16213E',
              borderBottomLeftRadius: '16px',
              borderBottomRightRadius: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-white font-semibold">听感笔记</h3>
              <button
                onClick={() => setLeftDrawerOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
            <div className="h-[calc(60vh-60px)] overflow-y-auto p-4">
              <NotesList notes={notes} />
            </div>
          </div>
        </div>
      )}

      {isMobile && rightDrawerOpen && (
        <div
          className="fixed inset-0 z-50"
          style={{ backgroundColor: '#00000080' }}
          onClick={() => setRightDrawerOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 w-full"
            style={{
              height: '60vh',
              backgroundColor: '#16213E',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-white font-semibold">收藏与历史</h3>
              <button
                onClick={() => setRightDrawerOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
            <div className="h-[calc(60vh-60px)] overflow-y-auto p-4">
              <div className="w-full">
                <Sidebar
                  favorites={favoriteRecords}
                  history={historyWithRecords}
                  onRecordClick={handleRecordClick}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSubmit={handleAddNote}
        recordTitle={currentRecord?.title || '未选择唱片'}
      />

      <CoverModal
        isOpen={isCoverModalOpen}
        onClose={() => setIsCoverModalOpen(false)}
        onSave={handleSaveCover}
      />
    </div>
  );
}

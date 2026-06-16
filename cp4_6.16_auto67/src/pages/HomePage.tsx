import { useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import { WorksTimeline } from '../modules/works/WorksTimeline';
import { useAppStore } from '../store/useAppStore';
import { audioPlayer } from '../modules/audio/AudioPlayer';
import { worksManager } from '../modules/works/WorksManager';
import { Music } from 'lucide-react';

export function HomePage() {
  const {
    works,
    selectedWorkId,
    filterStatus,
    dateRange,
    audioState,
    selectWork,
    setFilterStatus,
    setDateRange,
  } = useAppStore();

  const selectedWork = works.find((w) => w.id === selectedWorkId);

  const handlePlayToggle = useCallback(
    async (workId: string) => {
      const notes = worksManager.getAudioNotesForWork(workId);
      if (audioState.currentWorkId === workId && audioState.isPlaying) {
        audioPlayer.pause();
      } else if (audioState.currentWorkId === workId && !audioState.isPlaying) {
        await audioPlayer.play();
      } else {
        await audioPlayer.switchTrack(workId, notes);
      }
    },
    [audioState.currentWorkId, audioState.isPlaying],
  );

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-bg-primary overflow-hidden">
      <div className="w-full md:w-[260px] flex-shrink-0 md:h-full md:overflow-hidden md:block">
        <Sidebar
          works={works}
          selectedWorkId={selectedWorkId}
          filterStatus={filterStatus}
          dateRange={dateRange}
          currentWorkId={audioState.currentWorkId}
          isPlaying={audioState.isPlaying}
          onSelectWork={selectWork}
          onFilterStatusChange={setFilterStatus}
          onDateRangeChange={setDateRange}
          onPlayToggle={handlePlayToggle}
        />
      </div>

      <main className="flex-1 h-full overflow-hidden">
        {selectedWork ? (
          <WorksTimeline work={selectedWork} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-accent/10 blur-3xl" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-accent/20 to-accent-dark/20 flex items-center justify-center border border-accent/20">
                <Music className="w-12 h-12 text-accent" />
              </div>
            </div>
            <h2 className="text-2xl font-bold gradient-text mb-2">TrackTales</h2>
            <p className="text-text-secondary max-w-md">
              选择左侧的歌曲，探索每首作品背后的创作故事
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

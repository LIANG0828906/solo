import { useEffect } from 'react';
import { Type, PenLine, Mic, Shuffle } from 'lucide-react';
import { useInspirationStore } from '@/store';
import Sidebar from '@/components/Sidebar';
import TimelineGrid from '@/components/TimelineGrid';
import RecordModal from '@/components/RecordModal';
import RandomInspiration from '@/components/RandomInspiration';

function App() {
  const { fetchInspirations, fetchTags, initSocket, recordMode, setRecordMode, showRandom, openRandom } = useInspirationStore();

  useEffect(() => {
    initSocket();
    fetchInspirations();
    fetchTags();
  }, [fetchInspirations, fetchTags, initSocket]);

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 ml-60 p-8 pt-24">
        <TimelineGrid />
      </main>

      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#1E293B] rounded-[24px] shadow-toolbar px-2 py-2 flex items-center gap-1">
        <ToolbarButton
          active={recordMode === 'text'}
          onClick={() => setRecordMode('text')}
          icon={<Type size={20} />}
          label="文字"
        />
        <ToolbarButton
          active={recordMode === 'drawing'}
          onClick={() => setRecordMode('drawing')}
          icon={<PenLine size={20} />}
          label="手绘"
        />
        <ToolbarButton
          active={recordMode === 'voice'}
          onClick={() => setRecordMode('voice')}
          icon={<Mic size={20} />}
          label="语音"
        />
        <div className="w-px h-6 bg-white/10 mx-2" />
        <button
          onClick={openRandom}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Shuffle size={18} />
          <span className="text-sm font-medium">随机回忆</span>
        </button>
      </div>

      {recordMode && <RecordModal mode={recordMode} onClose={() => setRecordMode(null)} />}
      {showRandom && <RandomInspiration />}
    </div>
  );
}

interface ToolbarButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function ToolbarButton({ active, onClick, icon, label }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
        active
          ? 'bg-accent-blue text-white shadow-lg'
          : 'text-white/80 hover:text-white hover:bg-white/10'
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

export default App;

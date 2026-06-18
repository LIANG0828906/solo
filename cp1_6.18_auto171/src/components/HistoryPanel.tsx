import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { useBoardStore } from '@/stores/boardStore';

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('zh-CN', { hour12: false });
}

export default function HistoryPanel() {
  const snapshots = useBoardStore((s) => s.snapshots);
  const setShowRollbackConfirm = useBoardStore((s) => s.setShowRollbackConfirm);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed bottom-4 right-4 w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center z-40 hover:shadow-xl transition-shadow duration-200"
        >
          <Clock size={22} className="text-[#1976D2]" />
        </button>
        <div
          className={`fixed top-0 right-0 h-full w-[220px] bg-[#FAFAFA] border-l border-[#E0E0E0] z-30 transition-transform duration-300 ease-out ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-3">
            <h3 className="text-sm font-bold text-[#333333] mb-2">版本历史</h3>
            <div className="flex flex-col">
              {snapshots.map((snap) => (
                <button
                  key={snap.id}
                  onClick={() => setShowRollbackConfirm(snap.id)}
                  onMouseEnter={() => setHoveredId(snap.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`h-11 flex items-center px-2 rounded transition-colors duration-150 text-left ${
                    hoveredId === snap.id ? 'bg-[#E3F2FD]' : ''
                  } ${snap.expired ? 'text-gray-400 italic' : 'text-[#333333]'}`}
                >
                  {formatTime(snap.timestamp)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="w-[220px] bg-[#FAFAFA] border-l border-[#E0E0E0] flex flex-col">
      <div className="p-3">
        <h3 className="text-sm font-bold text-[#333333] mb-2">版本历史</h3>
        <div className="flex flex-col">
          {snapshots.map((snap) => (
            <button
              key={snap.id}
              onClick={() => setShowRollbackConfirm(snap.id)}
              onMouseEnter={() => setHoveredId(snap.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`h-11 flex items-center px-2 rounded transition-colors duration-150 text-left ${
                hoveredId === snap.id ? 'bg-[#E3F2FD]' : ''
              } ${snap.expired ? 'text-gray-400 italic' : 'text-[#333333]'}`}
            >
              {formatTime(snap.timestamp)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

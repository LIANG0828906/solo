import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { useCanvas } from '@/hooks/useCanvas';
import CardList from '@/card/CardList';
import CardEditor from '@/card/CardEditor';
import SearchBar from '@/components/SearchBar';
import TagFilter from '@/components/TagFilter';
import StatsPanel from '@/components/StatsPanel';
import { Menu, X } from 'lucide-react';

export default function Home() {
  const loadData = useAppStore(s => s.loadData);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useCanvas(canvasRef);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return (
      <div className="h-full flex flex-col relative">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2A2A44]">
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="p-2 rounded-lg hover:bg-[#2D2D44] transition-colors"
          >
            {drawerOpen ? <X size={18} className="text-[#E0E0E0]" /> : <Menu size={18} className="text-[#E0E0E0]" />}
          </button>
          <h1 className="font-display font-bold text-base text-[#FFD93D]">InspireFlow</h1>
          <div className="ml-auto">
            <SearchBar />
          </div>
        </div>

        <div className="px-4 py-2 border-b border-[#2A2A44]">
          <TagFilter />
        </div>

        <div className="flex-1 relative">
          <canvas ref={canvasRef} className="w-full h-full" />

          <div
            className={`absolute bottom-0 left-0 right-0 max-h-[60vh] bg-[#1A1A2E] border-t border-[#2A2A44] rounded-t-2xl transition-transform duration-300 ${
              drawerOpen ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            <div className="overflow-y-auto max-h-[60vh] custom-scrollbar">
              <CardList />
            </div>
          </div>
        </div>

        <StatsPanel />
        <CardEditor />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 px-4 py-3 border-b border-[#2A2A44]">
        <h1 className="font-display font-bold text-lg text-[#FFD93D]">InspireFlow</h1>
        <div className="flex-1">
          <TagFilter />
        </div>
        <SearchBar />
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[280px] shrink-0 border-r border-[#2A2A44] flex flex-col">
          <CardList />
        </div>

        <div className="flex-1 relative">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
      </div>

      <StatsPanel />
      <CardEditor />
    </div>
  );
}

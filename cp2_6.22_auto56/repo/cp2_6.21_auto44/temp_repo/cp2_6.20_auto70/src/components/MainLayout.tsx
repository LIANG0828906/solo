import { useState } from 'react';
import { LeatherScene } from '@/components/LeatherScene';
import { ControlPanel } from '@/components/ControlPanel';
import { StatsDisplay } from '@/components/StatsDisplay';
import { SchemeBar } from '@/components/SchemeBar';
import { Viewport2D } from '@/components/Viewport2D';
import { InteractionHint } from '@/components/InteractionHint';
import { Menu, X } from 'lucide-react';

export function MainLayout() {
  const [panelOpen, setPanelOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useState(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  return (
    <div className="w-full h-full flex relative overflow-hidden">
      <div className="flex-1 relative min-w-0">
        <LeatherScene />

        <InteractionHint />

        <StatsDisplay />

        <Viewport2D />

        <SchemeBar />

        {isMobile && (
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className="absolute top-4 right-4 z-30 p-2 glass-panel rounded-lg text-white/70 hover:text-white transition-colors"
          >
            {panelOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        )}
      </div>

      <div
        className={`transition-all duration-300 flex-shrink-0 ${
          isMobile
            ? panelOpen
              ? 'absolute right-0 top-0 h-full z-20'
              : 'absolute right-0 top-0 h-full z-20 translate-x-full'
            : ''
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
      >
        <ControlPanel />
      </div>
    </div>
  );
}

import DreamLog from '@/dream/DreamLog';
import SymbolDecoder from '@/decode/SymbolDecoder';
import Visualizer from '@/decode/Visualizer';

export default function App() {
  return (
    <div className="w-full h-screen bg-dream-bg flex flex-col md:flex-row overflow-hidden">
      <div className="w-full md:w-[40%] h-[45vh] md:h-full flex flex-col bg-dream-panel border-r-0 md:border-r-[2px] border-dream-border overflow-hidden"
        style={{
          borderImage: 'linear-gradient(to bottom, #BB86FC, transparent) 1',
        }}
      >
        <div className="flex-1 overflow-y-auto min-h-0">
          <DreamLog />
        </div>
        <div className="border-t border-dream-border/30 max-h-[40vh] overflow-y-auto">
          <SymbolDecoder />
        </div>
      </div>

      <div className="w-full md:w-[60%] flex-1 md:flex-none md:h-full p-3 md:p-4 overflow-hidden">
        <div className="h-full bg-dream-panel rounded-xl border border-dream-border p-3 overflow-hidden"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
        >
          <h2 className="text-sm font-bold text-dream-purple mb-2 flex items-center gap-2">
            <span>🌌</span> Dreamscape Map
          </h2>
          <div className="h-[calc(100%-32px)] overflow-hidden">
            <Visualizer />
          </div>
        </div>
      </div>
    </div>
  );
}

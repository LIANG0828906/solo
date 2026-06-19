import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronUp, List, RotateCcw } from 'lucide-react';
import { useNoteStore } from '@/store/noteStore';
import GraphCanvas from '@/components/GraphCanvas';
import NoteCard from '@/components/NoteCard';

export default function GraphPage() {
  const navigate = useNavigate();
  const { notes, graphData, fetchNotes, fetchGraphData, clearNodePositions, loading } = useNoteStore();
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelHeight, setPanelHeight] = useState(50);
  const panelRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  useEffect(() => {
    fetchNotes();
    fetchGraphData();
  }, [fetchNotes, fetchGraphData]);

  const handleNodeDoubleClick = (id: string) => {
    navigate(`/editor/${id}`);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    startHeightRef.current = panelHeight;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaY = startYRef.current - e.touches[0].clientY;
    const newHeight = Math.min(Math.max(startHeightRef.current + (deltaY / window.innerHeight) * 100, 10), 90);
    setPanelHeight(newHeight);
    if (newHeight > 20) {
      setPanelOpen(true);
    }
  };

  const handleTouchEnd = () => {
    if (panelHeight < 20) {
      setPanelOpen(false);
      setPanelHeight(10);
    } else {
      setPanelHeight(50);
    }
  };

  const graphDataWithFallback = graphData || { nodes: [], edges: [] };

  return (
    <div className="h-screen w-full overflow-hidden">
      <div className="hidden lg:flex h-full">
        <div className="w-[30%] h-full border-r border-gray-200 overflow-y-auto p-4 bg-garden-warm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sans font-bold text-xl">笔记列表</h2>
            <button
              onClick={clearNodePositions}
              className="text-sm text-gray-500 hover:text-garden-teal flex items-center gap-1"
            >
              <RotateCcw size={14} />
              重置布局
            </button>
          </div>
          <div className="space-y-3">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => navigate(`/editor/${note.id}`)}
                draggable={false}
              />
            ))}
          </div>
        </div>
        <div className="w-[70%] h-full">
          {loading ? (
            <div className="flex items-center justify-center h-full bg-garden-dark text-white">
              加载中...
            </div>
          ) : (
            <GraphCanvas data={graphDataWithFallback} onNodeDoubleClick={handleNodeDoubleClick} />
          )}
        </div>
      </div>

      <div className="hidden md:flex lg:hidden flex-col h-full">
        <div className="relative h-1/2 w-full">
          <button
            onClick={clearNodePositions}
            className="absolute top-4 right-4 z-40 bg-white/90 backdrop-blur p-2 rounded-full shadow-lg"
            title="重置布局"
          >
            <RotateCcw size={16} className="text-gray-700" />
          </button>
          {loading ? (
            <div className="flex items-center justify-center h-full bg-garden-dark text-white">
              加载中...
            </div>
          ) : (
            <GraphCanvas data={graphDataWithFallback} onNodeDoubleClick={handleNodeDoubleClick} />
          )}
        </div>
        <div className="h-1/2 w-full border-t border-gray-200 overflow-y-auto p-4 bg-garden-warm">
          <h2 className="font-sans font-bold text-xl mb-4">笔记列表</h2>
          <div className="space-y-3">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => navigate(`/editor/${note.id}`)}
                draggable={false}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="md:hidden relative h-full">
        <div className="h-full">
          {loading ? (
            <div className="flex items-center justify-center h-full bg-garden-dark text-white">
              加载中...
            </div>
          ) : (
            <GraphCanvas data={graphDataWithFallback} onNodeDoubleClick={handleNodeDoubleClick} />
          )}
        </div>

        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <button
            onClick={clearNodePositions}
            className="bg-white/90 backdrop-blur p-3 rounded-full shadow-lg hover:bg-white transition-colors"
            title="重置布局"
          >
            <RotateCcw size={20} className="text-gray-700" />
          </button>
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className="bg-white/90 backdrop-blur p-3 rounded-full shadow-lg hover:bg-white transition-colors"
          >
            <List size={20} className="text-gray-700" />
          </button>
        </div>

        <div
          ref={panelRef}
          className={`fixed left-0 right-0 bottom-0 bg-white border-t border-gray-200 rounded-t-2xl shadow-2xl transition-all duration-300 z-40 ${
            panelOpen ? '' : 'translate-y-[calc(100%-3rem)]'
          }`}
          style={{ height: `${panelHeight}%` }}
        >
          <div
            className="h-12 flex items-center justify-center cursor-grab border-b border-gray-100"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <ChevronUp className={`transition-transform duration-300 ${panelOpen ? 'rotate-180' : ''}`} size={24} />
          </div>
          <div className="h-[calc(100%-3rem)] overflow-y-auto p-4">
            <h2 className="font-sans font-bold text-xl mb-4">笔记列表</h2>
            <div className="space-y-3">
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onClick={() => {
                    navigate(`/editor/${note.id}`);
                    setPanelOpen(false);
                  }}
                  draggable={false}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

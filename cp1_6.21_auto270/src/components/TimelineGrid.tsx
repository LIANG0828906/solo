import { useEffect, useRef, useState } from 'react';
import { Type, PenLine, Mic, Trash2, Play, Clock } from 'lucide-react';
import { useInspirationStore } from '@/store';
import type { Inspiration } from '@/types';

const COLUMN_WIDTH = 240;
const GAP = 16;

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return '昨天 ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + '...';
}

export default function TimelineGrid() {
  const { getFilteredInspirations, deleteInspiration } = useInspirationStore();
  const items = getFilteredInspirations();
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(4);

  useEffect(() => {
    const updateColumns = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const cols = Math.max(1, Math.floor((width + GAP) / (COLUMN_WIDTH + GAP)));
      setColumns(cols);
    };
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const columnHeights = new Array(columns).fill(0);
  const columnItems: Inspiration[][] = new Array(columns).fill(null).map(() => []);

  items.forEach((item) => {
    let shortest = 0;
    for (let i = 1; i < columns; i++) {
      if (columnHeights[i] < columnHeights[shortest]) shortest = i;
    }
    columnItems[shortest].push(item);
    columnHeights[shortest] += estimateHeight(item) + GAP;
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定删除这条灵感吗？')) {
      await deleteInspiration(id);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
        <div className="w-20 h-20 rounded-full bg-white/60 flex items-center justify-center mb-4">
          <Type size={36} className="text-gray-300" />
        </div>
        <p className="text-lg font-medium">还没有灵感记录</p>
        <p className="text-sm mt-1">点击顶部工具栏开始捕捉你的第一个灵感</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-w-0">
      <div className="flex gap-4" style={{ gap: `${GAP}px` }}>
        {columnItems.map((col, colIdx) => (
          <div
            key={colIdx}
            className="flex flex-col"
            style={{ width: `${COLUMN_WIDTH}px`, gap: `${GAP}px` }}
          >
            {col.map((item) => (
              <InspirationCard key={item.id} item={item} onDelete={handleDelete} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function estimateHeight(item: Inspiration): number {
  if (item.type === 'drawing') return 220;
  if (item.type === 'voice') return 160;
  const text = stripHtml(item.content);
  const base = 80;
  const perLine = 24;
  const lines = Math.ceil(text.length / 20);
  return base + lines * perLine + (item.tags.length > 0 ? 36 : 0);
}

interface CardProps {
  item: Inspiration;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

function InspirationCard({ item, onDelete }: CardProps) {
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const togglePlay = () => {
    if (!audioRef) return;
    if (playing) {
      audioRef.pause();
      setPlaying(false);
    } else {
      audioRef.play();
      setPlaying(true);
    }
  };

  const typeIcon = {
    text: <Type size={14} className="text-accent-blue" />,
    drawing: <PenLine size={14} className="text-purple-500" />,
    voice: <Mic size={14} className="text-accent-green" />,
  }[item.type];

  return (
    <div
      className="bg-white rounded-xl shadow-card hover:shadow-cardHover transition-all duration-300 overflow-hidden group animate-pop-in"
    >
      {item.type === 'drawing' && item.thumbnail && (
        <div className="w-full h-36 bg-gray-50 overflow-hidden">
          <img src={item.thumbnail} alt="drawing" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            {typeIcon}
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {item.type === 'text' ? '文字' : item.type === 'drawing' ? '手绘' : '语音'}
            </span>
          </div>
          <button
            onClick={(e) => onDelete(item.id, e)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {item.type === 'text' && (
          <div
            className="text-sm text-gray-700 leading-relaxed line-clamp-6"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 6,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
            dangerouslySetInnerHTML={{ __html: item.content }}
          />
        )}

        {item.type === 'voice' && (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-green to-accent-green2 text-white flex items-center justify-center shadow-md hover:shadow-lg transition-shadow shrink-0"
              >
                {playing ? <span className="text-xs">❚❚</span> : <Play size={16} className="ml-0.5" />}
              </button>
              <div className="flex-1">
                <div className="flex items-end gap-0.5 h-6 mb-1">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-gradient-to-t from-accent-green to-accent-green2 rounded-full animate-wave-bar"
                      style={{ animationDelay: `${i * 0.08}s`, height: playing ? undefined : `${6 + (i % 5) * 3}px` }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={11} />
                  <span>{item.duration || 0}秒</span>
                </div>
              </div>
              {item.audioUrl && (
                <audio
                  ref={setAudioRef}
                  src={item.audioUrl}
                  onEnded={() => setPlaying(false)}
                  onPause={() => setPlaying(false)}
                />
              )}
            </div>
            <p className="text-sm text-gray-600 line-clamp-2" style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {truncate(stripHtml(item.content), 80)}
            </p>
          </div>
        )}

        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-blue-50 text-accent-blue text-[10px] rounded-full font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center text-xs text-gray-400">
          <Clock size={11} className="mr-1" />
          {formatTime(item.createdAt)}
        </div>
      </div>
    </div>
  );
}

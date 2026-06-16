import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useDreamStore } from '@/store/dreamStore';
import type { DreamEntry } from '@/types';

const EMOTIONS = [
  { tag: '平静', color: '#A8D8EA' },
  { tag: '喜悦', color: '#F7C948' },
  { tag: '悲伤', color: '#6A9FB5' },
  { tag: '恐惧', color: '#8B5E83' },
  { tag: '愤怒', color: '#D94A4A' },
  { tag: '混乱', color: '#B0A1C8' },
];

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getMinDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function truncateText(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + '…';
}

function renderSimpleMarkdown(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    let processed = line;
    if (line.startsWith('# ')) {
      processed = line.slice(2);
      return <h3 key={i} className="text-lg font-bold text-dream-purple mb-1">{processed}</h3>;
    }
    const parts: (string | JSX.Element)[] = [];
    const regex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let partIdx = 0;
    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }
      parts.push(<strong key={partIdx++} className="text-dream-purple font-semibold">{match[1]}</strong>);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }
    return <p key={i} className="text-sm text-dream-text/80 leading-relaxed">{parts.length > 0 ? parts : line}</p>;
  });
}

export default function DreamLog() {
  const { dreams, addDream, selectDream, selectedDream, loadDreams } = useDreamStore();
  const [text, setText] = useState('');
  const [date, setDate] = useState(getToday());
  const [emotionTag, setEmotionTag] = useState('');
  const [emotionColor, setEmotionColor] = useState('');

  useEffect(() => {
    loadDreams();
  }, [loadDreams]);

  const handleSave = useCallback(() => {
    if (!text.trim() || !emotionTag) return;
    const dream: DreamEntry = {
      id: uuidv4(),
      text: text.trim(),
      date,
      emotionTag,
      emotionColor,
    };
    addDream(dream);
    setText('');
    setEmotionTag('');
    setEmotionColor('');
    setDate(getToday());
  }, [text, date, emotionTag, emotionColor, addDream]);

  const handleEmotionSelect = (tag: string, color: string) => {
    setEmotionTag(tag);
    setEmotionColor(color);
  };

  const handleSelectDream = (dream: DreamEntry) => {
    if (selectedDream?.id === dream.id) {
      selectDream(null);
    } else {
      selectDream(dream);
    }
  };

  const sortedDreams = [...dreams].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 pb-2">
        <h2 className="text-lg font-bold text-dream-purple mb-3 flex items-center gap-2">
          <span className="text-xl">🌙</span> 梦日记
        </h2>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="记录你的梦境...&#10;使用 # 作为标题，**强调** 关键词"
          className="w-full h-28 bg-[#2A2A2A] border border-dream-border rounded-xl p-3 text-sm text-dream-text resize-none focus:outline-none focus:border-dream-purple/50 transition-colors duration-200 placeholder:text-dream-text/30"
        />

        <div className="flex items-center gap-3 mt-3">
          <input
            type="date"
            value={date}
            min={getMinDate()}
            max={getToday()}
            onChange={(e) => setDate(e.target.value)}
            className="bg-[#2A2A2A] border border-dream-border rounded-lg px-3 py-1.5 text-xs text-dream-text focus:outline-none focus:border-dream-purple/50 transition-colors duration-200"
          />
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {EMOTIONS.map((e) => (
            <button
              key={e.tag}
              onClick={() => handleEmotionSelect(e.tag, e.color)}
              className="w-20 h-[30px] rounded-md text-xs font-medium transition-all duration-200 hover:brightness-110"
              style={{
                backgroundColor: emotionTag === e.tag ? e.color : `${e.color}33`,
                color: emotionTag === e.tag ? '#121212' : e.color,
                boxShadow: emotionTag === e.tag ? `0 0 8px ${e.color}` : 'none',
              }}
            >
              {e.tag}
            </button>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={!text.trim() || !emotionTag}
          className="w-full mt-3 py-2 rounded-xl text-sm font-medium bg-dream-purple/20 text-dream-purple border border-dream-purple/30 hover:bg-dream-purple/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
        >
          保存梦境
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 mt-2">
        <div className="h-px bg-gradient-to-r from-dream-purple/30 to-transparent my-2" />

        {selectedDream && (
          <div className="mb-3 p-3 rounded-xl bg-dream-purple/10 border border-dream-purple/20 animate-fadeIn">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-3 h-3 rounded-sm inline-block"
                style={{ backgroundColor: selectedDream.emotionColor }}
              />
              <span className="text-xs text-dream-purple">
                {selectedDream.emotionTag} · {formatDate(selectedDream.date)}
              </span>
            </div>
            <div className="text-sm">{renderSimpleMarkdown(selectedDream.text)}</div>
          </div>
        )}

        {sortedDreams.length === 0 ? (
          <div className="text-center text-dream-text/30 text-xs mt-8">
            还没有梦境记录，写下你的第一个梦吧 ✨
          </div>
        ) : (
          <div className="space-y-1.5">
            {sortedDreams.map((dream) => (
              <button
                key={dream.id}
                onClick={() => handleSelectDream(dream)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all duration-200 hover:bg-[#2A2A2A] animate-slideIn ${
                  selectedDream?.id === dream.id
                    ? 'bg-dream-purple/10 border-dream-purple/30'
                    : 'bg-dream-panel border-dream-border/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: dream.emotionColor }}
                  />
                  <span className="text-[10px] text-dream-text/50">{formatDate(dream.date)}</span>
                  <span className="text-[10px] text-dream-text/30">{dream.emotionTag}</span>
                </div>
                <p className="text-xs text-dream-text/70 mt-1 truncate">
                  {truncateText(dream.text.replace(/[#*]/g, ''), 15)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

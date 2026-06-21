import { X, Type, PenLine, Mic, Clock, Play, Shuffle } from 'lucide-react';
import { useInspirationStore } from '@/store';
import { useState, useRef } from 'react';

function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

export default function RandomInspiration() {
  const { randomInspiration, closeRandom, openRandom } = useInspirationStore();
  const [flipping, setFlipping] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  if (!randomInspiration) return null;

  const handleNext = async () => {
    setFlipping(true);
    setTimeout(async () => {
      await openRandom();
      setFlipping(false);
      setPlaying(false);
    }, 300);
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  };

  const typeIcon = {
    text: <Type size={18} className="text-accent-blue" />,
    drawing: <PenLine size={18} className="text-purple-500" />,
    voice: <Mic size={18} className="text-accent-green" />,
  }[randomInspiration.type];

  const typeLabel = {
    text: '文字灵感',
    drawing: '手绘灵感',
    voice: '语音灵感',
  }[randomInspiration.type];

  const dateStr = new Date(randomInspiration.createdAt).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70]"
      onClick={closeRandom}
    >
      <div
        className={`relative ${flipping ? 'opacity-0 scale-95' : 'animate-flip-in'}`}
        style={{ transition: 'all 0.3s ease' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-[420px] overflow-hidden">
          <div className="bg-gradient-to-br from-accent-blue via-[#6366F1] to-[#8B5CF6] p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shuffle size={18} />
                <span className="text-sm font-medium opacity-90">随机回忆</span>
              </div>
              <button
                onClick={closeRandom}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <h2 className="text-2xl font-bold">✨ 来自过去的灵感</h2>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
              {typeIcon}
              <span className="text-sm font-medium text-gray-700">{typeLabel}</span>
              <div className="flex-1" />
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock size={12} />
                {dateStr}
              </div>
            </div>

            <div className="min-h-[160px]">
              {randomInspiration.type === 'text' && (
                <div
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: randomInspiration.content }}
                />
              )}

              {randomInspiration.type === 'drawing' && randomInspiration.thumbnail && (
                <img
                  src={randomInspiration.thumbnail}
                  alt="drawing"
                  className="w-full rounded-xl border border-gray-100"
                />
              )}

              {randomInspiration.type === 'voice' && (
                <div className="space-y-4">
                  {randomInspiration.audioUrl && (
                    <div className="flex items-center gap-4">
                      <button
                        onClick={togglePlay}
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-green to-accent-green2 text-white flex items-center justify-center shadow-md"
                      >
                        {playing ? <span className="text-xs">❚❚</span> : <Play size={18} className="ml-0.5" />}
                      </button>
                      <audio
                        ref={audioRef}
                        src={randomInspiration.audioUrl}
                        controls
                        className="flex-1"
                        onEnded={() => setPlaying(false)}
                        onPause={() => setPlaying(false)}
                      />
                    </div>
                  )}
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    {stripHtml(randomInspiration.content)}
                  </p>
                </div>
              )}
            </div>

            {randomInspiration.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-gray-100">
                {randomInspiration.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-blue-50 text-accent-blue text-xs rounded-full font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="px-6 pb-6">
            <button
              onClick={handleNext}
              disabled={flipping}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-gray-100 to-gray-100 hover:from-gray-200 hover:to-gray-200 text-gray-700 rounded-xl font-medium text-sm transition-all"
            >
              <Shuffle size={16} />
              再抽一张
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

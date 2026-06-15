import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, ChevronDown, ChevronUp, X, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMoodStore } from '@/store/moodStore';
import type { HistoryItem, Song } from '@/types';
import SongCard from './SongCard';

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;

  const date = new Date(timestamp);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const { history, clearHistory, moods, favorites, toggleFavorite, currentSong, setCurrentSong, setIsPlaying, isPlaying, setCurrentMood, setPlaylist } = useMoodStore();
  const [filterMood, setFilterMood] = useState<string>('all');
  const [showClearModal, setShowClearModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  const filteredHistory = history.filter((item) => {
    if (filterMood === 'all') return true;
    return item.mood === filterMood;
  });

  const handleClearHistory = () => {
    clearHistory();
    setShowClearModal(false);
  };

  const handleViewPlaylist = (item: HistoryItem) => {
    const mood = moods.find((m) => m.name === item.mood);
    if (mood) {
      setCurrentMood(mood);
      setPlaylist(item.songs);
      navigate('/playlist');
    }
  };

  const handlePlay = (song: Song) => {
    if (currentSong?.id === song.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
    }
  };

  const uniqueMoods = moods;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 fade-in-up">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center hover:shadow-lg transition-all hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">历史记录</h1>
          <button
            onClick={() => navigate('/playlist')}
            className="w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center hover:shadow-lg transition-all hover:scale-105"
          >
            <Music className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <button
              onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
              className="w-full px-4 py-3 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all"
            >
              <span className="text-gray-700 flex items-center gap-2">
                {filterMood === 'all' ? (
                  <span>全部情绪</span>
                ) : (
                  <>
                    <span>{uniqueMoods.find((m) => m.name === filterMood)?.emoji}</span>
                    <span>{uniqueMoods.find((m) => m.name === filterMood)?.label}</span>
                  </>
                )}
              </span>
              <ChevronDown className={cn('w-5 h-5 text-gray-400 transition-transform', filterDropdownOpen && 'rotate-180')} />
            </button>

            {filterDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-20">
                <button
                  onClick={() => {
                    setFilterMood('all');
                    setFilterDropdownOpen(false);
                  }}
                  className={cn(
                    'w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-2',
                    filterMood === 'all' && 'bg-gray-50 font-medium'
                  )}
                >
                  <span>🎵</span>
                  <span className="text-gray-700">全部情绪</span>
                </button>
                {uniqueMoods.map((mood) => (
                  <button
                    key={mood.id}
                    onClick={() => {
                      setFilterMood(mood.name);
                      setFilterDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-2',
                      filterMood === mood.name && 'bg-gray-50 font-medium'
                    )}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: mood.color }}
                    />
                    <span className="text-lg">{mood.emoji}</span>
                    <span className="text-gray-700">{mood.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {history.length > 0 && (
            <button
              onClick={() => setShowClearModal(true)}
              className="px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all flex items-center gap-2 font-medium"
            >
              <Trash2 className="w-4 h-4" />
              清空
            </button>
          )}
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Music className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-500">暂无历史记录</p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 px-6 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              去选择心情
            </button>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[22px] top-2 bottom-2 w-0.5 bg-gray-200" />

            <div className="space-y-2">
              {filteredHistory.map((item, index) => (
                <div
                  key={item.id}
                  className="relative fade-in-up"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="flex gap-4">
                    <div className="relative z-10 flex-shrink-0">
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-xl shadow-md"
                        style={{ backgroundColor: item.color + '30' }}
                      >
                        <span className="relative z-10">{item.emoji}</span>
                      </div>
                      <div
                        className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: item.color }}
                      />
                    </div>

                    <div className="flex-1 pb-4">
                      <div
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all"
                      >
                        <button
                          onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                          className="w-full p-4 flex items-center justify-between"
                        >
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-800">{item.moodLabel}</span>
                              <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-500">
                                {item.songCount} 首歌
                              </span>
                            </div>
                            <p className="text-sm text-gray-400">{formatTimeAgo(item.timestamp)}</p>
                          </div>
                          {expandedId === item.id ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </button>

                        {expandedId === item.id && (
                          <div className="border-t border-gray-100 p-4 bg-gray-50">
                            <div className="mb-4">
                              <button
                                onClick={() => handleViewPlaylist(item)}
                                className="w-full py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors text-sm"
                              >
                                查看完整歌单
                              </button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                              {item.songs.map((song) => (
                                <div key={song.id} className="scale-90 origin-top-left">
                                  <SongCard
                                    song={song}
                                    isFavorite={favorites.includes(song.id)}
                                    isPlaying={currentSong?.id === song.id && isPlaying}
                                    onPlay={() => handlePlay(song)}
                                    onToggleFavorite={() => toggleFavorite(song.id)}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowClearModal(false)}
          />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl p-6 animate-[slideUp_0.3s_ease-out]">
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">清空历史记录</h3>
              <p className="text-gray-500">确定要清空所有历史记录吗？此操作无法撤销。</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearModal(false)}
                className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleClearHistory}
                className="flex-1 py-3.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
              >
                确定清空
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

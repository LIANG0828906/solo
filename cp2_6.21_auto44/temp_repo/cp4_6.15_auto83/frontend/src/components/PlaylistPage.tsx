import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Music2 } from 'lucide-react';
import { useMoodStore } from '@/store/moodStore';
import SongCard from './SongCard';

export default function PlaylistPage() {
  const navigate = useNavigate();
  const { currentMood, playlist, favorites, toggleFavorite, setCurrentSong, currentSong, setIsPlaying, isPlaying } = useMoodStore();
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  const fullText = currentMood ? `今天是${currentMood.label}的一天` : '';

  useEffect(() => {
    if (!currentMood) return;
    setDisplayText('');
    let index = 0;
    const interval = setInterval(() => {
      index++;
      setDisplayText(fullText.slice(0, index));
      if (index >= fullText.length) {
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [currentMood, fullText]);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((c) => !c);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  const handlePlay = (song: typeof playlist[number]) => {
    if (currentSong?.id === song.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
    }
  };

  if (!currentMood || playlist.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center px-4 fade-in-up">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Music2 className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-700 mb-3">还没有歌单</h2>
          <p className="text-gray-500 mb-8">先返回首页选择你的心情吧</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full bg-gradient-to-br pb-20 px-4 md:px-8 fade-in-up"
      style={{
        background: `linear-gradient(135deg, ${currentMood.color}22 0%, #f8fafc 50%, ${currentMood.color}11 100%)`,
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between pt-8 mb-10">
          <button
            onClick={() => navigate('/')}
            className="w-11 h-11 rounded-full bg-white/80 backdrop-blur flex items-center justify-center hover:bg-white shadow-md transition-all hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={() => navigate('/history')}
            className="px-5 py-2.5 rounded-full bg-white/80 backdrop-blur text-gray-700 font-medium hover:bg-white shadow-md transition-all hover:scale-105 text-sm"
          >
            历史记录
          </button>
        </div>

        <div className="text-center mb-12">
          <div className="text-7xl mb-5">{currentMood.emoji}</div>
          <h1 className="text-3xl md:text-5xl font-bold text-gray-800 tracking-tight min-h-[3.5rem]">
            {displayText}
            <span
              className="inline-block w-1 h-10 md:h-14 ml-1 align-middle transition-opacity"
              style={{
                backgroundColor: currentMood.color,
                opacity: showCursor ? 1 : 0,
              }}
            />
          </h1>
          <p className="mt-4 text-gray-500 text-lg">为你精选 {playlist.length} 首歌曲</p>
        </div>

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
          {playlist.map((song, index) => (
            <div
              key={song.id}
              className="fade-in-up"
              style={{ animationDelay: `${index * 80}ms` }}
            >
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
    </div>
  );
}

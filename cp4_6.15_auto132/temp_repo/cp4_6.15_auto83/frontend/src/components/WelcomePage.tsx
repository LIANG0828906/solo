import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMoodStore } from '@/store/moodStore';
import { getMoods, predictMood, getRecommendations } from '@/utils/api';
import MoodCard from './MoodCard';
import type { Mood } from '@/types';

function getTimeGradient(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) {
    return 'from-sky-200 via-blue-100 to-amber-200';
  } else if (hour >= 10 && hour < 17) {
    return 'from-sky-300 via-cyan-200 to-emerald-200';
  } else if (hour >= 17 && hour < 20) {
    return 'from-orange-400 via-rose-400 to-purple-500';
  } else {
    return 'from-indigo-900 via-purple-900 to-slate-900';
  }
}

function isDarkTime(): boolean {
  const hour = new Date().getHours();
  return hour >= 20 || hour < 5;
}

export default function WelcomePage() {
  const navigate = useNavigate();
  const { setCurrentMood, setPlaylist, addToHistory, moods, setMoods: setStoreMoods } = useMoodStore();
  const [inputText, setInputText] = useState('');
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [moodsLoaded, setMoodsLoaded] = useState(false);

  useEffect(() => {
    if (moods.length === 0 && !moodsLoaded) {
      getMoods()
        .then((data) => {
          setStoreMoods(data);
          setMoodsLoaded(true);
        })
        .catch((err) => {
          console.error('加载情绪列表失败:', err);
        });
    } else if (moods.length > 0) {
      setMoodsLoaded(true);
    }
  }, [moods.length, setStoreMoods, moodsLoaded]);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setLoadingProgress(0);

    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / 2000) * 100, 100);
      setLoadingProgress(progress);
    }, 50);

    try {
      const result = await predictMood({ text: inputText.trim() });
      const predictedMood = moods.find((m) => m.name === result.emotion);
      if (predictedMood) {
        setSelectedMood(predictedMood);
        await fetchRecommendationsAndNavigate(predictedMood);
      }
    } catch (error) {
      console.error('分析失败:', error);
    } finally {
      clearInterval(progressInterval);
      setIsLoading(false);
    }
  };

  const handleMoodSelect = async (mood: Mood) => {
    if (isLoading) return;
    setSelectedMood(mood);
    setIsLoading(true);
    setLoadingProgress(0);

    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / 2000) * 100, 100);
      setLoadingProgress(progress);
    }, 50);

    setTimeout(async () => {
      clearInterval(progressInterval);
      await fetchRecommendationsAndNavigate(mood);
      setIsLoading(false);
    }, 2000);
  };

  const fetchRecommendationsAndNavigate = async (mood: Mood) => {
    try {
      const songs = await getRecommendations(mood.name);
      setCurrentMood(mood);
      setPlaylist(songs);
      addToHistory(mood, songs);
      navigate('/playlist');
    } catch (error) {
      console.error('获取推荐失败:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAnalyze();
    }
  };

  const dark = isDarkTime();

  return (
    <div
      className={cn(
        'min-h-screen w-full bg-gradient-to-br transition-colors duration-1000 flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden',
        getTimeGradient()
      )}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-white/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="relative z-10 w-full max-w-2xl fade-in-up">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className={cn('w-7 h-7', dark ? 'text-yellow-300' : 'text-amber-500')} />
            <h1 className={cn('text-4xl md:text-5xl font-bold tracking-tight', dark ? 'text-white' : 'text-gray-800')}>
              Mood Music
            </h1>
          </div>
          <p className={cn('text-lg', dark ? 'text-white/70' : 'text-gray-600')}>
            根据你的心情，发现专属于你的歌单
          </p>
        </div>

        <div className="glass p-3 mb-10 flex items-center gap-2 shadow-xl">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="今天感觉怎么样？"
            disabled={isLoading}
            className={cn(
              'flex-1 bg-transparent border-none outline-none px-4 py-3 text-base',
              dark ? 'text-white placeholder-white/50' : 'text-gray-800 placeholder-gray-500'
            )}
          />
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !inputText.trim()}
            className={cn(
              'px-5 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all',
              inputText.trim() && !isLoading
                ? dark
                  ? 'bg-white text-gray-900 hover:bg-white/90'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
                : 'bg-white/20 text-white/40 cursor-not-allowed'
            )}
          >
            <Send className="w-4 h-4" />
            分析
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {moods.map((mood) => (
            <MoodCard
              key={mood.id}
              mood={mood}
              selected={selectedMood?.id === mood.id}
              onClick={() => handleMoodSelect(mood)}
            />
          ))}
        </div>
      </div>

      {isLoading && selectedMood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-32 h-32">
              <div
                className="absolute inset-0 rounded-full transition-opacity duration-200"
                style={{
                  backgroundColor: selectedMood.color,
                  opacity: loadingProgress / 100,
                  boxShadow: `0 0 60px ${selectedMood.color}`,
                }}
              />
              <div
                className="absolute inset-0 rounded-full border-4 transition-transform duration-200"
                style={{
                  borderColor: selectedMood.color,
                  transform: `scale(${0.3 + (loadingProgress / 100) * 0.7})`,
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl drop-shadow-lg">{selectedMood.emoji}</span>
              </div>
            </div>
            <p className="text-white text-lg font-medium drop-shadow-md">
              正在为你挑选歌曲...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

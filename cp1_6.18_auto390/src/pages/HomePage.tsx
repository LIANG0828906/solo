import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { weatherSimulator } from '@/utils/weatherSimulator';
import { outfitRecommender } from '@/utils/outfitRecommender';
import type { Style, UserProfile } from '@/store/useStore';

const typeEmojis: Record<string, string> = {
  top: '🧥',
  bottom: '👖',
  shoes: '👟',
  accessory: '🧣',
};

export default function HomePage() {
  const { wardrobe, currentOutfit, weather, user, favorites, setOutfit, setWeather, setUser, toggleFavorite } = useStore();
  const [showRegister, setShowRegister] = useState(!user);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showOutfit, setShowOutfit] = useState(false);
  const [isFavoriteAnimating, setIsFavoriteAnimating] = useState(false);
  const [formData, setFormData] = useState<Omit<UserProfile, 'username'> & { username: string }>({
    username: '',
    style: 'casual',
    height: 170,
    weight: 60,
  });

  useEffect(() => {
    const updateWeather = () => {
      const newWeather = weatherSimulator.generate();
      setWeather(newWeather);
    };
    updateWeather();
    const interval = setInterval(updateWeather, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [setWeather]);

  const handleGenerate = useCallback(() => {
    setIsGenerating(true);
    setShowOutfit(false);
    setTimeout(() => {
      const outfit = outfitRecommender.recommend(wardrobe, weather, user?.style || 'casual');
      setOutfit(outfit);
      setIsGenerating(false);
      setTimeout(() => setShowOutfit(true), 50);
    }, 300);
  }, [wardrobe, weather, user?.style, setOutfit]);

  const handleFavorite = () => {
    if (!currentOutfit) return;
    const key = `${currentOutfit.top.id}-${currentOutfit.bottom.id}-${currentOutfit.shoes.id}`;
    setIsFavoriteAnimating(true);
    setTimeout(() => setIsFavoriteAnimating(false), 400);
    toggleFavorite(key);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setUser(formData);
    setShowRegister(false);
  };

  const isFavorited = currentOutfit
    ? favorites.includes(`${currentOutfit.top.id}-${currentOutfit.bottom.id}-${currentOutfit.shoes.id}`)
    : false;

  return (
    <div className="min-h-screen home-bg">
      <header className="flex justify-between items-center p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800">每日穿搭</h1>
        <Link to="/wardrobe" className="text-gray-600 hover:text-accent transition-colors">
          🚪 我的衣橱
        </Link>
      </header>

      <main className="flex flex-col md:flex-row items-center justify-center gap-8 p-6 max-w-6xl mx-auto">
        <div className="weather-card">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">{weather.city}</h2>
          <div className="text-6xl mb-4">{weather.icon}</div>
          <p className="text-4xl font-bold text-gray-800">{weather.temperature}°C</p>
          <p className="text-gray-500 mt-2">💧 湿度 {weather.humidity}%</p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="generate-btn px-8 py-4 text-white font-semibold text-lg rounded-xl shadow-lg"
          >
            {isGenerating ? '生成中...' : '✨ 生成今日穿搭'}
          </button>

          {currentOutfit && (
            <div className={`outfit-card ${showOutfit ? 'slide-up' : 'opacity-0 translate-y-8'}`}>
              <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">今日穿搭推荐</h3>
              <div className="flex justify-around mb-6">
                {[
                  { item: currentOutfit.top, type: 'top' },
                  { item: currentOutfit.bottom, type: 'bottom' },
                  { item: currentOutfit.shoes, type: 'shoes' },
                  { item: currentOutfit.accessory, type: 'accessory' },
                ].map(({ item, type }) => (
                  <div key={item.id} className="flex flex-col items-center">
                    <span className="text-3xl mb-1">{typeEmojis[type]}</span>
                    <span className="text-sm text-gray-600 text-center max-w-16">{item.name}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mb-4 text-center px-2">{currentOutfit.reason}</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleFavorite}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    isFavoriteAnimating ? 'scale-75' : 'scale-100'
                  } ${isFavorited ? 'bg-favorite text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  ❤️ 收藏
                </button>
                <button
                  onClick={handleGenerate}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                >
                  🔄 换一套
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {showRegister && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">完善个人信息</h2>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">风格偏好</label>
                <select
                  value={formData.style}
                  onChange={(e) => setFormData({ ...formData, style: e.target.value as Style })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                >
                  <option value="casual">休闲</option>
                  <option value="business">商务</option>
                  <option value="sport">运动</option>
                  <option value="vintage">复古</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">身高 (cm)</label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                    min="100"
                    max="250"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">体重 (kg)</label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                    min="30"
                    max="200"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-accent text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                开始使用
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

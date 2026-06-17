import { useState } from 'react';
import { useRecipeStore } from './stores/recipeStore';
import { NavBar } from './components/NavBar';
import { SeasonCard } from './components/SeasonCard';
import { CalendarModal } from './components/CalendarModal';
import { Calendar, Sparkles } from 'lucide-react';

function App() {
  const recipes = useRecipeStore((state) => state.recipes);
  const favorites = useRecipeStore((state) => state.favorites);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: 'linear-gradient(180deg, #F5EDE3 0%, #D4C9B8 100%)',
        fontFamily: '"Noto Serif SC", serif',
      }}
    >
      <NavBar />

      <main className="pt-24 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ backgroundColor: 'rgba(229, 107, 93, 0.1)' }}>
              <Sparkles size={16} style={{ color: '#E56B5D' }} />
              <span className="text-sm font-medium" style={{ color: '#E56B5D' }}>
                二十四节气 · 时令美食
              </span>
            </div>
            <h1
              className="text-5xl font-bold mb-3"
              style={{
                fontFamily: '"Ma Shan Zheng", cursive',
                color: '#3D2914',
                letterSpacing: '6px',
              }}
            >
              节气食单
            </h1>
            <p className="text-lg" style={{ color: '#8B7355' }}>
              顺应时节 · 品味生活 · 记录每一道时令美味
            </p>
            <div className="mt-6 flex items-center justify-center gap-6 text-sm" style={{ color: '#B8A48C' }}>
              <span>24 个节气</span>
              <span>·</span>
              <span>24 道主打菜</span>
              <span>·</span>
              <span>已有 {favorites.length} 道收藏</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-8">
            {recipes.map((recipe, index) => (
              <SeasonCard key={recipe.id} recipe={recipe} index={index} />
            ))}
          </div>

          <div className="mt-16 flex justify-center">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-3 font-medium text-white transition-all hover:scale-105 active:scale-95"
              style={{
                width: '240px',
                height: '48px',
                backgroundColor: '#C0392B',
                borderRadius: '32px',
                boxShadow: '0 4px 12px rgba(192,57,43,0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#A93226';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#C0392B';
              }}
            >
              <Calendar size={20} />
              <span style={{ fontFamily: '"Ma Shan Zheng", cursive', fontSize: '18px', letterSpacing: '2px' }}>
                生成美食日历
              </span>
            </button>
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm" style={{ color: '#B8A48C' }}>
              —— 节气有常，食而有味 ——
            </p>
          </div>
        </div>
      </main>

      <CalendarModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

export default App;

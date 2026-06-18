import { useNavigate } from 'react-router-dom';
import { CollectionCard } from '../components/CollectionCard';
import { collections } from '../data/collections';
import { FaHeart, FaArrowRight } from 'react-icons/fa';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <div
        className="relative min-h-screen overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #F5F5DC 0%, #E8F5E9 50%, #F5F5DC 100%)'
        }}
      >
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cpath d='M40,5 Q48,18 40,30 Q32,18 40,5 M20,25 Q28,38 20,50 Q12,38 20,25 M60,25 Q68,38 60,50 Q52,38 60,25 M25,55 Q33,68 25,75 Q17,68 25,55 M55,55 Q63,68 55,75 Q47,68 55,55' fill='%232E8B57'/%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px'
          }}
        />

        <nav className="relative z-10 px-8 py-6 flex items-center justify-between">
          <div
            className="text-2xl font-bold text-emerald-800 cursor-pointer"
            style={{ fontFamily: "'Playfair Display', serif" }}
            onClick={() => navigate('/')}
          >
            EcoAtelier
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/wishlist')}
              className="flex items-center gap-2 text-gray-700 hover:text-emerald-600 transition-colors"
            >
              <FaHeart />
              <span className="hidden sm:inline">心愿单</span>
            </button>
          </div>
        </nav>

        <div className="relative z-10 px-8 py-16 md:py-24 max-w-7xl mx-auto">
          <div className="max-w-3xl mb-16">
            <h1
              className="text-4xl md:text-6xl font-bold text-gray-800 mb-6 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              可持续时尚的
              <span className="text-emerald-600">未来</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-xl">
              探索我们的环保礼服系列，使用3D技术定制专属于你的独特设计。
              每一次选择，都是对地球的温柔承诺。
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => {
                  const element = document.getElementById('collections');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center gap-2 group"
              >
                探索系列
                <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/wishlist')}
                className="px-8 py-4 bg-white/80 backdrop-blur-sm text-emerald-700 rounded-lg font-semibold border-2 border-emerald-200 hover:border-emerald-400 transition-all"
              >
                我的心愿单
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-12 max-w-2xl">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600 mb-1">12+</div>
              <div className="text-sm text-gray-500">环保面料选择</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-600 mb-1">50%</div>
              <div className="text-sm text-gray-500">平均碳减排</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-600 mb-1">100%</div>
              <div className="text-sm text-gray-500">可追溯来源</div>
            </div>
          </div>
        </div>

        <div id="collections" className="relative z-10 px-8 py-16 max-w-7xl mx-auto">
          <h2
            className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 text-center"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            精选系列
          </h2>
          <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">
            每个系列都融入了设计师对自然的独特理解，点击探索完整系列
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {collections.map((collection, index) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                index={index}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 px-8 py-16 max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-8 md:p-12 text-white overflow-hidden relative">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E")`
              }}
            />
            <div className="relative z-10 max-w-3xl mx-auto text-center">
              <h3
                className="text-2xl md:text-3xl font-bold mb-4"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                每一件定制都是对地球的爱
              </h3>
              <p className="text-emerald-100 mb-6">
                我们与全球环保面料供应商合作，确保每一件服装都符合最高的可持续标准。
                您的每一次选择，都在推动时尚产业的绿色变革。
              </p>
              <button
                onClick={() => {
                  const element = document.getElementById('collections');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-3 bg-white text-emerald-600 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
              >
                开始您的环保时尚之旅
              </button>
            </div>
          </div>
        </div>

        <footer className="relative z-10 px-8 py-8 border-t border-emerald-100">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div
              className="text-xl font-bold text-emerald-800"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              EcoAtelier
            </div>
            <p className="text-sm text-gray-500 text-center">
              © 2024 EcoAtelier. 以时尚之名，守护地球。
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

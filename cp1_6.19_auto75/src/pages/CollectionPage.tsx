import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClothingCard } from '../components/ClothingCard';
import { getCollectionById } from '../data/collections';
import { getClothingByCollection } from '../data/clothing';
import { FaArrowLeft, FaLeaf } from 'react-icons/fa';

export function CollectionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const collection = useMemo(() => getCollectionById(id || ''), [id]);
  const clothingItems = useMemo(() => getClothingByCollection(id || ''), [id]);

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#F5F5DC] to-[#E8F5E9]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">系列不存在</h2>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(180deg, ${collection.themeColors[0]}20 0%, #F5F5DC 30%, #F5F5DC 100%)`
      }}
    >
      <nav className="sticky top-0 z-40 backdrop-blur-lg bg-white/70 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-700 hover:text-emerald-600 transition-colors"
          >
            <FaArrowLeft size={18} />
            <span>返回首页</span>
          </button>
          <div
            className="text-xl font-bold text-gray-800"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {collection.name}
          </div>
          <div className="w-24" />
        </div>
      </nav>

      <div className="relative overflow-hidden">
        <div
          className="h-64 md:h-80"
          style={{
            background: `linear-gradient(135deg, ${collection.themeColors[0]} 0%, ${collection.themeColors[1]} 100%)`
          }}
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cpath d='M40,5 Q48,18 40,30 Q32,18 40,5' fill='white'/%3E%3C/svg%3E")`,
              backgroundSize: '80px 80px'
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 -mt-32">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <span
                className="px-4 py-1 rounded-full text-sm font-medium text-white"
                style={{
                  background: `linear-gradient(135deg, ${collection.themeColors[0]} 0%, ${collection.themeColors[1]} 100%)`
                }}
              >
                {collection.name}
              </span>
              <span className="flex items-center gap-1 text-emerald-600 text-sm">
                <FaLeaf size={14} />
                {clothingItems.length} 件单品
              </span>
            </div>
            <h1
              className="text-3xl md:text-4xl font-bold text-gray-800 mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {collection.name}系列
            </h1>
            <p className="text-gray-600 max-w-2xl leading-relaxed">
              {collection.description}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-semibold text-gray-800">
            系列单品 ({clothingItems.length})
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="hidden sm:inline">排序:</span>
            <select className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option>推荐</option>
              <option>碳足迹（低到高）</option>
              <option>碳足迹（高到低）</option>
            </select>
          </div>
        </div>

        {clothingItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {clothingItems.map((item, index) => (
              <ClothingCard
                key={item.id}
                clothing={item}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <p>该系列暂无单品</p>
          </div>
        )}
      </div>
    </div>
  );
}

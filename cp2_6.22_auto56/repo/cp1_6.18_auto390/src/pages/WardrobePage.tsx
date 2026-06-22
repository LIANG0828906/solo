import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import type { ClothingType, Season } from '@/store/useStore';

const typeLabels: Record<ClothingType, string> = {
  top: '上衣',
  bottom: '下装',
  shoes: '鞋子',
  accessory: '配饰',
};

const typeEmojis: Record<ClothingType, string> = {
  top: '🧥',
  bottom: '👖',
  shoes: '👟',
  accessory: '🧣',
};

const seasonLabels: Record<Season, string> = {
  spring: '春季',
  summer: '夏季',
  autumn: '秋季',
  winter: '冬季',
};

const colorOptions = ['白色', '黑色', '灰色', '蓝色', '红色', '米色', '藏青', '粉色', '绿色', '黄色'];

export default function WardrobePage() {
  const { wardrobe, addItem, removeItem } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'top' as ClothingType,
    name: '',
    season: 'spring' as Season,
    color: '白色',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addItem(formData);
    setFormData({ type: 'top', name: '', season: 'spring', color: '白色' });
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-primary p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <Link to="/" className="text-gray-600 hover:text-accent transition-colors flex items-center gap-2">
            ← 返回首页
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">我的衣橱</h1>
          <div className="w-20"></div>
        </header>

        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-2 bg-accent text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            + 添加单品
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">添加新单品</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ClothingType })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                  >
                    {Object.entries(typeLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                    placeholder="如：白色T恤"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">季节</label>
                  <select
                    value={formData.season}
                    onChange={(e) => setFormData({ ...formData, season: e.target.value as Season })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                  >
                    {Object.entries(seasonLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">颜色</label>
                  <select
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                  >
                    {colorOptions.map((color) => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-accent text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  添加
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {wardrobe.map((item) => (
            <div key={item.id} className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{typeEmojis[item.type]}</span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors text-sm"
                >
                  🗑️
                </button>
              </div>
              <h4 className="font-semibold text-gray-800 mb-1">{item.name}</h4>
              <p className="text-sm text-gray-500">
                {typeLabels[item.type]} · {seasonLabels[item.season]}
              </p>
              <p className="text-sm text-gray-400">颜色：{item.color}</p>
            </div>
          ))}
        </div>

        {wardrobe.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-4">👕</p>
            <p className="text-lg">衣橱空空如也，快去添加一些单品吧！</p>
          </div>
        )}
      </div>
    </div>
  );
}

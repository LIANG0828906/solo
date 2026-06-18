import React from 'react';
import { useAppStore } from '@/store/appStore';

const categories = ['全部', '艺术', '体育', '技术', '社交', '其他'];

const CategoryTabs: React.FC = () => {
  const { selectedCategory, setSelectedCategory } = useAppStore();

  return (
    <div className="sticky top-16 bg-[#f8fafc]/90 backdrop-blur-sm z-40 py-4 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`
                flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium
                transition-all duration-200
                ${selectedCategory === category
                  ? 'bg-[#6366f1] text-white shadow-md'
                  : 'bg-[#f1f5f9] text-[#475569] hover:bg-gray-200'
                }
              `}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryTabs;

import React, { useState, useMemo } from 'react';
import { Work, WorkCategory } from '../types';

interface WorksListProps {
  works: Work[];
  onWorkClick: (work: Work) => void;
}

const categoryLabels: Record<string, string> = {
  all: '全部',
  article: '文章',
  video: '视频',
  image: '图片',
};

const categoryColors: Record<WorkCategory, string> = {
  article: 'bg-blue-100 text-blue-700',
  video: 'bg-purple-100 text-purple-700',
  image: 'bg-green-100 text-green-700',
};

const WorksList: React.FC<WorksListProps> = ({ works, onWorkClick }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayWorks, setDisplayWorks] = useState<Work[]>(works);

  const filteredWorks = useMemo(() => {
    if (activeCategory === 'all') return works;
    return works.filter((work) => work.category === activeCategory);
  }, [works, activeCategory]);

  const handleCategoryChange = (category: string) => {
    if (category === activeCategory) return;
    setIsAnimating(true);
    setTimeout(() => {
      setActiveCategory(category);
      setDisplayWorks(filteredWorks);
      setIsAnimating(false);
    }, 200);
  };

  React.useEffect(() => {
    if (!isAnimating) {
      setDisplayWorks(filteredWorks);
    }
  }, [filteredWorks, isAnimating]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <div className="flex gap-2 mb-8 flex-wrap">
        {Object.entries(categoryLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => handleCategoryChange(key)}
            className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
              activeCategory === key
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-300 ${
          isAnimating ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {displayWorks.map((work) => (
          <div
            key={work.id}
            onClick={() => onWorkClick(work)}
            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={work.coverUrl}
                alt={work.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <span
                className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium ${categoryColors[work.category]}`}
              >
                {categoryLabels[work.category]}
              </span>
            </div>
            <div className="p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1">
                {work.title}
              </h3>
              <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                {work.description}
              </p>
              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {work.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {work.likes}
                  </span>
                </div>
                <span>{work.comments.length} 评论</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {displayWorks.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p>暂无作品</p>
        </div>
      )}
    </div>
  );
};

export default WorksList;

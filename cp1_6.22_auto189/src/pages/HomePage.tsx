import React, { useEffect } from 'react';
import { useAppStore } from '../store';
import PortfolioGrid from '../components/PortfolioGrid';

const HomePage: React.FC = () => {
  const { works, setWorks, setPortfolios, portfolios } = useAppStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [worksRes, portfoliosRes] = await Promise.all([
          fetch('/api/works'),
          fetch('/api/portfolios'),
        ]);
        
        if (worksRes.ok && portfoliosRes.ok) {
          const worksData = await worksRes.json();
          const portfoliosData = await portfoliosRes.json();
          setWorks(worksData);
          setPortfolios(portfoliosData);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, [setWorks, setPortfolios]);

  return (
    <div className="pt-16 min-h-screen page-transition">
      <div className="text-center py-12 px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          发现优秀插画作品
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          浏览独立插画师和设计师的创意作品，找到您喜欢的风格，预约专属定制服务
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3 mb-6 px-4">
        <button
          className="px-5 py-2 rounded-full text-sm font-medium text-white btn-ripple transition-all"
          style={{ background: 'linear-gradient(135deg, #F472B6 0%, #EC4899 100%)' }}
        >
          全部作品
        </button>
        {portfolios.map((portfolio) => (
          <button
            key={portfolio.id}
            className="px-5 py-2 rounded-full text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:border-pink-300 hover:text-pink-600 transition-all"
          >
            {portfolio.name}
          </button>
        ))}
      </div>

      <PortfolioGrid works={works} />
    </div>
  );
};

export default HomePage;

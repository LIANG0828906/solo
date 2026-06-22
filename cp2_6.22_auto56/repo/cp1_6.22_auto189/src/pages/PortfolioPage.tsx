import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ChevronLeft, Menu, X } from 'lucide-react';
import { Portfolio, Work } from '../dataStore';
import { useAppStore } from '../store';

const PortfolioPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateWork, setPortfolios, portfolios } = useAppStore();
  
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [portfolioRes, worksRes, portfoliosRes] = await Promise.all([
          fetch(`/api/portfolios/${id}`),
          fetch(`/api/works?portfolioId=${id}`),
          fetch('/api/portfolios'),
        ]);
        
        if (portfolioRes.ok && worksRes.ok && portfoliosRes.ok) {
          const portfolioData = await portfolioRes.json();
          const worksData = await worksRes.json();
          const portfoliosData = await portfoliosRes.json();
          setPortfolio(portfolioData);
          setWorks(worksData);
          setPortfolios(portfoliosData);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, setPortfolios]);

  const handleWorkClick = (workId: string) => {
    navigate(`/work/${workId}`);
  };

  const handleLike = async (e: React.MouseEvent, work: Work) => {
    e.stopPropagation();
    
    if (animatingIds.has(work.id)) return;
    
    setAnimatingIds((prev) => new Set(prev).add(work.id));
    
    try {
      const response = await fetch(`/api/works/${work.id}/like`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        const updatedWork = { ...work, likes: data.likes, isLiked: data.isLiked };
        updateWork(updatedWork);
        setWorks((prev) => prev.map((w) => (w.id === work.id ? updatedWork : w)));
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
    
    setTimeout(() => {
      setAnimatingIds((prev) => {
        const next = new Set(prev);
        next.delete(work.id);
        return next;
      });
    }, 400);
  };

  if (!portfolio) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen page-transition">
      <button
        onClick={() => navigate('/')}
        className="fixed top-20 left-6 z-30 hidden md:flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md"
      >
        <ChevronLeft size={20} />
        返回首页
      </button>

      <div className="flex">
        <aside
          className="hidden md:block w-72 flex-shrink-0 p-6 min-h-[calc(100vh-60px)] sticky top-16"
          style={{ backgroundColor: 'var(--background)' }}
        >
          <div className="sticky top-20">
            <img
              src={portfolio.coverImage}
              alt={portfolio.name}
              className="w-full aspect-square object-cover mb-4"
              style={{ borderRadius: '16px' }}
            />
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              {portfolio.name}
            </h1>
            <p className="text-gray-600 mb-3">{portfolio.description}</p>
            <p className="text-sm text-gray-500">
              共 <span style={{ color: 'var(--primary)' }} className="font-semibold">{portfolio.workCount}</span> 件作品
            </p>
            
            <div className="mt-8 space-y-2">
              <h3 className="text-sm font-medium text-gray-500 mb-3">其他画集</h3>
              {portfolios
                .filter((p) => p.id !== portfolio.id)
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/portfolio/${p.id}`)}
                    className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/60 transition-colors text-left"
                  >
                    <img
                      src={p.coverImage}
                      alt={p.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {p.name}
                      </p>
                      <p className="text-xs text-gray-500">{p.workCount}件作品</p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </aside>

        <div className="md:hidden fixed top-16 left-0 right-0 z-30 bg-white border-b border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={portfolio.coverImage}
                alt={portfolio.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div>
                <h1 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  {portfolio.name}
                </h1>
                <p className="text-xs text-gray-500">{portfolio.workCount}件作品</p>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
          
          {mobileMenuOpen && (
            <div className="mt-4 pt-4 border-t border-gray-100 fade-in">
              <h3 className="text-sm font-medium text-gray-500 mb-2">其他画集</h3>
              <div className="space-y-2">
                {portfolios
                  .filter((p) => p.id !== portfolio.id)
                  .map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        navigate(`/portfolio/${p.id}`);
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-pink-50 transition-colors text-left"
                    >
                      <img
                        src={p.coverImage}
                        alt={p.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.workCount}件作品</p>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 p-4 md:p-8 md:pt-8 pt-28">
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            }}
          >
            {works.map((work, index) => (
              <div
                key={work.id}
                className="cursor-pointer group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 list-item-enter"
                style={{
                  height: '280px',
                  animationDelay: `${index * 50}ms`,
                  transform: 'translateY(0)',
                }}
                onClick={() => handleWorkClick(work.id)}
              >
                <div className="relative overflow-hidden h-56">
                  <img
                    src={work.thumbnailUrl}
                    alt={work.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="p-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {work.title}
                  </h3>
                  <button
                    onClick={(e) => handleLike(e, work)}
                    className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <Heart
                      size={16}
                      className={animatingIds.has(work.id) ? 'bounce' : ''}
                      fill={work.isLiked ? '#EF4444' : 'none'}
                      stroke={work.isLiked ? '#EF4444' : 'currentColor'}
                    />
                    <span className="text-xs font-medium">{work.likes}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioPage;

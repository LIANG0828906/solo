import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Heart, Calendar, ArrowLeft, ArrowRight } from 'lucide-react';
import { Work } from '../dataStore';
import { useAppStore } from '../store';

const WorkDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { works, updateWork, setWorks, openAppointmentModal } = useAppStore();
  
  const [work, setWork] = useState<Work | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [workRes, worksRes] = await Promise.all([
          fetch(`/api/works/${id}`),
          fetch('/api/works'),
        ]);
        
        if (workRes.ok && worksRes.ok) {
          const workData = await workRes.json();
          const worksData = await worksRes.json();
          setWork(workData);
          setWorks(worksData);
          const index = worksData.findIndex((w: Work) => w.id === id);
          setCurrentIndex(index >= 0 ? index : 0);
        }
      } catch (error) {
        console.error('Failed to fetch work:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, setWorks]);

  const handleLike = async () => {
    if (!work || isAnimating) return;
    
    setIsAnimating(true);
    
    try {
      const response = await fetch(`/api/works/${work.id}/like`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        const updatedWork = { ...work, likes: data.likes, isLiked: data.isLiked };
        setWork(updatedWork);
        updateWork(updatedWork);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
    
    setTimeout(() => setIsAnimating(false), 400);
  };

  const handleClose = () => {
    navigate('/');
  };

  const handlePrev = () => {
    if (works.length === 0) return;
    const prevIndex = (currentIndex - 1 + works.length) % works.length;
    const prevWork = works[prevIndex];
    navigate(`/work/${prevWork.id}`);
  };

  const handleNext = () => {
    if (works.length === 0) return;
    const nextIndex = (currentIndex + 1) % works.length;
    const nextWork = works[nextIndex];
    navigate(`/work/${nextWork.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') handleClose();
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'ArrowRight') handleNext();
  };

  if (loading) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
      >
        <p className="text-white">加载中...</p>
      </div>
    );
  }

  if (!work) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
        onClick={handleClose}
      >
        <div className="text-white text-center" onClick={(e) => e.stopPropagation()}>
          <p className="mb-4">作品不存在</p>
          <button
            onClick={handleClose}
            className="px-6 py-2 rounded-full text-white"
            style={{ background: 'linear-gradient(135deg, #F472B6 0%, #EC4899 100%)' }}
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto fade-in"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
      onClick={handleClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="min-h-screen flex items-center justify-center p-4 py-8">
        <button
          onClick={handleClose}
          className="fixed top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
        >
          <X size={24} />
        </button>

        {works.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="fixed left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white hidden md:block"
            >
              <ArrowLeft size={24} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="fixed right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white hidden md:block"
            >
              <ArrowRight size={24} />
            </button>
          </>
        )}

        <div
          className="relative max-w-5xl w-full slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-center mb-6">
            <img
              src={work.imageUrl}
              alt={work.title}
              className={`max-w-full transition-opacity duration-300 ease-out ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                maxHeight: '80vh',
                maxWidth: '90vw',
                borderRadius: '12px',
              }}
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full spin" />
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {work.title}
                </h1>
                <p className="text-gray-600">{work.description}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={handleLike}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 hover:border-pink-300 transition-all"
                >
                  <Heart
                    size={20}
                    className={isAnimating ? 'bounce' : ''}
                    fill={work.isLiked ? '#EF4444' : 'none'}
                    stroke={work.isLiked ? '#EF4444' : 'currentColor'}
                  />
                  <span className="font-medium">{work.likes}</span>
                </button>
                <button
                  onClick={() => openAppointmentModal(work.id)}
                  className="px-6 py-2.5 rounded-full font-medium text-white btn-ripple transition-all duration-300 hover:shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #F472B6 0%, #EC4899 100%)',
                  }}
                >
                  预约咨询
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {work.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-sm font-medium rounded-full"
                  style={{
                    backgroundColor: 'var(--secondary)',
                    color: '#9D174D',
                    borderRadius: '9999px',
                    marginRight: '4px',
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
              <Calendar size={16} />
              <span>上传于 {new Date(work.createdAt).toLocaleDateString('zh-CN')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkDetailPage;

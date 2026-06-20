import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Painting } from './types';

function Gallery() {
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [featuredPainting, setFeaturedPainting] = useState<Painting | null>(null);
  const [emotions, setEmotions] = useState<string[]>([]);
  const [selectedEmotion, setSelectedEmotion] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [paintingsRes, featuredRes, emotionsRes] = await Promise.all([
          fetch('/api/paintings'),
          fetch('/api/paintings/featured/today'),
          fetch('/api/paintings/emotions/list')
        ]);

        const paintingsData: Painting[] = await paintingsRes.json();
        const featuredData: Painting = await featuredRes.json();
        const emotionsData: string[] = await emotionsRes.json();

        setPaintings(shuffleArray(paintingsData));
        setFeaturedPainting(featuredData);
        setEmotions(emotionsData);
      } catch (error) {
        console.error('获取数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFilter = async (emotion: string) => {
    setSelectedEmotion(emotion);
    try {
      const url = emotion ? `/api/paintings?emotion=${encodeURIComponent(emotion)}` : '/api/paintings';
      const res = await fetch(url);
      const data: Painting[] = await res.json();
      setPaintings(shuffleArray(data));
    } catch (error) {
      console.error('筛选失败:', error);
    }
  };

  const handleShuffle = () => {
    setPaintings(prev => shuffleArray([...prev]));
  };

  if (loading) {
    return <div className="page-container"><div className="loading-spinner">加载中...</div></div>;
  }

  return (
    <div className="page-container fade-in">
      {featuredPainting && (
        <div className="featured-section">
          <div className="featured-label">✨ 今日精选 ✨</div>
          <div className="featured-card" onClick={() => navigate(`/painting/${featuredPainting.id}`)}>
            <div className="featured-card-inner">
              <img
                src={featuredPainting.imageUrl}
                alt={featuredPainting.title}
                className="featured-card-image"
              />
              <div className="featured-card-content">
                <h2 className="featured-card-title">{featuredPainting.title}</h2>
                <p className="featured-card-artist">{featuredPainting.artist} · {featuredPainting.year}</p>
                <p className="featured-card-description">{featuredPainting.description}</p>
                <span className="featured-card-emotion">{featuredPainting.emotion}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <h1 className="page-title">画廊展厅</h1>

      <div className="toolbar">
        <div className="filter-bar" style={{ marginBottom: 0 }}>
          <button
            className={`filter-btn ${selectedEmotion === '' ? 'active' : ''}`}
            onClick={() => handleFilter('')}
          >
            全部
          </button>
          {emotions.map(emotion => (
            <button
              key={emotion}
              className={`filter-btn ${selectedEmotion === emotion ? 'active' : ''}`}
              onClick={() => handleFilter(emotion)}
            >
              {emotion}
            </button>
          ))}
        </div>
        <button className="shuffle-btn" onClick={handleShuffle}>
          <span>🔀</span>
          随机洗牌
        </button>
      </div>

      <div className="gallery-grid">
        {paintings.map(painting => (
          <div
            key={painting.id}
            className="painting-card"
            onClick={() => navigate(`/painting/${painting.id}`)}
          >
            <img
              src={painting.imageUrl}
              alt={painting.title}
              className="painting-card-image"
              loading="lazy"
            />
            <div className="painting-card-info">
              <h3 className="painting-card-title">{painting.title}</h3>
              <p className="painting-card-artist">{painting.artist}</p>
              <span className="painting-card-emotion">{painting.emotion}</span>
            </div>
          </div>
        ))}
      </div>

      {paintings.length === 0 && (
        <div className="favorites-empty">
          <div className="favorites-empty-icon">🎨</div>
          <p className="favorites-empty-text">暂无符合条件的画作</p>
        </div>
      )}
    </div>
  );
}

export default Gallery;

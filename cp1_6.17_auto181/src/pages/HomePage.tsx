import { useNavigate } from 'react-router-dom';
import GalleryPage from './GalleryPage';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <section className="hero-section">
        <h1 className="hero-title">墨韵纸境</h1>
        <p className="hero-subtitle">在线书法创作与点评平台，传承千年笔墨之美</p>
        <button 
          className="hero-btn"
          onClick={() => navigate('/create')}
        >
          开始创作
        </button>
      </section>
      
      <section style={{ padding: '40px 24px' }}>
        <h2 className="section-title">精选作品</h2>
        <GalleryPage limit={6} showTitle={false} />
      </section>
    </div>
  );
}

export default HomePage;

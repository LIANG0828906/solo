import { useEffect, useState } from 'react';
import { AppConfig, Blessing, DataManager } from '../utils/DataManager';
import CountdownTimer from './CountdownTimer';
import GuestForm from './GuestForm';
import MessageWall from './MessageWall';
import './HomePage.css';

interface Props {
  blessings: Blessing[];
  onBlessingAdded: () => void;
}

function HomePage({ blessings, onBlessingAdded }: Props) {
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    setConfig(DataManager.getConfig());
  }, []);

  if (!config) return null;

  const heroStyle: React.CSSProperties = config.heroImage
    ? { backgroundImage: `url(${config.heroImage})` }
    : {
        background:
          'linear-gradient(135deg, #ffd1dc 0%, #ffe8ec 30%, #fff1d6 70%, #f7d794 100%)'
      };

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-image" style={heroStyle}>
          {!config.heroImage && (
            <div className="hero-placeholder">
              <div className="hero-flowers" aria-hidden="true">🌸 💐 🌷 💒 🌹 🌺</div>
            </div>
          )}
        </div>
        <h1 className="hero-title">
          <span className="hero-name">{config.groomName}</span>
          <span className="hero-and">&amp;</span>
          <span className="hero-name">{config.brideName}</span>
        </h1>
        <div className="hero-subtitle">的婚礼 · WEDDING CEREMONY</div>
        <div className="hero-date">{config.weddingDate}</div>
      </section>

      <section className="action-section">
        <div className="action-left">
          <CountdownTimer weddingDate={config.weddingDate} />
        </div>
        <div className="action-right">
          <GuestForm onSubmitted={onBlessingAdded} />
        </div>
      </section>

      <section className="wall-section">
        <MessageWall blessings={blessings} onLiked={onBlessingAdded} />
      </section>

      <footer className="home-footer">
        💕 感谢每一位到场祝福的亲友 · 愿所有美好如期而至 💕
      </footer>
    </div>
  );
}

export default HomePage;

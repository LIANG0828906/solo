import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { instrumentsApi, Instrument } from '../api';

const INSTRUMENT_EMOJIS: Record<string, string> = {
  classical_guitar: '🎸',
  acoustic_guitar: '🎸',
  violin: '🎻',
  ukulele: '🎵',
};

const HomePage = () => {
  const navigate = useNavigate();
  const [instruments, setInstruments] = useState<Instrument[]>([]);

  useEffect(() => {
    instrumentsApi.getInstruments().then(setInstruments).catch(console.error);
  }, []);

  return (
    <div className="home-page">
      <h1 className="page-title">手工乐器定制</h1>
      <p className="page-subtitle">
        选择您心仪的乐器，搭配精选木材，打造独一无二的专属之声
      </p>

      <div className="instrument-grid">
        {instruments.map(inst => (
          <div
            key={inst.id}
            className="instrument-card"
            onClick={() => navigate(`/customize/${inst.type}`)}
          >
            <div className="instrument-emoji">
              {INSTRUMENT_EMOJIS[inst.type] || '🎵'}
            </div>
            <h3>{inst.name}</h3>
            <p>{inst.description}</p>
            <div className="instrument-price">
              ¥{inst.basePrice.toLocaleString()} 起
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;

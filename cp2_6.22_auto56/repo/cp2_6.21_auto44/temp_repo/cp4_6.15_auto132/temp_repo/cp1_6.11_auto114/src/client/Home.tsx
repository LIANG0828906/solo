import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import InstrumentCard from './InstrumentCard';
import { Instrument } from './types';

const Home: React.FC = () => {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');

  useEffect(() => {
    const fetchInstruments = async () => {
      try {
        setLoading(true);
        const url = category
          ? `/api/instruments?category=${category}`
          : '/api/instruments';
        const response = await axios.get(url);
        setInstruments(response.data);
      } catch (error) {
        console.error('Failed to fetch instruments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInstruments();
  }, [category]);

  return (
    <div>
      <Navbar onCategoryChange={setCategory} currentCategory={category} />

      <div
        style={{
          padding: '40px 24px',
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            marginBottom: '40px',
            animation: 'fadeIn 0.6s ease-out',
          }}
        >
          <h1
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#5C3317',
              marginBottom: '12px',
              textShadow: '2px 2px 4px rgba(92, 51, 23, 0.1)',
            }}
          >
            🎵 乐器跳蚤市场
          </h1>
          <p style={{ fontSize: '16px', color: '#8B4513', maxWidth: '600px', margin: '0 auto' }}>
            发现、租赁、交换优质乐器。每一件乐器都有它的故事，等待与你相遇。
          </p>
        </div>

        {loading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, 280px)',
              gap: '24px',
              justifyContent: 'center',
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="skeleton"
                style={{
                  width: '280px',
                  height: '400px',
                  borderRadius: '12px',
                }}
              />
            ))}
          </div>
        ) : instruments.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: '#8B4513',
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎸</div>
            <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>暂无乐器</h3>
            <p>该分类下暂时没有乐器，快来发布第一件吧！</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, 280px)',
              gap: '24px',
              justifyContent: 'center',
            }}
          >
            {instruments.map((instrument, index) => (
              <InstrumentCard
                key={instrument.id}
                instrument={instrument}
                index={index}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(auto-fill, 280px)"] {
            grid-template-columns: 1fr !important;
            justify-items: center;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;

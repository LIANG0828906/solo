import React from 'react';
import { useLetterStore, type Letter } from '../store/letterStore';
import { EnvelopePreview } from './EnvelopePreview';

export const EnvelopeGrid: React.FC = () => {
  const { letters, startAnimation } = useLetterStore();

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const getSummary = (content: string, maxLength: number = 20) => {
    const firstLine = content.split('\n').find((line) => line.trim()) || '';
    return firstLine.length > maxLength 
      ? firstLine.substring(0, maxLength) + '...' 
      : firstLine || '无内容';
  };

  if (letters.length === 0) {
    return (
      <div className="envelope-grid-section">
        <h2 className="section-title">我的信件</h2>
        <div className="empty-state">
          <p>还没有信件，写一封吧～</p>
        </div>
        <style>{`
          .envelope-grid-section {
            background: #FAF0E6;
            padding: 48px 24px;
            margin-top: 32px;
          }
          .section-title {
            font-family: 'Playfair Display', serif;
            font-size: 28px;
            font-weight: 600;
            color: #4A3B32;
            text-align: center;
            margin: 0 0 32px 0;
          }
          .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #A09080;
            font-family: 'Inter', sans-serif;
            font-size: 16px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="envelope-grid-section">
      <h2 className="section-title">我的信件</h2>
      <div className="envelope-grid">
        {letters.map((letter: Letter) => (
          <div
            key={letter.id}
            className="envelope-card"
            onClick={() => startAnimation(letter.id)}
          >
            <div className="card-envelope-wrapper">
              <EnvelopePreview style={letter.envelopeStyle} size="medium" />
            </div>
            <div className="card-info">
              <p className="card-summary">{getSummary(letter.content)}</p>
              <p className="card-date">{formatDate(letter.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .envelope-grid-section {
          background: #FAF0E6;
          padding: 48px 24px;
          margin-top: 32px;
        }

        .section-title {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: 600;
          color: #4A3B32;
          text-align: center;
          margin: 0 0 32px 0;
        }

        .envelope-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 20px;
          max-width: 1100px;
          margin: 0 auto;
        }

        .envelope-card {
          background: #FDF5E6;
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          width: 180px;
          height: 240px;
          box-sizing: border-box;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        .envelope-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }

        .card-envelope-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100px;
          width: 100%;
        }

        .card-info {
          width: 100%;
          text-align: center;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .card-summary {
          font-size: 14px;
          color: #7F8C8D;
          margin: 0;
          font-family: 'Inter', sans-serif;
          line-height: 1.5;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .card-date {
          font-size: 12px;
          color: #A09080;
          margin: 0;
          font-family: 'Inter', sans-serif;
        }

        @media (max-width: 1024px) {
          .envelope-grid {
            grid-template-columns: repeat(4, 1fr);
            max-width: 880px;
          }
        }

        @media (max-width: 768px) {
          .envelope-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            max-width: 400px;
          }

          .envelope-card {
            width: 100%;
            height: auto;
            min-height: 200px;
          }
        }
      `}</style>
    </div>
  );
};

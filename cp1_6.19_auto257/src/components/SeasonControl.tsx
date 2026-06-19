import React, { useState } from 'react';
import { useSeasonStore } from '../store/seasonStore';
import { Season, seasonNames, seasonThemeColors } from '../utils/colorPalette';

const SeasonControl: React.FC = () => {
  const { currentSeason, setSeason } = useSeasonStore();
  const [pressedButton, setPressedButton] = useState<Season | null>(null);

  const handleSeasonClick = (season: Season) => {
    setPressedButton(season);
    setSeason(season);
    setTimeout(() => setPressedButton(null), 200);
  };

  const seasons = [Season.SPRING, Season.SUMMER, Season.AUTUMN, Season.WINTER];

  return (
    <div className="season-control">
      {seasons.map((season) => {
        const isSelected = currentSeason === season;
        const isPressed = pressedButton === season;
        
        return (
          <button
            key={season}
            className={`season-button ${isSelected ? 'selected' : ''}`}
            onClick={() => handleSeasonClick(season)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
              backgroundColor: isSelected ? seasonThemeColors[season] : 'rgba(224, 224, 224, 0.5)',
              color: isSelected ? '#1A1A2E' : '#EAEAEA',
              transform: isPressed ? 'scale(0.95)' : 'scale(1)',
              boxShadow: isSelected ? `0 0 15px ${seasonThemeColors[season]}` : 'none'
            }}
          >
            {seasonNames[season]}
          </button>
        );
      })}

      <style>{`
        .season-control {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 30px 20px;
          background: rgba(26, 26, 46, 0.8);
          backdrop-filter: blur(10px);
          border-radius: 0 16px 16px 0;
          z-index: 100;
        }

        .season-button:hover {
          transform: scale(1.1);
        }

        .season-button.selected {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 15px currentColor;
          }
          50% {
            box-shadow: 0 0 25px currentColor;
          }
        }

        @media (max-width: 1000px) {
          .season-control {
            flex-direction: row;
            padding: 20px 30px;
            border-radius: 0 0 16px 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default SeasonControl;

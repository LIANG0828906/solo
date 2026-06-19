import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeatherStore } from './weatherStore';
import { ParticleLayer } from './ParticleLayer';
import { InfoPanel } from './InfoPanel';
import type { WeatherType } from './types';

const weatherGradients: Record<WeatherType, { from: string; to: string }> = {
  sunny: { from: '#F0E6D3', to: '#FFF8E7' },
  rainy: { from: '#1A2A3A', to: '#3A4A5A' },
  snowy: { from: '#D0D8E0', to: '#F5F5F5' },
  foggy: { from: '#B0B0B0', to: '#E0E0E0' },
};

export const WeatherApp = () => {
  const { cities, currentCityId, getCurrentWeather, getCurrentCity, setCurrentCity, isTransitioning } = useWeatherStore();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [contentWidth, setContentWidth] = useState(0);

  const currentWeather = getCurrentWeather();
  const currentCity = getCurrentCity();
  const weatherType = currentWeather?.weatherType || 'sunny';
  const gradient = weatherGradients[weatherType];

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
      setContentWidth(window.innerWidth - 80);
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleCityClick = (cityId: string) => {
    if (cityId !== currentCityId) {
      setCurrentCity(cityId);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={weatherType}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
            zIndex: 0,
          }}
        />
      </AnimatePresence>

      <div
        style={{
          width: 80,
          height: '100%',
          background: 'rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 5,
          borderRight: '1px solid rgba(102, 102, 102, 0.2)',
        }}
      >
        {cities.map((city) => (
          <CityItem
            key={city.id}
            name={city.nameZh}
            isActive={city.id === currentCityId}
            onClick={() => handleCityClick(city.id)}
            weatherType={weatherType}
          />
        ))}
      </div>

      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {contentWidth > 0 && dimensions.height > 0 && (
        <ParticleLayer
          weatherType={weatherType}
          width={contentWidth}
          height={dimensions.height}
          isTransitioning={isTransitioning}
        />
      )}

        {currentWeather && currentCity && (
          <InfoPanel
            cityName={currentCity.nameZh}
            temperature={currentWeather.temperature}
            humidity={currentWeather.humidity}
            windSpeed={currentWeather.windSpeed}
            feelsLike={currentWeather.feelsLike}
          />
        )}

        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: 0,
            right: 0,
            height: 1,
            background: 'transparent',
            zIndex: 3,
          }}
        >
          <svg
            width="100%"
            height="20"
            style={{
              position: 'absolute',
            bottom: 0,
              left: 0,
            }}
            preserveAspectRatio="none"
          >
            <path
              d="M0,15 Q25%,5 50%,15 T100%,15"
              stroke="#666"
              strokeWidth="1"
              fill="none"
              strokeDasharray="1 1"
              opacity="0.5"
            />
            <path
              d="M0,10 Q30%,18 60%,8 T100%,10"
              stroke="#666"
              strokeWidth="0.5"
              fill="none"
              strokeDasharray="1 1"
              opacity="0.3"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

interface CityItemProps {
  name: string;
  isActive: boolean;
  onClick: () => void;
  weatherType: WeatherType;
}

const CityItem = ({ name, isActive, onClick, weatherType }: CityItemProps) => {
  const isDark = weatherType === 'rainy' || weatherType === 'foggy';
  const textColor = isDark ? '#fff' : '#333';
  const activeColor = '#C0392B';

  return (
    <motion.div
      whileHover={{ scale: 1 }}
      onClick={onClick}
      style={{
        position: 'relative',
        padding: '20px 0',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
      }}
      initial={false}
    >
      {isActive && (
        <motion.div
          layoutId="active-indicator"
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 3,
            height: '60%',
            backgroundColor: activeColor,
            borderRadius: '0 2px 2px 0',
          }}
        />
      )}

      <motion.div
        animate={{
          opacity: isActive ? 1 : 0.6,
          fontSize: isActive ? 18 : 16,
        }}
        whileHover={{
          opacity: 1,
          fontSize: 18,
        }}
        transition={{ duration: 0.2 }}
        style={{
          color: textColor,
          writingMode: 'vertical-rl',
          textOrientation: 'upright',
          letterSpacing: 4,
          fontFamily: '"KaiTi", "STKaiti", "楷体", serif',
          fontWeight: isActive ? 600 : 400,
        }}
      >
        {name}
      </motion.div>
    </motion.div>
  );
};

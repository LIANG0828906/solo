import { motion } from 'framer-motion'
import { useWeatherStore, WeatherType, weatherColors, weatherLabels } from '../store/weatherStore'

const weatherTypes: WeatherType[] = ['sunny', 'cloudy', 'rainy', 'snowy']

const weatherIcons: Record<WeatherType, string> = {
  sunny: '☀',
  cloudy: '☁',
  rainy: '🌧',
  snowy: '❄',
}

export default function ControlPanel() {
  const currentWeather = useWeatherStore((s) => s.currentWeather)
  const particleDensity = useWeatherStore((s) => s.particleDensity)
  const windSpeed = useWeatherStore((s) => s.windSpeed)
  const setWeather = useWeatherStore((s) => s.setWeather)
  const setDensity = useWeatherStore((s) => s.setDensity)
  const setWindSpeed = useWeatherStore((s) => s.setWindSpeed)

  const accentColor = weatherColors[currentWeather]

  return (
    <motion.div
      className="control-panel"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        width: '30%',
        minWidth: '320px',
        padding: '32px 28px',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        color: '#E0E0E0',
        fontFamily: "'Noto Sans SC', 'Orbitron', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
          opacity: 0.6,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: 700,
            letterSpacing: '2px',
            fontFamily: "'Orbitron', sans-serif",
            background: `linear-gradient(135deg, #fff 0%, ${accentColor} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          天气控制台
        </h2>
        <p
          style={{
            margin: '8px 0 0 0',
            fontSize: '12px',
            color: 'rgba(224, 224, 224, 0.5)',
            letterSpacing: '1px',
          }}
        >
          WEATHER CONTROL PANEL
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        <div
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'rgba(224, 224, 224, 0.8)',
            letterSpacing: '1px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>天气模式</span>
          <span
            style={{
              fontSize: '11px',
              color: accentColor,
              fontFamily: "'Orbitron', sans-serif",
            }}
          >
            {weatherLabels[currentWeather].toUpperCase()}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          {weatherTypes.map((weather, index) => (
            <motion.button
              key={weather}
              onClick={() => setWeather(weather)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1, duration: 0.3 }}
              style={{
                position: 'relative',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: currentWeather === weather
                  ? `2px solid ${weatherColors[weather]}`
                  : '2px solid rgba(255, 255, 255, 0.2)',
                background: currentWeather === weather
                  ? `radial-gradient(circle, ${weatherColors[weather]}33 0%, transparent 70%)`
                  : 'rgba(255, 255, 255, 0.05)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                transition: 'all 0.3s ease',
                boxShadow: currentWeather === weather
                  ? `0 0 20px ${weatherColors[weather]}66, inset 0 0 15px ${weatherColors[weather]}22`
                  : 'none',
              }}
            >
              {currentWeather === weather && (
                <motion.div
                  layoutId="weatherGlow"
                  style={{
                    position: 'absolute',
                    inset: '-4px',
                    borderRadius: '50%',
                    border: `1px solid ${weatherColors[weather]}`,
                    opacity: 0.5,
                  }}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1 }}>
                {weatherIcons[weather]}
              </span>
            </motion.button>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'rgba(224, 224, 224, 0.4)',
          }}
        >
          {weatherTypes.map((weather) => (
            <span key={weather} style={{ width: '48px', textAlign: 'center' }}>
              {weatherLabels[weather]}
            </span>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'rgba(224, 224, 224, 0.8)',
              letterSpacing: '1px',
            }}
          >
            粒子密度
          </span>
          <motion.span
            key={particleDensity}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: accentColor,
              fontFamily: "'Orbitron', sans-serif",
              minWidth: '50px',
              textAlign: 'right',
            }}
          >
            {particleDensity}
          </motion.span>
        </div>

        <div style={{ position: 'relative', height: '24px' }}>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '6px',
              transform: 'translateY(-50%)',
              borderRadius: '3px',
              background: `linear-gradient(to right, #333 ${((particleDensity - 500) / 2500) * 100}%, ${accentColor} ${((particleDensity - 500) / 2500) * 100}%)`,
            }}
          />
          <input
            type="range"
            min={500}
            max={3000}
            step={50}
            value={particleDensity}
            onChange={(e) => setDensity(Number(e.target.value))}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer',
              margin: 0,
            }}
          />
          <motion.div
            style={{
              position: 'absolute',
              top: '50%',
              left: `calc(${((particleDensity - 500) / 2500) * 100}% - 10px)`,
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#fff',
              transform: 'translateY(-50%)',
              boxShadow: `0 0 10px ${accentColor}aa, 0 2px 8px rgba(0,0,0,0.3)`,
              pointerEvents: 'none',
            }}
            whileHover={{ scale: 1.2 }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'rgba(224, 224, 224, 0.4)',
          }}
        >
          <span>500</span>
          <span>3000</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'rgba(224, 224, 224, 0.8)',
              letterSpacing: '1px',
            }}
          >
            风速
          </span>
          <motion.span
            key={windSpeed}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: accentColor,
              fontFamily: "'Orbitron', sans-serif",
              minWidth: '50px',
              textAlign: 'right',
            }}
          >
            {windSpeed.toFixed(1)}
          </motion.span>
        </div>

        <div style={{ position: 'relative', height: '24px' }}>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '6px',
              transform: 'translateY(-50%)',
              borderRadius: '3px',
              background: `linear-gradient(to right, #333 ${(windSpeed / 10) * 100}%, ${accentColor} ${(windSpeed / 10) * 100}%)`,
            }}
          />
          <input
            type="range"
            min={0}
            max={10}
            step={0.1}
            value={windSpeed}
            onChange={(e) => setWindSpeed(Number(e.target.value))}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer',
              margin: 0,
            }}
          />
          <motion.div
            style={{
              position: 'absolute',
              top: '50%',
              left: `calc(${(windSpeed / 10) * 100}% - 10px)`,
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#fff',
              transform: 'translateY(-50%)',
              boxShadow: `0 0 10px ${accentColor}aa, 0 2px 8px rgba(0,0,0,0.3)`,
              pointerEvents: 'none',
            }}
            whileHover={{ scale: 1.2 }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'rgba(224, 224, 224, 0.4)',
          }}
        >
          <span>静风</span>
          <span>强风</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        style={{
          marginTop: 'auto',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: accentColor,
            boxShadow: `0 0 8px ${accentColor}`,
          }}
        />
        <span
          style={{
            fontSize: '11px',
            color: 'rgba(224, 224, 224, 0.5)',
            letterSpacing: '1px',
          }}
        >
          系统运行中 · LIVE
        </span>
      </motion.div>

      <style>{`
        @media (max-width: 768px) {
          .control-panel {
            width: 100% !important;
            min-width: unset !important;
            height: 120px !important;
            padding: 12px 20px !important;
            flex-direction: row !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
            border-radius: 16px 16px 0 0 !important;
          }
          .control-panel h2 {
            font-size: 14px !important;
          }
          .control-panel > div:nth-child(2) {
            order: 1;
            width: 100%;
          }
          .control-panel > div:nth-child(3) {
            order: 2;
            flex: 1;
            min-width: 45%;
          }
          .control-panel > div:nth-child(4) {
            order: 3;
            flex: 1;
            min-width: 45%;
          }
          .control-panel > div:last-child {
            display: none !important;
          }
        }
      `}</style>
    </motion.div>
  )
}

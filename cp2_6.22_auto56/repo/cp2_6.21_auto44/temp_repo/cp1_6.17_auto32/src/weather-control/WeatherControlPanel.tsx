import { useState } from 'react';
import {
  useWeatherStore,
  Weather,
  WEATHER_LABELS,
  WEATHER_BUTTON_COLORS
} from './weatherStore';
import { playWeatherSound } from '../audio-manager/ambientSound';

const weatherList: Weather[] = [
  Weather.Sunny,
  Weather.Rainy,
  Weather.Snowy,
  Weather.Stormy
];

export default function WeatherControlPanel() {
  const currentWeather = useWeatherStore((s) => s.weather);
  const setWeather = useWeatherStore((s) => s.setWeather);
  const [pressedBtn, setPressedBtn] = useState<Weather | null>(null);

  const handleClick = (w: Weather) => {
    setWeather(w);
    playWeatherSound(w);
    setPressedBtn(w);
    setTimeout(() => setPressedBtn(null), 150);
  };

  return (
    <div className="weather-panel">
      {weatherList.map((w) => {
        const isActive = currentWeather === w;
        const isPressed = pressedBtn === w;
        const btnColor = WEATHER_BUTTON_COLORS[w];
        const textColor =
          w === Weather.Snowy ? '#2C2C2C' : '#FFFFFF';
        return (
          <button
            key={w}
            className={`weather-btn ${isPressed ? 'btn-press' : ''}`}
            style={{
              backgroundColor: isActive ? btnColor : 'rgba(255,255,255,0.1)',
              color: isActive ? textColor : '#FFFFFF',
              border: isActive ? `2px solid ${btnColor}` : '2px solid transparent'
            }}
            onClick={() => handleClick(w)}
          >
            {WEATHER_LABELS[w]}
          </button>
        );
      })}
    </div>
  );
}

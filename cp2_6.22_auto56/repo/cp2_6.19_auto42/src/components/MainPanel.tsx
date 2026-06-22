import { useRef, useEffect, useState, useCallback } from 'react';
import SoundMixer from './SoundMixer';
import { useAppStore, WeatherData as WeatherDataType, SoundTrack } from '../store/useAppStore';
import { getWeather, PRESET_CITIES } from '../modules/weather/weatherService';
import { AudioEngine } from '../modules/audio/audioEngine';
import { easeOutCubic, lerp } from '../utils/helpers';

const WEATHER_ICONS: Record<WeatherDataType['weatherType'], string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  windy: '💨',
  foggy: '🌫️',
};

export default function MainPanel() {
  const {
    tracks,
    currentCity,
    weatherData,
    isPlaying,
    presets,
    isFlipping,
    spectrumPeak,
    setTrackVolume,
    toggleMute,
    reorderTracks,
    resetTracks,
    setCurrentCity,
    setWeatherData,
    setPlaying,
    savePreset,
    loadPreset,
    setIsFlipping,
    setSpectrumPeak,
  } = useAppStore();

  const audioEngineRef = useRef<AudioEngine>(new AudioEngine());
  const spectrumCanvasRef = useRef<HTMLCanvasElement>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const waveformAnimRef = useRef<number | null>(null);
  const presetAnimRef = useRef<number | null>(null);

  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [citySearchOpen, setCitySearchOpen] = useState<boolean>(false);
  const [citySearchQuery, setCitySearchQuery] = useState<string>('');
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  const animateTracksToPreset = useCallback((targetTracks: SoundTrack[]) => {
    if (presetAnimRef.current !== null) {
      cancelAnimationFrame(presetAnimRef.current);
      presetAnimRef.current = null;
    }

    const startValues: Record<string, number> = {};
    tracks.forEach((track) => {
      startValues[track.id] = track.volume;
    });

    const duration = 800;
    const startTime = performance.now();
    let localAnimFrameId: number | null = null;

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      targetTracks.forEach((targetTrack) => {
        const startValue = startValues[targetTrack.id] ?? 0;
        const currentValue = lerp(startValue, targetTrack.volume, eased);
        setTrackVolume(targetTrack.id, currentValue);
      });

      if (progress < 1) {
        localAnimFrameId = requestAnimationFrame(step);
        presetAnimRef.current = localAnimFrameId;
      } else {
        presetAnimRef.current = null;
        localAnimFrameId = null;
      }
    };

    localAnimFrameId = requestAnimationFrame(step);
    presetAnimRef.current = localAnimFrameId;
  }, [tracks, setTrackVolume]);

  const handleCitySelect = useCallback(async (city: string) => {
    setCitySearchOpen(false);
    setCitySearchQuery('');
    if (city === currentCity) return;

    setCurrentCity(city);
    setIsFlipping(true);

    const data = await getWeather(city);

    setTimeout(() => {
      setWeatherData(data);
      setIsFlipping(false);
    }, 400);
  }, [currentCity, setCurrentCity, setIsFlipping, setWeatherData]);

  const handleTogglePlay = useCallback(async () => {
    const engine = audioEngineRef.current;

    if (!isPlaying) {
      engine.init();
      tracks.forEach((track, index) => {
        engine.createTrack(track.type, index);
        engine.setVolume(track.type, track.volume);
      });
      await engine.start();
      setPlaying(true);
    } else {
      engine.stop();
      setPlaying(false);
    }
  }, [isPlaying, tracks, setPlaying]);

  const handleSavePreset = useCallback(() => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
    const name = `${currentCity}${timeStr}`;
    savePreset(name);
  }, [currentCity, savePreset]);

  const handleLoadPreset = useCallback((id: string) => {
    const preset = loadPreset(id);
    if (preset) {
      setSelectedPreset(id);
      animateTracksToPreset(preset.tracks);
      setCurrentCity(preset.city);
      getWeather(preset.city).then((data) => {
        setWeatherData(data);
      });
    }
  }, [loadPreset, animateTracksToPreset, setCurrentCity, setWeatherData]);

  const filteredCities = PRESET_CITIES.filter((city) =>
    city.toLowerCase().includes(citySearchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node)) {
        setCitySearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const engine = audioEngineRef.current;
    if (!engine.isInitialized()) return;

    tracks.forEach((track) => {
      engine.setVolume(track.type, track.volume);
    });
  }, [tracks]);

  useEffect(() => {
    const engine = audioEngineRef.current;
    if (!engine.isInitialized()) return;

    tracks.forEach((track, index) => {
      const panValue = tracks.length === 1 ? 0 : (index / (tracks.length - 1)) * 1.2 - 0.6;
      engine.setPan(track.type, Math.max(-0.6, Math.min(0.6, panValue)));
    });
  }, [tracks]);

  useEffect(() => {
    if (!isPlaying) return;

    const canvas = spectrumCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const engine = audioEngineRef.current;
    const analyser = engine.getAnalyser();
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let localAnimFrameId: number | null = null;

    const draw = () => {
      localAnimFrameId = requestAnimationFrame(draw);
      animFrameRef.current = localAnimFrameId;

      analyser.getByteFrequencyData(dataArray);

      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const barCount = 64;
      const barWidth = width / barCount - 2;

      let peak = 0;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * bufferLength);
        const value = dataArray[dataIndex];
        const normalized = value / 255;
        const barHeight = normalized * height;

        if (normalized > peak) {
          peak = normalized;
        }

        const hue = 180 + (i / barCount) * 90;
        const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
        gradient.addColorStop(0, `hsla(${hue}, 80%, 60%, 0.9)`);
        gradient.addColorStop(1, `hsla(${hue + 60}, 80%, 40%, 0.7)`);

        ctx.fillStyle = gradient;
        const x = i * (barWidth + 2);
        const y = height - barHeight;
        const w = barWidth;
        const h = barHeight;
        const r = 3;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
      }

      setSpectrumPeak(peak);
    };

    draw();

    return () => {
      if (localAnimFrameId !== null) {
        cancelAnimationFrame(localAnimFrameId);
      }
      if (animFrameRef.current !== 0) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, setSpectrumPeak]);

  useEffect(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!isPlaying) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barCount = 32;
      const barWidth = canvas.width / barCount - 2;
      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + 2);
        const barHeight = 4;
        const y = canvas.height / 2 - barHeight / 2;
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
        gradient.addColorStop(1, 'rgba(168, 85, 247, 0.3)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
      }
      return;
    }

    const engine = audioEngineRef.current;
    const analyser = engine.getAnalyser();
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let localWaveformId: number | null = null;

    const drawWaveform = () => {
      localWaveformId = requestAnimationFrame(drawWaveform);
      waveformAnimRef.current = localWaveformId;

      analyser.getByteFrequencyData(dataArray);

      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const barCount = 32;
      const barWidth = width / barCount - 2;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * bufferLength);
        const value = dataArray[dataIndex];
        const normalized = value / 255;
        const barHeight = Math.max(normalized * height * 0.8, 4);
        const x = i * (barWidth + 2);
        const y = height / 2 - barHeight / 2;
        const hue = 180 + (i / barCount) * 90;
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, `hsla(${hue}, 80%, 60%, 0.9)`);
        gradient.addColorStop(1, `hsla(${hue + 60}, 80%, 40%, 0.7)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        const r = 2;
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + barWidth - r, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
        ctx.lineTo(x + barWidth, y + barHeight - r);
        ctx.quadraticCurveTo(x + barWidth, y + barHeight, x + barWidth - r, y + barHeight);
        ctx.lineTo(x + r, y + barHeight);
        ctx.quadraticCurveTo(x, y + barHeight, x, y + barHeight - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
      }
    };

    drawWaveform();

    return () => {
      if (localWaveformId !== null) {
        cancelAnimationFrame(localWaveformId);
      }
      if (waveformAnimRef.current !== null) {
        cancelAnimationFrame(waveformAnimRef.current);
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    if (weatherData === null) {
      getWeather(currentCity).then((data) => {
        setWeatherData(data);
      });
    }
  }, []);

  useEffect(() => {
    return () => {
      if (presetAnimRef.current !== null) {
        cancelAnimationFrame(presetAnimRef.current);
      }
      if (animFrameRef.current !== 0) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (waveformAnimRef.current !== null) {
        cancelAnimationFrame(waveformAnimRef.current);
      }
      audioEngineRef.current.stop();
    };
  }, []);

  const renderWeatherCard = () => {
    if (!weatherData) {
      return (
        <div className={`glass-card weather-card ${isFlipping ? 'flip' : ''}`}>
          <div className="weather-loading">加载中...</div>
        </div>
      );
    }

    return (
      <div className={`glass-card weather-card ${isFlipping ? 'flip' : ''}`}>
        <div className="weather-icon">{WEATHER_ICONS[weatherData.weatherType]}</div>
        <div className="weather-temp">{weatherData.temperature}℃</div>
        <div className="weather-city">{weatherData.city}</div>
        <div className="weather-details">
          <span>湿度 {weatherData.humidity}%</span>
          <span>风速 {weatherData.windSpeed}km/h</span>
        </div>
      </div>
    );
  };

  return (
    <div className="main-panel">
      <div className="panel-content">
        <div className="left-panel">
          <div className="city-selector" ref={cityDropdownRef}>
            <div
              className="city-search-input"
              onClick={() => setCitySearchOpen(!citySearchOpen)}
            >
              <span className="city-search-value">{currentCity}</span>
              <span className="city-search-arrow">{citySearchOpen ? '▲' : '▼'}</span>
            </div>
            {citySearchOpen && (
              <div className="city-dropdown">
                <input
                  type="text"
                  className="city-search-field"
                  placeholder="搜索城市..."
                  value={citySearchQuery}
                  onChange={(e) => setCitySearchQuery(e.target.value)}
                  autoFocus
                />
                <div className="city-list">
                  {filteredCities.length > 0 ? (
                    filteredCities.map((city) => (
                      <div
                        key={city}
                        className={`city-option ${city === currentCity ? 'active' : ''}`}
                        onClick={() => handleCitySelect(city)}
                      >
                        {city}
                      </div>
                    ))
                  ) : (
                    <div className="city-option disabled">未找到匹配城市</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {renderWeatherCard()}

          <div className="play-control">
            <div className={`play-ring ${isPlaying ? 'ring-spin' : ''}`}>
              <svg viewBox="0 0 100 100" className="ring-svg">
                <defs>
                  <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#A855F7" />
                  </linearGradient>
                </defs>
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#ringGradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="283"
                  strokeDashoffset="0"
                />
              </svg>
              <button
                className={`play-button ${isPlaying ? 'playing' : ''}`}
                onClick={handleTogglePlay}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
            </div>
          </div>

          <div className="waveform-container">
            <canvas
              ref={waveformCanvasRef}
              className="waveform-canvas"
              width={240}
              height={40}
            />
          </div>

          <div className="action-buttons">
            <button className="save-preset-btn" onClick={handleSavePreset}>
              保存预设
            </button>
            <button className="reset-btn" onClick={resetTracks}>
              重置混音
            </button>
          </div>
        </div>

        <div className="center-panel">
          <SoundMixer
            tracks={tracks}
            isPlaying={isPlaying}
            spectrumPeak={spectrumPeak}
            onVolumeChange={setTrackVolume}
            onToggleMute={toggleMute}
            onReorder={reorderTracks}
          />
        </div>

        <div className="right-panel">
          <canvas
            ref={spectrumCanvasRef}
            className="spectrum-canvas"
            width={300}
            height={200}
          />
        </div>
      </div>

      <div className="presets-container">
        <div className="preset-scroll">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className={`glass-card preset-card ${selectedPreset === preset.id ? 'selected' : ''}`}
              onClick={() => handleLoadPreset(preset.id)}
            >
              <div className="preset-city">{preset.city}</div>
              <div className="preset-name">{preset.name}</div>
              <div className="preset-tracks">
                {preset.tracks.map((track) => (
                  <div
                    key={track.id}
                    className="preset-track-bar"
                    style={{
                      height: `${track.volume}%`,
                      backgroundColor: track.color,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

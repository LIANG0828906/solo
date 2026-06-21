import { useSimulationStore } from '@/store/useSimulationStore';
import { calcSunPosition, calcLocalTime, calcSunriseSunset } from '@/utils/geoCalculator';

function formatTime(totalMinutes: number): string {
  const minutes = Math.round(((totalMinutes % 1440) + 1440) % 1440);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export default function ControlPanel() {
  const {
    time,
    selectedLat,
    selectedLon,
    isPlaying,
    seasonPreset,
    sunDeclination,
    setTime,
    togglePlay,
    resetCamera,
    setSeasonPreset,
  } = useSimulationStore();

  const sunPosition = calcSunPosition(time, sunDeclination);
  const hasSelection = selectedLat !== null && selectedLon !== null;

  let localTime = '';
  let sunrise = '';
  let sunset = '';

  if (hasSelection) {
    localTime = calcLocalTime(selectedLat!, selectedLon!, sunPosition.lon);
    const sunData = calcSunriseSunset(selectedLat!, selectedLon!, time, sunDeclination);
    sunrise = sunData.sunrise;
    sunset = sunData.sunset;
  }

  return (
    <>
      <style>{`
        @keyframes controlPulse {
          0% { box-shadow: 0 0 0 0 rgba(102, 204, 255, 0.6); }
          100% { box-shadow: 0 0 0 12px rgba(102, 204, 255, 0); }
        }
        .control-panel {
          position: fixed;
          right: 0;
          top: 0;
          width: 280px;
          height: 100vh;
          background: rgba(10, 14, 26, 0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-left: 2px solid rgba(255, 255, 255, 0.1);
          padding: 20px;
          box-sizing: border-box;
          color: #ffffff;
          overflow-y: auto;
          z-index: 10;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        @media (max-width: 1024px) {
          .control-panel {
            top: auto;
            bottom: 0;
            height: 120px;
            width: 100%;
            border-left: none;
            border-top: 2px solid rgba(255, 255, 255, 0.1);
            overflow-x: auto;
            overflow-y: hidden;
            display: flex;
            flex-direction: row;
            gap: 16px;
          }
          .control-panel > * {
            flex-shrink: 0;
          }
        }
        .panel-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 0;
          white-space: nowrap;
        }
        .section-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 6px;
          display: block;
        }
        .time-display {
          font-family: 'Courier New', Consolas, Monaco, monospace;
          font-size: 18px;
          color: #88ff88;
          text-shadow: 0 0 8px rgba(136, 255, 136, 0.5);
          margin-bottom: 10px;
        }
        .time-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 4px;
          background: linear-gradient(to right, #2a3a4a, #3a4a5a);
          border-radius: 2px;
          outline: none;
          cursor: pointer;
        }
        .time-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #66ccff;
          border: none;
          cursor: pointer;
          transition: box-shadow 0.3s ease;
        }
        .time-slider::-webkit-slider-thumb:active {
          animation: controlPulse
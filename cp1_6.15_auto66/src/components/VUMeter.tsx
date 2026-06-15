import '../styles.css';
import React, { useEffect, useRef } from 'react';

export interface VUMeterProps {
  levelL: number;
  levelR: number;
  minDb?: number;
  maxDb?: number;
  width?: number;
  height?: number;
  showLabels?: boolean;
}

export const VUMeter: React.FC<VUMeterProps> = ({
  levelL,
  levelR,
  minDb = -60,
  maxDb = 0,
  width = 16,
  height = 150,
  showLabels = true,
}) => {
  const peakLRef = useRef<number>(0);
  const peakRRef = useRef<number>(0);
  const peakTimerLRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peakTimerRRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [peakL, setPeakL] = React.useState<number>(0);
  const [peakR, setPeakR] = React.useState<number>(0);

  const dbToPercent = (db: number): number => {
    const clamped = Math.min(maxDb, Math.max(minDb, db));
    return ((clamped - minDb) / (maxDb - minDb)) * 100;
  };

  const percentL = dbToPercent(levelL);
  const percentR = dbToPercent(levelR);

  useEffect(() => {
    if (percentL > peakLRef.current) {
      peakLRef.current = percentL;
      setPeakL(percentL);
      if (peakTimerLRef.current) {
        clearTimeout(peakTimerLRef.current);
      }
      peakTimerLRef.current = setTimeout(() => {
        peakLRef.current = percentL;
        setPeakL(percentL);
      }, 200);
    }
  }, [percentL]);

  useEffect(() => {
    if (percentR > peakRRef.current) {
      peakRRef.current = percentR;
      setPeakR(percentR);
      if (peakTimerRRef.current) {
        clearTimeout(peakTimerRRef.current);
      }
      peakTimerRRef.current = setTimeout(() => {
        peakRRef.current = percentR;
        setPeakR(percentR);
      }, 200);
    }
  }, [percentR]);

  useEffect(() => {
    return () => {
      if (peakTimerLRef.current) clearTimeout(peakTimerLRef.current);
      if (peakTimerRRef.current) clearTimeout(peakTimerRRef.current);
    };
  }, []);

  const gradientBackground =
    'linear-gradient(to top, #22c55e 0%, #22c55e 90%, #eab308 90%, #eab308 95%, #ef4444 95%, #ef4444 100%)';

  const barContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: '4px',
    height: `${height}px`,
  };

  const barStyle: React.CSSProperties = {
    position: 'relative',
    width: `${width}px`,
    height: '100%',
    backgroundColor: '#0a0a14',
    borderRadius: '4px',
    overflow: 'hidden',
  };

  const fillStyle = (percent: number): React.CSSProperties => ({
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: `${percent}%`,
    background: gradientBackground,
    transition: 'height 0.05s linear',
  });

  const peakStyle = (peak: number): React.CSSProperties => ({
    position: 'absolute',
    bottom: `calc(${peak}% - 2px)`,
    left: 0,
    width: '100%',
    height: '2px',
    backgroundColor: '#ffffff',
    transition: 'bottom 0.08s ease-out',
  });

  const labelContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: '4px',
    fontSize: '11px',
    color: '#a0a0b8',
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: `${width * 2 + 4}px`,
  };

  return (
    <div style={containerStyle}>
      <div style={barContainerStyle}>
        <div style={barStyle}>
          <div style={fillStyle(percentL)} />
          <div style={peakStyle(peakL)} />
        </div>
        <div style={barStyle}>
          <div style={fillStyle(percentR)} />
          <div style={peakStyle(peakR)} />
        </div>
      </div>
      {showLabels && (
        <div style={labelContainerStyle}>
          <span>L</span>
          <span>R</span>
        </div>
      )}
    </div>
  );
};

export default VUMeter;

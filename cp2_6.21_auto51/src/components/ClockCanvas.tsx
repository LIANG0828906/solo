import React, { useRef, useEffect, useState, useCallback, useMemo, forwardRef } from 'react';
import {
  calculateHandAngles,
  generateTickData,
  angleFromPointer,
  snapMinuteToFive,
  convertAngleToTime,
} from '@/modules/clockEngine';
import type { Time, TickStyle } from '@/store/clockStore';

interface ClockCanvasProps {
  time: Time;
  dialColor: string;
  tickStyle: TickStyle;
  showNumbers: boolean;
  onTimeChange: (time: Time) => void;
}

type DraggingType = 'hour' | 'minute' | null;

const CENTER_X = 250;
const CENTER_Y = 250;

export const ClockCanvas = forwardRef<HTMLDivElement, ClockCanvasProps>(
  ({ time, dialColor, tickStyle, showNumbers, onTimeChange }, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<DraggingType>(null);

  const { hourAngle, minuteAngle } = useMemo(
    () => calculateHandAngles(time),
    [time]
  );

  const tickData = useMemo(() => generateTickData(tickStyle), [tickStyle]);

  const handlePointerDown = useCallback((type: DraggingType) => {
    return (e: React.PointerEvent) => {
      e.preventDefault();
      setDragging(type);
      (e.target as Element).setPointerCapture(e.pointerId);
    };
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || !svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = 500 / rect.width;
      const scaleY = 500 / rect.height;
      const pointerX = (e.clientX - rect.left) * scaleX;
      const pointerY = (e.clientY - rect.top) * scaleY;

      const angle = angleFromPointer(CENTER_X, CENTER_Y, pointerX, pointerY);

      if (dragging === 'minute') {
        let newMinute = Math.round(angle / 6) % 60;
        if (newMinute < 0) newMinute += 60;

        const currentHour = time.hour;
        const diff = newMinute - time.minute;

        if (diff >= 30 && time.minute >= 30 && newMinute < 30) {
          const newHour = (currentHour + 1) % 24;
          onTimeChange({ hour: newHour, minute: newMinute });
        } else if (diff <= -30 && time.minute < 30 && newMinute >= 30) {
          const newHour = (currentHour - 1 + 24) % 24;
          onTimeChange({ hour: newHour, minute: newMinute });
        } else {
          onTimeChange({ hour: currentHour, minute: newMinute });
        }
      } else if (dragging === 'hour') {
        const newTime = convertAngleToTime({ hourAngle: angle, minuteAngle: minuteAngle });
        let hour = newTime.hour;
        if (hour === 12) hour = 0;
        const snappedMinute = snapMinuteToFive(newTime.minute);

        if (time.hour >= 12) {
          hour = hour + 12;
          if (hour === 24) hour = 12;
        }
        onTimeChange({ hour, minute: snappedMinute });
      }
    },
    [dragging, time, minuteAngle, onTimeChange]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (dragging) {
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    }
    setDragging(null);
  }, [dragging]);

  useEffect(() => {
    const handleGlobalUp = () => setDragging(null);
    window.addEventListener('pointerup', handleGlobalUp);
    return () => window.removeEventListener('pointerup', handleGlobalUp);
  }, []);

  const formatTime = (t: Time) => {
    const h = t.hour.toString().padStart(2, '0');
    const m = t.minute.toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  return (
    <div ref={ref} className="clock-wrapper">
      <svg
        ref={svgRef}
        viewBox="0 0 500 500"
        className="clock-svg"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <defs>
          <linearGradient id="handGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#666" />
            <stop offset="100%" stopColor="#333" />
          </linearGradient>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
          </filter>
        </defs>

        <circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r="235"
          fill={dialColor}
          stroke="#d0ccc4"
          strokeWidth="1"
        />

        {tickData.map((tick, idx) => {
          const isHourTick = tick.type === 'hour';
          const angle = (idx / 60) * 2 * Math.PI - Math.PI / 2;

          if (tickStyle === 'dots') {
            return (
              <circle
                key={idx}
                cx={tick.x}
                cy={tick.y}
                r={isHourTick ? 4 : 1.5}
                fill={isHourTick ? '#333' : '#999'}
              />
            );
          }

          if (tickStyle === 'lines') {
            const innerR = isHourTick ? 200 : 210;
            const x1 = CENTER_X + innerR * Math.cos(angle);
            const y1 = CENTER_Y + innerR * Math.sin(angle);
            return (
              <line
                key={idx}
                x1={x1}
                y1={y1}
                x2={tick.x}
                y2={tick.y}
                stroke={isHourTick ? '#333' : '#999'}
                strokeWidth={isHourTick ? 3 : 1}
                strokeLinecap="round"
              />
            );
          }

          if ((tickStyle === 'roman' || tickStyle === 'arabic') && isHourTick && tick.label) {
            const labelR = 185;
            const labelX = CENTER_X + labelR * Math.cos(angle);
            const labelY = CENTER_Y + labelR * Math.sin(angle);
            return (
              <g key={idx}>
                {showNumbers && (
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={tickStyle === 'roman' ? 18 : 22}
                    fontWeight="600"
                    fill="#333"
                    fontFamily="serif"
                  >
                    {tick.label}
                  </text>
                )}
                {!showNumbers && (
                  <>
                    {(() => {
                      const innerR = 200;
                      const x1 = CENTER_X + innerR * Math.cos(angle);
                      const y1 = CENTER_Y + innerR * Math.sin(angle);
                      return (
                        <line
                          x1={x1}
                          y1={y1}
                          x2={tick.x}
                          y2={tick.y}
                          stroke="#333"
                          strokeWidth={3}
                          strokeLinecap="round"
                        />
                      );
                    })()}
                  </>
                )}
              </g>
            );
          }

          if ((tickStyle === 'roman' || tickStyle === 'arabic') && !isHourTick) {
            const innerR = 210;
            const x1 = CENTER_X + innerR * Math.cos(angle);
            const y1 = CENTER_Y + innerR * Math.sin(angle);
            return (
              <line
                key={idx}
                x1={x1}
                y1={y1}
                x2={tick.x}
                y2={tick.y}
                stroke="#bbb"
                strokeWidth={1}
                strokeLinecap="round"
              />
            );
          }

          return null;
        })}

        <g
          transform={`rotate(${hourAngle}, ${CENTER_X}, ${CENTER_Y})`}
          style={{ cursor: dragging ? 'grabbing' : 'grab', transition: dragging ? 'none' : 'transform 0.15s ease-out' }}
          onPointerDown={handlePointerDown('hour')}
          filter="url(#shadow)"
        >
          <rect
            x={CENTER_X - 2}
            y={CENTER_Y - 130}
            width="4"
            height="130"
            rx="2"
            fill="url(#handGradient)"
          />
        </g>

        <g
          transform={`rotate(${minuteAngle}, ${CENTER_X}, ${CENTER_Y})`}
          style={{ cursor: dragging ? 'grabbing' : 'grab', transition: dragging ? 'none' : 'transform 0.08s ease-out' }}
          onPointerDown={handlePointerDown('minute')}
          filter="url(#shadow)"
        >
          <rect
            x={CENTER_X - 1}
            y={CENTER_Y - 170}
            width="2"
            height="170"
            rx="1"
            fill="url(#handGradient)"
          />
        </g>

        <circle cx={CENTER_X} cy={CENTER_Y} r="8" fill="#d4a373" />
        <circle cx={CENTER_X} cy={CENTER_Y} r="4" fill="#b8860b" />
      </svg>

      <div className="clock-info">
        <div className="digital-time">{formatTime(time)}</div>
        <div className="angle-info">
          时针：{hourAngle.toFixed(1)}° 分针：{minuteAngle.toFixed(1)}°
        </div>
      </div>
    </div>
  );
  }
);

ClockCanvas.displayName = 'ClockCanvas';

export default ClockCanvas;

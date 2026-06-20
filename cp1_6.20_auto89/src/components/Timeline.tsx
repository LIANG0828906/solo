import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Keyframe, EasingType, CubicBezierParams } from '../types';
import { easingFunctions, createCustomBezierEasing } from '../utils/easing';

interface TimelineProps {
  keyframes: Keyframe[];
  currentTime: number;
  selectedKeyframeId: string | null;
  onKeyframeClick: (id: string) => void;
  onKeyframeDrag: (id: string, newTime: number) => void;
  onTimeClick: (time: number) => void;
  easingType: EasingType;
  bezierParams?: CubicBezierParams;
}

export const Timeline: React.FC<TimelineProps> = ({
  keyframes,
  currentTime,
  selectedKeyframeId,
  onKeyframeClick,
  onKeyframeDrag,
  onTimeClick,
  easingType,
  bezierParams,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [hoveredKeyframe, setHoveredKeyframe] = useState<Keyframe | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const padding = { top: 40, right: 40, bottom: 60, left: 60 };
  const chartWidth = dimensions.width - padding.left - padding.right;
  const chartHeight = dimensions.height - padding.top - padding.bottom;

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const timeToX = useCallback((time: number) => {
    return padding.left + (time / 100) * chartWidth;
  }, [chartWidth, padding.left]);

  const valueToY = useCallback((value: number) => {
    return padding.top + chartHeight - value * chartHeight;
  }, [chartHeight, padding.top]);

  const getEasingFn = useCallback(() => {
    if (easingType === 'cubic-bezier' && bezierParams) {
      return createCustomBezierEasing(bezierParams);
    }
    return easingFunctions[easingType];
  }, [easingType, bezierParams]);

  const sortedFrames = [...keyframes].sort((a, b) => a.time - b.time);

  const generateCurvePath = useCallback(() => {
    if (sortedFrames.length < 2) return '';

    const easingFn = getEasingFn();
    let path = '';

    for (let i = 0; i < sortedFrames.length - 1; i++) {
      const startFrame = sortedFrames[i];
      const endFrame = sortedFrames[i + 1];

      const x1 = timeToX(startFrame.time);
      const y1 = valueToY(i / (sortedFrames.length - 1));
      const x2 = timeToX(endFrame.time);
      const y2 = valueToY((i + 1) / (sortedFrames.length - 1));

      const dx = x2 - x1;
      const controlX1 = x1 + dx * 0.25;
      const controlX2 = x1 + dx * 0.75;

      const easedY1 = y1 + (y2 - y1) * easingFn(0.25);
      const easedY2 = y1 + (y2 - y1) * easingFn(0.75);

      if (i === 0) {
        path += `M ${x1} ${y1}`;
      }

      path += ` C ${controlX1} ${easedY1}, ${controlX2} ${easedY2}, ${x2} ${y2}`;
    }

    return path;
  }, [sortedFrames, timeToX, valueToY, getEasingFn]);

  const handleMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDraggingId(id);
    onKeyframeClick(id);
  }, [onKeyframeClick]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingId || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = Math.max(0, Math.min(100, ((x - padding.left) / chartWidth) * 100));
    const roundedTime = Math.round(time * 10) / 10;

    onKeyframeDrag(draggingId, roundedTime);
  }, [draggingId, chartWidth, padding.left, onKeyframeDrag]);

  const handleMouseUp = useCallback(() => {
    setDraggingId(null);
  }, []);

  useEffect(() => {
    if (draggingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingId, handleMouseMove, handleMouseUp]);

  const handleSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = Math.max(0, Math.min(100, ((x - padding.left) / chartWidth) * 100));
    const roundedTime = Math.round(time * 10) / 10;

    onTimeClick(roundedTime);
  }, [chartWidth, padding.left, onTimeClick]);

  const handleKeyframeHover = useCallback((e: React.MouseEvent, frame: Keyframe | null) => {
    if (frame) {
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        setTooltipPos({
          x: e.clientX - rect.left + 16,
          y: e.clientY - rect.top - 16,
        });
      }
    }
    setHoveredKeyframe(frame);
  }, []);

  const renderGridLines = () => {
    const lines = [];
    
    for (let i = 0; i <= 10; i++) {
      const x = timeToX(i * 10);
      lines.push(
        <line
          key={`v-${i}`}
          x1={x}
          y1={padding.top}
          x2={x}
          y2={padding.top + chartHeight}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1"
        />
      );
      lines.push(
        <text
          key={`label-v-${i}`}
          x={x}
          y={padding.top + chartHeight + 20}
          textAnchor="middle"
          className="axis-label"
        >
          {i * 10}%
        </text>
      );
    }

    for (let i = 0; i <= 4; i++) {
      const y = valueToY(i / 4);
      lines.push(
        <line
          key={`h-${i}`}
          x1={padding.left}
          y1={y}
          x2={padding.left + chartWidth}
          y2={y}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1"
        />
      );
    }

    return lines;
  };

  const curvePath = generateCurvePath();

  return (
    <div className="timeline-container">
      <div className="timeline-svg-container" ref={containerRef}>
        <svg
          ref={svgRef}
          className="timeline-svg"
          onClick={handleSvgClick}
        >
          {renderGridLines()}
          
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + chartHeight}
            className="axis-line"
          />
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={padding.left + chartWidth}
            y2={padding.top + chartHeight}
            className="axis-line"
          />

          {curvePath && (
            <path
              d={curvePath}
              fill="none"
              stroke="rgba(233, 69, 96, 0.6)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}

          {sortedFrames.map((frame, index) => {
            const cx = timeToX(frame.time);
            const cy = valueToY(index / Math.max(1, sortedFrames.length - 1));
            const isSelected = frame.id === selectedKeyframeId;
            const dotSize = isSelected ? 18 : 14;

            return (
              <g key={frame.id}>
                {isSelected && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={dotSize + 8}
                    fill="none"
                    stroke={frame.color}
                    strokeWidth="2"
                    opacity="0.4"
                    className="selected-ring"
                  />
                )}
                <circle
                  cx={cx}
                  cy={cy}
                  r={dotSize}
                  fill={frame.color}
                  stroke="white"
                  strokeWidth="2"
                  className={`keyframe-dot ${isSelected ? 'selected' : ''}`}
                  style={{ color: frame.color }}
                  onMouseDown={(e) => handleMouseDown(e, frame.id)}
                  onMouseEnter={(e) => handleKeyframeHover(e, frame)}
                  onMouseLeave={(e) => handleKeyframeHover(e, null)}
                />
                <text
                  x={cx}
                  y={cy - dotSize - 8}
                  textAnchor="middle"
                  fill={frame.color}
                  fontSize="11"
                  fontWeight="600"
                >
                  {frame.time}%
                </text>
              </g>
            );
          })}
        </svg>

        <div
          className="scanline"
          style={{
            left: `${timeToX(currentTime)}px`,
          }}
        >
          <div className="scanline-label">{currentTime.toFixed(1)}%</div>
        </div>

        {hoveredKeyframe && (
          <div
            className="tooltip"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
            }}
          >
            <div className="tooltip-title">Keyframe {hoveredKeyframe.time}%</div>
            {hoveredKeyframe.properties.map((prop, idx) => (
              <div key={idx} className="tooltip-property">
                <span>{prop.name}:</span>
                <span>{prop.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

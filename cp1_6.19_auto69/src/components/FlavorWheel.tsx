import React, { useState, useRef, useCallback, useMemo } from 'react';
import { flavorWheelData, FlavorTag, FlavorCategory } from '../data/flavorWheel';

interface FlavorWheelProps {
  selectedTags: string[];
  onSelect: (tagId: string) => void;
}

const polarToCartesian = (
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
): { x: number; y: number } => {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
};

const describeArc = (
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string => {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M', start.x, start.y,
    'A', r, r, 0, largeArcFlag, 0, end.x, end.y,
  ].join(' ');
};

const describeSector = (
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number
): string => {
  const outerStart = polarToCartesian(cx, cy, outerR, endAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, startAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M', outerStart.x, outerStart.y,
    'A', outerR, outerR, 0, largeArcFlag, 0, outerEnd.x, outerEnd.y,
    'L', innerStart.x, innerStart.y,
    'A', innerR, innerR, 0, largeArcFlag, 1, innerEnd.x, innerEnd.y,
    'Z',
  ].join(' ');
};

const FlavorWheel: React.FC<FlavorWheelProps> = ({ selectedTags, onSelect }) => {
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartAngle, setDragStartAngle] = useState(0);
  const [startRotation, setStartRotation] = useState(0);
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);
  const wheelRef = useRef<SVGSVGElement>(null);

  const size = 400;
  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = 180;
  const innerRadius = 60;
  const midRadius = (outerRadius + innerRadius) / 2;

  const totalCategories = flavorWheelData.length;
  const categoryAngle = 360 / totalCategories;

  const getAngleFromEvent = useCallback(
    (clientX: number, clientY: number): number => {
      if (!wheelRef.current) return 0;
      const rect = wheelRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      return (Math.atan2(clientY - centerY, clientX - centerX) * 180) / Math.PI;
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      setDragStartAngle(getAngleFromEvent(e.clientX, e.clientY));
      setStartRotation(rotation);
    },
    [getAngleFromEvent, rotation]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const currentAngle = getAngleFromEvent(e.clientX, e.clientY);
      const deltaAngle = currentAngle - dragStartAngle;
      setRotation(startRotation + deltaAngle * 0.5);
    },
    [isDragging, dragStartAngle, startRotation, getAngleFromEvent]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTagClick = useCallback(
    (tagId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isDragging) {
        onSelect(tagId);
      }
    },
    [onSelect, isDragging]
  );

  const sectors = useMemo(() => {
    return flavorWheelData.flatMap((category: FlavorCategory, catIndex: number) => {
      const catStartAngle = catIndex * categoryAngle;
      const tagAngle = categoryAngle / category.tags.length;

      const outerSectors = category.tags.map((tag: FlavorTag, tagIndex: number) => {
        const tagStartAngle = catStartAngle + tagIndex * tagAngle;
        const tagEndAngle = tagStartAngle + tagAngle;
        const midAngle = tagStartAngle + tagAngle / 2;
        const labelPos = polarToCartesian(cx, cy, outerRadius - 30, midAngle);
        const isSelected = selectedTags.includes(tag.id);
        const isHovered = hoveredTag === tag.id;

        return (
          <g key={tag.id}>
            <path
              d={describeSector(cx, cy, midRadius, outerRadius, tagStartAngle, tagEndAngle)}
              fill={tag.color}
              stroke="#FAF3E0"
              strokeWidth="2"
              className={`flavor-sector ${isSelected ? 'selected' : ''}`}
              onClick={(e) => handleTagClick(tag.id, e)}
              onMouseEnter={() => setHoveredTag(tag.id)}
              onMouseLeave={() => setHoveredTag(null)}
              style={{
                filter: isSelected
                  ? 'drop-shadow(0 0 8px #FFD700)'
                  : isHovered
                  ? 'brightness(1.15)'
                  : 'none',
                opacity: isHovered && !isSelected ? 0.95 : 1,
              }}
            />
            {isSelected && (
              <path
                d={describeSector(cx, cy, midRadius, outerRadius, tagStartAngle, tagEndAngle)}
                fill="none"
                stroke="#FFD700"
                strokeWidth="3"
                style={{ pointerEvents: 'none', transition: 'all 0.3s ease' }}
              />
            )}
            <text
              x={labelPos.x}
              y={labelPos.y}
              className="flavor-label"
              style={{
                fill: isSelected ? '#3A2C1F' : '#3A2C1F',
                fontWeight: isSelected ? 700 : 500,
              }}
            >
              {tag.name}
            </text>
          </g>
        );
      });

      const catMidAngle = catStartAngle + categoryAngle / 2;
      const innerLabelPos = polarToCartesian(cx, cy, innerRadius + 25, catMidAngle);

      return (
        <g key={category.id}>
          <path
            d={describeSector(cx, cy, innerRadius, midRadius, catStartAngle, catStartAngle + categoryAngle)}
            fill={category.color}
            stroke="#FAF3E0"
            strokeWidth="2"
            opacity="0.85"
            className="flavor-sector"
          />
          <text
            x={innerLabelPos.x}
            y={innerLabelPos.y}
            className="flavor-label"
            style={{ fontSize: '13px', fontWeight: 600, fill: '#3A2C1F' }}
          >
            {category.name}
          </text>
          {outerSectors}
        </g>
      );
    });
  }, [selectedTags, hoveredTag, cx, cy, outerRadius, innerRadius, midRadius, categoryAngle, handleTagClick]);

  return (
    <div className="flavor-wheel-container">
      <div
        className="flavor-wheel-wrapper"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <svg
          ref={wheelRef}
          viewBox={`0 0 ${size} ${size}`}
          className="flavor-wheel"
          style={{
            transform: `rotate(${rotation}deg)`,
            width: '100%',
            maxWidth: '400px',
            height: 'auto',
          }}
        >
          <circle cx={cx} cy={cy} r={outerRadius + 8} fill="#FAF3E0" stroke="#D3B89F" strokeWidth="1" />
          <circle cx={cx} cy={cy} r={innerRadius - 2} fill="#FFF8EE" stroke="#D3B89F" strokeWidth="1" />
          {sectors}
          <circle cx={cx} cy={cy} r={18} fill="#6B4226" />
          <text
            x={cx}
            y={cy + 5}
            textAnchor="middle"
            fill="#FFF8EE"
            fontSize="12"
            fontWeight="600"
            style={{ pointerEvents: 'none' }}
          >
            风味
          </text>
        </svg>
      </div>
      <p style={{ marginTop: '16px', fontSize: '12px', color: '#8B7355' }}>
        拖拽旋转轮盘 · 点击选择风味标签
      </p>
    </div>
  );
};

export default FlavorWheel;

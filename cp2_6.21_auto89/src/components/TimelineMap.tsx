import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Stage, Layer, Circle, Line, Text, Rect as KonvaRect, Group } from 'react-konva';
import Konva from 'konva';
import { TimelineNode } from '../utils/dataTransform';
import { EventData, MemberData } from '../services/api';

interface TimelineMapProps {
  nodes: TimelineNode[];
  rawEvents: EventData[];
  rawMembers: MemberData[];
  minYear: number;
  maxYear: number;
  width: number;
  height: number;
  onSelectEvent: (event: EventData | null) => void;
}

interface EventTooltip {
  visible: boolean;
  x: number;
  y: number;
  event: EventData | null;
  memberName: string;
}

const TimelineMap: React.FC<TimelineMapProps> = ({
  nodes,
  rawEvents,
  rawMembers,
  minYear,
  maxYear,
  width,
  height,
  onSelectEvent,
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const [yearScale, setYearScale] = useState(80);
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [tooltip, setTooltip] = useState<EventTooltip>({
    visible: false,
    x: 0,
    y: 0,
    event: null,
    memberName: '',
  });

  const paddingLeft = 60;
  const paddingTop = 50;
  const paddingBottom = 40;
  const paddingRight = 30;

  const visibleWidth = Math.max(0, width - paddingLeft - paddingRight);
  const visibleStartYear = minYear + (Math.max(0, -offsetX) / yearScale);
  const visibleEndYear = visibleStartYear + (visibleWidth / yearScale);

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const oldScale = yearScale;
    const scaleBy = 1.15;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    let newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    newScale = Math.max(50, Math.min(200, newScale));

    const relX = pointer.x - paddingLeft;
    const yearAtPointer = (relX - offsetX) / oldScale + minYear;
    const newOffset = relX - (yearAtPointer - minYear) * newScale;

    setYearScale(newScale);
    setOffsetX(newOffset);
  }, [yearScale, offsetX]);

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      setIsDragging(true);
      setDragStartX(e.evt.clientX - offsetX);
    }
  }, [offsetX]);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isDragging) {
      let newOffset = e.evt.clientX - dragStartX;
      const maxOffset = 0;
      const totalWidth = (maxYear - minYear) * yearScale;
      const minOffset = Math.min(0, visibleWidth - totalWidth);
      newOffset = Math.max(minOffset, Math.min(maxOffset, newOffset));
      setOffsetX(newOffset);
    }
  }, [isDragging, dragStartX, yearScale, visibleWidth, minYear, maxYear]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const currentYear = 2024;
  const years: number[] = [];
  const yearStep = yearScale < 60 ? 5 : yearScale < 100 ? 2 : 1;
  for (let y = minYear; y <= maxYear; y += yearStep) {
    years.push(y);
  }

  const memberMap: Record<string, MemberData> = {};
  rawMembers.forEach((m) => {
    memberMap[m.id] = m;
  });

  const renderYearTicks = () => {
    const ticks = [];
    const baseY = height - paddingBottom;

    for (const year of years) {
      const x = paddingLeft + (year - minYear) * yearScale + offsetX;
      if (x < paddingLeft - 30 || x > width - paddingRight + 30) continue;

      const isCurrentYear = year === currentYear;
      ticks.push(
        <Line
          key={`tick-${year}`}
          points={[x, paddingTop - 10, x, baseY]}
          stroke={isCurrentYear ? '#F1C40F' : '#95A5A6'}
          strokeWidth={isCurrentYear ? 2 : 0.5}
          opacity={0.6}
        />
      );
      ticks.push(
        <Text
          key={`label-${year}`}
          x={x - 15}
          y={baseY + 5}
          text={String(year)}
          fontSize={11}
          fill={isCurrentYear ? '#F1C40F' : '#95A5A6'}
          fontStyle={isCurrentYear ? 'bold' : 'normal'}
        />
      );
    }
    return ticks;
  };

  const renderTimelineAxis = () => {
    const baseY = height - paddingBottom;
    return (
      <Line
        points={[paddingLeft, baseY, width - paddingRight, baseY]}
        stroke="#95A5A6"
        strokeWidth={2}
      />
    );
  };

  const renderLifeBars = () => {
    const bars: React.ReactNode[] = [];
    const rowHeight = 30;
    const rowPadding = 8;

    const sortedMembers = [...rawMembers].sort((a, b) => a.birth_year - b.birth_year);

    sortedMembers.forEach((member, idx) => {
      const y = paddingTop + idx * (rowHeight + rowPadding);
      if (y > height - paddingBottom - rowHeight) return;

      const startX = paddingLeft + (member.birth_year - minYear) * yearScale + offsetX;
      const endYear = member.death_year || 2024;
      const endX = paddingLeft + (endYear - minYear) * yearScale + offsetX;

      if (endX < paddingLeft || startX > width - paddingRight) return;

      const actualStartX = Math.max(paddingLeft, startX);
      const actualEndX = Math.min(width - paddingRight, endX);
      const actualWidth = Math.max(2, actualEndX - actualStartX);

      const genderColors: Record<string, string> = {
        男: '#4A90D9',
        女: '#E67E86',
      };
      const barColor = genderColors[member.gender || ''] || '#95A5A6';

      bars.push(
        <KonvaRect
          key={`lifebar-${member.id}`}
          x={actualStartX}
          y={y}
          width={actualWidth}
          height={rowHeight}
          fill={barColor}
          opacity={0.15}
          cornerRadius={4}
        />
      );
      if (actualStartX >= paddingLeft && actualStartX <= width - paddingRight) {
        bars.push(
          <Text
            key={`label-member-${member.id}`}
            x={Math.max(paddingLeft, actualStartX + 4)}
            y={y + rowHeight / 2 - 7}
            text={member.name}
            fontSize={11}
            fill="#ECF0F1"
          />
        );
      }
    });
    return bars;
  };

  const renderEventNodes = () => {
    return nodes.map((node) => {
      const x = paddingLeft + (node.year - minYear) * yearScale + offsetX;
      if (x < paddingLeft - 20 || x > width - paddingRight + 20) return null;

      const rawEvent = rawEvents.find((e) => e.id === node.id);

      return (
        <Group
          key={node.id}
          x={x}
          y={node.y}
          onClick={() => rawEvent && onSelectEvent(rawEvent)}
          onTap={() => rawEvent && onSelectEvent(rawEvent)}
          onMouseEnter={(e) => {
            const stageEl = e.target.getStage();
            if (stageEl) stageEl.container().style.cursor = 'pointer';
            const stage = stageRef.current;
            if (stage && rawEvent) {
              const absPos = stage.getPointerPosition();
              if (absPos) {
                setTooltip({
                  visible: true,
                  x: absPos.x + 15,
                  y: absPos.y - 30,
                  event: rawEvent,
                  memberName: node.memberName,
                });
              }
            }
          }}
          onMouseLeave={(e) => {
            const stageEl = e.target.getStage();
            if (stageEl) stageEl.container().style.cursor = 'default';
            setTooltip((t) => ({ ...t, visible: false }));
          }}
        >
          <Circle
            radius={7}
            fill={node.color}
            stroke="#2C3E50"
            strokeWidth={2}
            shadowColor="rgba(0,0,0,0.3)"
            shadowBlur={4}
            shadowOffset={{ x: 1, y: 1 }}
            shadowOpacity={0.5}
          />
          <Circle
            radius={3}
            fill="#fff"
            opacity={0.8}
          />
        </Group>
      );
    });
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div className="viewport-info">
        年份: {Math.round(visibleStartYear)} - {Math.round(visibleEndYear)} | 缩放: {Math.round(yearScale)}px/年
      </div>
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ background: 'linear-gradient(180deg, #233240 0%, #1E2B38 100%)', cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <Layer>
          {renderYearTicks()}
          {renderTimelineAxis()}
          {renderLifeBars()}
          {renderEventNodes()}
        </Layer>
      </Stage>
      {tooltip.visible && tooltip.event && (
        <div
          className="tooltip-container"
          style={{ left: tooltip.x, top: tooltip.y, pointerEvents: 'none', minWidth: 180 }}
        >
          <div className="tooltip-name" style={{ color: '#F1C40F' }}>
            {tooltip.event.name} ({tooltip.event.year})
          </div>
          <div className="tooltip-detail">人物: {tooltip.memberName}</div>
          <div className="tooltip-detail">类型: {tooltip.event.event_type}</div>
          {tooltip.event.description && (
            <div className="tooltip-detail" style={{ marginTop: 4 }}>
              {tooltip.event.description}
            </div>
          )}
        </div>
      )}
      <div style={{ position: 'absolute', bottom: 10, right: 10, fontSize: 11, color: '#95A5A6' }}>
        滚轮缩放 | 拖拽平移 | 点击事件查看详情
      </div>
    </div>
  );
};

export default TimelineMap;

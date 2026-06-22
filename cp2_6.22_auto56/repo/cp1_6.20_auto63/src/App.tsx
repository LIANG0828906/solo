import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Scene3D from './Scene3D';
import ControlPanel from './ControlPanel';
import { Room, FilterRange, AnimationState } from './types';

const App: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRange, setFilterRange] = useState<FilterRange>({ min: 0, max: 50 });
  const [animationState, setAnimationState] = useState<AnimationState>({
    isPlaying: false,
    currentHour: 12,
    speed: 1,
  });
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);
  const [selectedRoomIds, setSelectedRoomIds] = useState<Set<string>>(new Set());
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const lastFrameTime = useRef(0);

  useEffect(() => {
    fetch('/api/building')
      .then((res) => res.json())
      .then((data) => {
        setRooms(data.rooms || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!animationState.isPlaying) return;

    let animId: number;
    const tick = (time: number) => {
      if (lastFrameTime.current === 0) {
        lastFrameTime.current = time;
      }
      const delta = (time - lastFrameTime.current) / 1000;
      lastFrameTime.current = time;

      const hourDelta = (delta / 4) * animationState.speed;
      setAnimationState((prev) => {
        let nextHour = prev.currentHour + hourDelta;
        if (nextHour >= 24) nextHour -= 24;
        return { ...prev, currentHour: nextHour };
      });

      animId = requestAnimationFrame(tick);
    };
    lastFrameTime.current = 0;
    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      lastFrameTime.current = 0;
    };
  }, [animationState.isPlaying, animationState.speed]);

  const filteredCount = useMemo(() => {
    return rooms.filter((room) => {
      const temp = room.temperatures[Math.floor(animationState.currentHour)] ?? room.temperature;
      return temp >= filterRange.min && temp <= filterRange.max;
    }).length;
  }, [rooms, filterRange, animationState.currentHour]);

  const handleHoverRoom = useCallback((id: string | null) => {
    setHoveredRoomId(id);
    if (id) {
      setSelectedRoomIds((prev) => new Set(prev).add(id));
    }
  }, []);

  const handleClickRoom = useCallback((id: string) => {
    setSelectedRoomIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleFilterChange = useCallback((range: FilterRange) => {
    setFilterRange(range);
  }, []);

  const handleHourChange = useCallback((hour: number) => {
    setAnimationState((prev) => ({ ...prev, currentHour: hour, isPlaying: false }));
  }, []);

  const handleAddRoom = useCallback(async (partial: Partial<Room>) => {
    try {
      const res = await fetch('/api/building', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial),
      });
      const newRoom = await res.json();
      setRooms((prev) => [...prev, newRoom]);
    } catch (err) {
      console.error('Failed to add room:', err);
    }
  }, []);

  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0e17',
        color: '#00d4ff',
        fontSize: 14,
        letterSpacing: 2,
      }}>
        加载建筑数据...
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Scene3D
        rooms={rooms}
        filterRange={[filterRange.min, filterRange.max]}
        hoveredRoomId={hoveredRoomId}
        selectedRoomIds={selectedRoomIds}
        onHoverRoom={handleHoverRoom}
        onClickRoom={handleClickRoom}
        currentHour={animationState.currentHour}
      />
      <ControlPanel
        rooms={rooms}
        filterRange={filterRange}
        animationState={animationState}
        filteredCount={filteredCount}
        totalCount={rooms.length}
        currentHour={animationState.currentHour}
        onFilterChange={handleFilterChange}
        onAnimationStateChange={setAnimationState}
        onHourChange={handleHourChange}
        onAddRoom={handleAddRoom}
        isCollapsed={isPanelCollapsed}
        onToggleCollapse={() => setIsPanelCollapsed((p) => !p)}
      />
    </div>
  );
};

export default App;

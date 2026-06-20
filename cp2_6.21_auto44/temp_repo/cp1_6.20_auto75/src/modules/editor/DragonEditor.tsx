import { useState, useEffect, useCallback } from 'react';
import type { Dragon, TeamConfig } from '../../shared/types';
import { eventBus, EVENTS } from '../../shared/EventBus';
import { dataService } from './DataService';
import DragonCard from './DragonCard';
import './DragonEditor.css';

const MAX_TEAM_SIZE = 5;

interface ElementConnection {
  from: number;
  to: number;
  isAdvantage: boolean;
}

export default function DragonEditor() {
  const [allDragons, setAllDragons] = useState<Dragon[]>([]);
  const [selectedDragons, setSelectedDragons] = useState<Dragon[]>([]);
  const [draggedDragon, setDraggedDragon] = useState<Dragon | null>(null);
  const [filterElement, setFilterElement] = useState<string>('all');
  const [filterRarity, setFilterRarity] = useState<string>('all');

  useEffect(() => {
    const dragons = dataService.getAllDragons();
    setAllDragons(dragons);
  }, []);

  const filteredDragons = allDragons.filter((dragon) => {
    if (filterElement !== 'all' && dragon.element !== filterElement) return false;
    if (filterRarity !== 'all' && dragon.rarity !== filterRarity) return false;
    return true;
  });

  const handleDragonClick = useCallback(
    (dragon: Dragon) => {
      const isSelected = selectedDragons.some((d) => d.id === dragon.id);

      if (isSelected) {
        setSelectedDragons((prev) => prev.filter((d) => d.id !== dragon.id));
      } else if (selectedDragons.length < MAX_TEAM_SIZE) {
        setSelectedDragons((prev) => [...prev, dragon]);
      }
    },
    [selectedDragons]
  );

  const handleDragStart = useCallback((e: React.DragEvent, dragon: Dragon) => {
    setDraggedDragon(dragon);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragon.id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedDragon(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDropOnTeam = useCallback(
    (e: React.DragEvent, targetIndex?: number) => {
      e.preventDefault();
      if (!draggedDragon) return;

      const isInTeam = selectedDragons.some((d) => d.id === draggedDragon.id);

      if (isInTeam) {
        setSelectedDragons((prev) => {
          const newTeam = prev.filter((d) => d.id !== draggedDragon.id);
          if (targetIndex !== undefined) {
            newTeam.splice(targetIndex, 0, draggedDragon);
          } else {
            newTeam.push(draggedDragon);
          }
          return newTeam;
        });
      } else if (selectedDragons.length < MAX_TEAM_SIZE) {
        setSelectedDragons((prev) => [...prev, draggedDragon]);
      }

      setDraggedDragon(null);
    },
    [draggedDragon, selectedDragons]
  );

  const removeFromTeam = useCallback((dragonId: string) => {
    setSelectedDragons((prev) => prev.filter((d) => d.id !== dragonId));
  }, []);

  const getElementConnections = useCallback((): ElementConnection[] => {
    const connections: ElementConnection[] = [];
    for (let i = 0; i < selectedDragons.length; i++) {
      for (let j = i + 1; j < selectedDragons.length; j++) {
        const hasAdv = dataService.hasElementAdvantage(
          selectedDragons[i].element,
          selectedDragons[j].element
        );
        if (hasAdv) {
          connections.push({ from: i, to: j, isAdvantage: true });
        }
      }
    }
    return connections;
  }, [selectedDragons]);

  const connections = getElementConnections();

  const handleStartBattle = useCallback(() => {
    if (selectedDragons.length === 0) return;

    const teamConfig: TeamConfig = {
      dragons: [...selectedDragons],
    };

    eventBus.emit(EVENTS.TEAM_SUBMITTED, teamConfig);
  }, [selectedDragons]);

  return (
    <div className="dragon-editor">
      <div className="editor-header">
        <h2 className="editor-title">龙种图鉴</h2>
        <div className="filter-controls">
          <select
            className="filter-select"
            value={filterElement}
            onChange={(e) => setFilterElement(e.target.value)}
          >
            <option value="all">全部属性</option>
            <option value="fire">火</option>
            <option value="water">水</option>
            <option value="wind">风</option>
            <option value="earth">土</option>
            <option value="light">光</option>
          </select>
          <select
            className="filter-select"
            value={filterRarity}
            onChange={(e) => setFilterRarity(e.target.value)}
          >
            <option value="all">全部稀有度</option>
            <option value="common">普通</option>
            <option value="rare">稀有</option>
            <option value="epic">史诗</option>
            <option value="legendary">传说</option>
          </select>
        </div>
      </div>

      <div className="dragon-gallery">
        {filteredDragons.map((dragon) => (
          <DragonCard
            key={dragon.id}
            dragon={dragon}
            isSelected={selectedDragons.some((d) => d.id === dragon.id)}
            onClick={() => handleDragonClick(dragon)}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            isDragging={draggedDragon?.id === dragon.id}
            size="medium"
          />
        ))}
      </div>

      <div className="team-section">
        <div className="team-header">
          <h3>出战阵容</h3>
          <span className="team-count">
            {selectedDragons.length} / {MAX_TEAM_SIZE}
          </span>
        </div>

        <div
          className={`team-slots ${selectedDragons.length === 0 ? 'empty' : ''}`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDropOnTeam(e)}
        >
          {selectedDragons.map((dragon, index) => (
            <div
              key={dragon.id}
              className="team-slot filled"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropOnTeam(e, index)}
            >
              <div className="connection-lines">
                {connections
                  .filter((c) => c.from === index || c.to === index)
                  .map((conn, i) => (
                    <div
                      key={i}
                      className={`connection-line ${conn.isAdvantage ? 'advantage' : ''}`}
                      style={{
                        left: conn.from === index ? '50%' : '0',
                        right: conn.to === index ? '50%' : '0',
                      }}
                    />
                  ))}
              </div>
              <DragonCard
                dragon={dragon}
                isSelected
                size="small"
                index={index}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                isDragging={draggedDragon?.id === dragon.id}
                showStats={false}
              />
              <button
                className="remove-btn"
                onClick={() => removeFromTeam(dragon.id)}
                title="移除"
              >
                ×
              </button>
            </div>
          ))}
          {Array.from({ length: MAX_TEAM_SIZE - selectedDragons.length }).map((_, i) => (
            <div key={`empty-${i}`} className="team-slot empty">
              <span className="empty-slot-text">空位</span>
            </div>
          ))}
        </div>

        <div className="element-legend">
          <span className="legend-title">属性相克: </span>
          <span className="legend-item fire">火</span>→
          <span className="legend-item wind">风</span>→
          <span className="legend-item earth">土</span>→
          <span className="legend-item water">水</span>→
          <span className="legend-item fire">火</span>
          <span className="legend-item light">光(中性)</span>
        </div>

        <button
          className="start-battle-btn"
          onClick={handleStartBattle}
          disabled={selectedDragons.length === 0}
        >
          <span className="btn-text">开始模拟对战</span>
          <span className="btn-glow" />
        </button>
      </div>
    </div>
  );
}

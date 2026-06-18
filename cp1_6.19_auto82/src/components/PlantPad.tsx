import React, { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { Plant, GrowthStage, LogEntry } from '@types/index';
import PlantCard from './PlantCard';
import CreatePlantPanel from './CreatePlantPanel';
import PlantDetailPanel from './PlantDetailPanel';
import { FiGrid, FiPlus } from 'react-icons/fi';

const GRID_SIZE = 12;

interface PlantPadProps {
  plants: Plant[];
  onCreate: (plant: Plant) => void;
  onUpdate: (plantId: string, patch: Partial<Plant>) => void;
  onDelete: (plantId: string) => void;
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const PlantPad: React.FC<PlantPadProps> = ({ plants, onCreate, onUpdate, onDelete }) => {
  const [createPanelVisible, setCreatePanelVisible] = useState(false);
  const [targetGridIndex, setTargetGridIndex] = useState<number | null>(null);
  const [detailPlantId, setDetailPlantId] = useState<string | null>(null);
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);

  const plantMap = useMemo(() => {
    const map = new Map<number, Plant>();
    plants.forEach((p) => map.set(p.gridIndex, p));
    return map;
  }, [plants]);

  const detailPlant = useMemo(
    () => (detailPlantId ? plants.find((p) => p.id === detailPlantId) || null : null),
    [detailPlantId, plants],
  );

  const handleSlotClick = (index: number) => {
    if (plantMap.has(index)) {
      setDetailPlantId(plantMap.get(index)!.id);
    } else {
      setTargetGridIndex(index);
      setCreatePanelVisible(true);
    }
  };

  const handleCreateConfirm = (data: {
    speciesId: string;
    customName: string;
    plantDate: string;
    notes: string;
    stage: GrowthStage;
    gridIndex: number;
  }) => {
    const newPlant: Plant = {
      id: genId(),
      speciesId: data.speciesId,
      customName: data.customName || undefined,
      plantDate: data.plantDate,
      stage: data.stage,
      notes: data.notes,
      gridIndex: data.gridIndex,
      logs: [],
    };
    onCreate(newPlant);
    setNewlyCreatedId(newPlant.id);
    setCreatePanelVisible(false);
    setTargetGridIndex(null);
    setTimeout(() => setNewlyCreatedId(null), 600);
  };

  const handleAddLog = (plantId: string, log: Omit<LogEntry, 'id'>) => {
    const current = plants.find((p) => p.id === plantId);
    if (!current) return;
    const newLog: LogEntry = { ...log, id: genId() };
    onUpdate(plantId, { logs: [newLog, ...current.logs] });
  };

  const handleUpdateProgress = (plantId: string, stage: GrowthStage) => {
    onUpdate(plantId, { stage });
  };

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--color-card-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--color-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FiGrid size={18} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>我的花园</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              已种植 {plants.length} / {GRID_SIZE} 格
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            gap: 14,
          }}
        >
          {Array.from({ length: GRID_SIZE }).map((_, index) => {
            const plant = plantMap.get(index);
            if (plant) {
              return (
                <div key={`slot-${index}`} style={{ display: 'block' }}>
                  <PlantCard
                    key={plant.id}
                    plant={plant}
                    onClick={() => setDetailPlantId(plant.id)}
                    onDelete={() => onDelete(plant.id)}
                    isNew={newlyCreatedId === plant.id}
                  />
                </div>
              );
            }
            return (
              <button
                key={`slot-${index}`}
                onClick={() => handleSlotClick(index)}
                style={{
                  minHeight: 180,
                  borderRadius: 'var(--radius-card)',
                  border: '2px dashed #D9CDB8',
                  backgroundColor: 'rgba(255,255,255,0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  color: '#B8A990',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-primary)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-primary)';
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-primary)08';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#D9CDB8';
                  (e.currentTarget as HTMLButtonElement).style.color = '#B8A990';
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.4)';
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 999,
                    backgroundColor: 'currentColor',
                    opacity: 0.12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FiPlus size={22} style={{ opacity: 1, color: 'currentColor' }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>空地 #{index + 1}</div>
                <div style={{ fontSize: 11 }}>点击开始种植</div>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        <CreatePlantPanel
          visible={createPanelVisible}
          gridIndex={targetGridIndex}
          onConfirm={handleCreateConfirm}
          onCancel={() => {
            setCreatePanelVisible(false);
            setTargetGridIndex(null);
          }}
        />
      </AnimatePresence>

      <PlantDetailPanel
        plant={detailPlant}
        visible={!!detailPlantId}
        onClose={() => setDetailPlantId(null)}
        onAddLog={handleAddLog}
        onUpdateProgress={handleUpdateProgress}
        onDelete={onDelete}
      />
    </div>
  );
};

export default PlantPad;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '../eventBus';
import { farmingEngine } from '../engine/farmingEngine';
import type { Crop, PlantingPlan, Plot, NutrientWarningPayload } from '../types';
import { NutrientBar } from './NutrientBar';
import { WarningTooltip } from './WarningTooltip';

const MONTH_NAMES = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月',
];

interface CalendarGridProps {
  onCellClick?: (plotId: string, month: number) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({ onCellClick }) => {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [plans, setPlans] = useState<PlantingPlan[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [warning, setWarning] = useState<NutrientWarningPayload | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [warningPlots, setWarningPlots] = useState<Set<string>>(new Set());

  useEffect(() => {
    setPlots(farmingEngine.getPlots());
    setPlans(farmingEngine.getPlans());
    setCrops(farmingEngine.getCrops());

    const unsubNutrients = eventBus.subscribe('nutrients:updated', (payload) => {
      setPlots(prev => prev.map(p =>
        p.id === payload.plotId
          ? { ...p, nutrients: payload.nutrients }
          : p
      ));
    });

    const unsubWarning = eventBus.subscribe('nutrient:warning', (payload) => {
      setWarning(payload);
      setWarningPlots(prev => new Set(prev).add(payload.plotId));
    });

    return () => {
      unsubNutrients();
      unsubWarning();
    };
  }, []);

  const getCrop = (cropId: string | null): Crop | undefined => {
    if (!cropId) return undefined;
    return crops.find(c => c.id === cropId);
  };

  const getPlan = (plotId: string, month: number): PlantingPlan | undefined => {
    return plans.find(p => p.plotId === plotId && p.month === month);
  };

  const getPlotNutrients = (plotId: string) => {
    const plot = plots.find(p => p.id === plotId);
    return plot?.nutrients || { n: 0, p: 0, k: 0 };
  };

  const handleDragOver = (e: React.DragEvent, plotId: string, month: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCell(`${plotId}-${month}`);
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = (e: React.DragEvent, plotId: string, month: number) => {
    e.preventDefault();
    setDragOverCell(null);

    const cropId = e.dataTransfer.getData('cropId');
    if (cropId) {
      farmingEngine.updatePlanting(plotId, month, cropId);
      setPlans([...farmingEngine.getPlans()]);
      onCellClick?.(plotId, month);
    }
  };

  const handleCellClick = (plotId: string, month: number) => {
    onCellClick?.(plotId, month);
  };

  const handleWarningClick = (e: React.MouseEvent, plotId: string) => {
    e.stopPropagation();
    const plot = plots.find(p => p.id === plotId);
    if (plot) {
      const nutrients = ['n', 'p', 'k'] as const;
      const lowNutrient = nutrients.find(n => plot.nutrients[n] < 20);
      if (lowNutrient && warning) {
        setShowWarning(true);
      }
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div style={{ width: '100%' }}>
      <WarningTooltip
        visible={showWarning}
        nutrient={warning?.nutrient || 'n'}
        currentValue={warning?.currentValue || 0}
        threshold={warning?.threshold || 20}
        recommendedFertilizer={warning?.recommendedFertilizer || ''}
        onClose={() => setShowWarning(false)}
      />

      <div style={{ marginBottom: '16px' }}>
        <h2
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: '28px',
            color: '#2E7D32',
            margin: 0,
          }}
        >
          全年种植日历
        </h2>
        <p style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>
          拖拽作物卡片到地块上安排种植计划
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
        }}
        className="calendar-grid"
      >
        {months.map((month) => (
          <motion.div
            key={month}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: (month - 1) * 0.05 }}
            style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              padding: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <div
              style={{
                textAlign: 'center',
                fontWeight: 600,
                color: '#2E7D32',
                marginBottom: '10px',
                fontFamily: "'Caveat', cursive",
                fontSize: '20px',
              }}
            >
              {MONTH_NAMES[month - 1]}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {plots.map((plot, plotIndex) => {
                const plan = getPlan(plot.id, month);
                const crop = getCrop(plan?.cropId || null);
                const nutrients = getPlotNutrients(plot.id);
                const cellKey = `${plot.id}-${month}`;
                const isDragOver = dragOverCell === cellKey;
                const hasWarning = warningPlots.has(plot.id) && nutrients.n < 20;

                return (
                  <motion.div
                    key={plot.id}
                    whileHover={{ scale: 1.02 }}
                    onDragOver={(e) => handleDragOver(e, plot.id, month)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, plot.id, month)}
                    onClick={() => handleCellClick(plot.id, month)}
                    style={{
                      position: 'relative',
                      backgroundColor: isDragOver ? '#E8F5E9' : '#FAFAFA',
                      borderRadius: '8px',
                      padding: '8px',
                      cursor: 'pointer',
                      border: isDragOver
                        ? '2px dashed #2E7D32'
                        : '1px solid #E0E0E0',
                      transition: 'all 0.2s ease',
                    }}
                    layout
                  >
                    {hasWarning && plotIndex === 0 && (
                      <motion.div
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        onClick={(e) => handleWarningClick(e, plot.id)}
                        style={{
                          position: 'absolute',
                          left: '-8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 0,
                          height: 0,
                          borderTop: '8px solid transparent',
                          borderBottom: '8px solid transparent',
                          borderRight: '12px solid #FFC107',
                          cursor: 'pointer',
                          zIndex: 10,
                        }}
                      />
                    )}

                    <div
                      style={{
                        fontSize: '11px',
                        color: '#666',
                        marginBottom: '6px',
                        fontWeight: 50,
                      }}
                    >
                      {plot.name}
                    </div>

                    {crop ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '6px',
                        }}
                      >
                        <div
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: crop.color,
                          }}
                        />
                        <span style={{ fontSize: '13px', color: '#2E7D32', fontWeight: 500 }}>
                          {crop.name}
                        </span>
                      </div>
                    ) : (
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#BBB',
                          marginBottom: '6px',
                          fontStyle: 'italic',
                        }}
                      >
                        空闲
                      </div>
                    )}

                    <NutrientBar n={nutrients.n} p={nutrients.p} k={nutrients.k} size="small" />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

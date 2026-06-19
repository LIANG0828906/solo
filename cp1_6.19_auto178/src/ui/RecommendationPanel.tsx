import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Crop } from '../types';
import { eventBus } from '../eventBus';
import { farmingEngine } from '../engine/farmingEngine';
import { CropCard } from './CropCard';
import { FAMILY_NAMES } from '../mockData';

interface RecommendationPanelProps {
  selectedPlotId?: string;
  selectedMonth?: number;
}

export const RecommendationPanel: React.FC<RecommendationPanelProps> = ({
  selectedPlotId,
  selectedMonth,
}) => {
  const [allCrops, setAllCrops] = useState<Crop[]>([]);
  const [recommendations, setRecommendations] = useState<Crop[]>([]);
  const [incompatible, setIncompatible] = useState<string[]>([]);

  useEffect(() => {
    setAllCrops(farmingEngine.getCrops());

    if (selectedPlotId && selectedMonth) {
      const result = farmingEngine.getRecommendations(selectedPlotId, selectedMonth);
      setRecommendations(result.recommendations);
      setIncompatible(result.incompatible);
    } else {
      setRecommendations([]);
      setIncompatible([]);
    }

    const unsub = eventBus.subscribe('recommendation:updated', (payload) => {
      if (payload.plotId === selectedPlotId && payload.month === selectedMonth) {
        setRecommendations(payload.recommendations);
        setIncompatible(payload.incompatible);
      }
    });

    return () => unsub();
  }, [selectedPlotId, selectedMonth]);

  const isRecommended = (cropId: string) => {
    return recommendations.some(r => r.id === cropId);
  };

  const isIncompatible = (cropId: string) => {
    return incompatible.includes(cropId);
  };

  const recommendedCrops = allCrops.filter(c => isRecommended(c.id));
  const otherCrops = allCrops.filter(c => !isRecommended(c.id) && !isIncompatible(c.id));
  const incompatibleCrops = allCrops.filter(c => isIncompatible(c.id));

  return (
    <div style={{ width: '280px' }}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          padding: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <h3
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: '24px',
            color: '#2E7D32',
            margin: '0 0 12px 0',
          }}
        >
          作物推荐
        </h3>

        {selectedPlotId && selectedMonth ? (
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
            地块 {selectedPlotId.replace('plot-', '')} · {selectedMonth}月
          </p>
        ) : (
          <p style={{ fontSize: '12px', color: '#999', marginBottom: '12px' }}>
            点击地块查看推荐
          </p>
        )}

        {recommendedCrops.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#FFB300',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>★</span> 推荐种植
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <AnimatePresence>
                {recommendedCrops.map((crop, index) => (
                  <motion.div
                    key={crop.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                  >
                    <div style={{ transform: 'scale(0.85)', transformOrigin: 'left' }}>
                      <CropCard crop={crop} isDraggable isRecommended />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {otherCrops.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#666',
                marginBottom: '8px',
              }}
            >
              其他作物
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {otherCrops.map((crop) => (
                <div key={crop.id} style={{ transform: 'scale(0.85)', transformOrigin: 'left' }}>
                  <CropCard crop={crop} isDraggable />
                </div>
              ))}
            </div>
          </div>
        )}

        {incompatibleCrops.length > 0 && (
          <div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#E57373',
                marginBottom: '8px',
              }}
            >
              不兼容（同科禁忌）
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {incompatibleCrops.map((crop) => (
                <div key={crop.id} style={{ transform: 'scale(0.85)', transformOrigin: 'left' }}>
                  <CropCard crop={crop} isIncompatible />
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

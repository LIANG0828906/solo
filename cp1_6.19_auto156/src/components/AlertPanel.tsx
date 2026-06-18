import React from 'react';
import { motion } from 'framer-motion';
import type { Alert, Plant } from '@/types';

interface AlertPanelProps {
  alerts: Alert[];
  plants: Plant[];
  onResolve: (alertId: string) => void;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({ alerts, plants, onResolve }) => {
  const activeAlerts = alerts.filter(a => !a.resolved);

  const getPlantName = (plantId: string) => {
    const plant = plants.find(p => p.id === plantId);
    return plant ? plant.name : '未知植物';
  };

  if (activeAlerts.length === 0) {
    return (
      <div className="alert-panel glass-panel">
        <div className="section-title" style={{ color: 'var(--primary-dark)' }}>
          🛡️ 病虫害预警
        </div>
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
          ✅ 所有植物状态良好
        </div>
      </div>
    );
  }

  return (
    <div className="alert-panel glass-panel">
      <div className="section-title" style={{ color: 'var(--danger)' }}>
        ⚠️ 病虫害预警 ({activeAlerts.length})
      </div>
      {activeAlerts.map((alert, index) => (
        <motion.div
          key={alert.id}
          className="alert-item"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="alert-item-title">
            {getPlantName(alert.plantId)}
            <span style={{ marginLeft: '8px', fontSize: '11px', opacity: 0.8 }}>
              {alert.date}
            </span>
          </div>
          <div className="alert-item-desc">{alert.description}</div>
          <div className="alert-item-suggestion">
            💡 {alert.suggestion}
          </div>
          <button
            className="btn btn-small btn-primary"
            style={{ marginTop: '8px', fontSize: '11px', padding: '3px 10px' }}
            onClick={(e) => {
              e.stopPropagation();
              onResolve(alert.id);
            }}
          >
            标记已处理
          </button>
        </motion.div>
      ))}
    </div>
  );
};

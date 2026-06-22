import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';
import { subscribe, SimulationState, Snapshot } from '../store';
import { eventBus, EVENTS } from '../eventBus';

export const SnapshotPanel: React.FC = () => {
  const [state, setState] = useState<SimulationState | null>(null);
  const [showClearSnapshotsConfirm, setShowClearSnapshotsConfirm] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribe((newState) => {
      setState({ ...newState });
    });
    return unsubscribe;
  }, []);

  const handleLoadSnapshot = (snapshotId: string) => {
    eventBus.emit(EVENTS.LOAD_SNAPSHOT, snapshotId);
  };

  const handleDeleteSnapshot = (snapshotId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    eventBus.emit(EVENTS.DELETE_SNAPSHOT, snapshotId);
  };

  const handleClearSnapshots = () => {
    setTimeout(() => {
      eventBus.emit(EVENTS.CLEAR_SNAPSHOTS);
      setShowClearSnapshotsConfirm(false);
    }, 200);
  };

  if (!state) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      style={{
        background: '#16213E',
        borderRadius: '12px',
        padding: '16px',
        height: '150px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <h4 style={{ color: '#fff', margin: 0, fontSize: '14px' }}>
          方案快照 ({state.snapshots.length}/3)
        </h4>
        <motion.button
          onClick={() => state.snapshots.length > 0 && setShowClearSnapshotsConfirm(true)}
          whileHover={state.snapshots.length > 0 ? { scale: 1.05 } : {}}
          whileTap={state.snapshots.length > 0 ? { scale: 0.95 } : {}}
          disabled={state.snapshots.length === 0}
          style={{
            fontSize: '12px',
            padding: '4px 12px',
            borderRadius: '6px',
            border: 'none',
            background: state.snapshots.length > 0 ? '#F44336' : '#3A4A6A',
            color: '#fff',
            cursor: state.snapshots.length > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          清空所有
        </motion.button>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '8px',
        }}
      >
        {state.snapshots.length === 0 ? (
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8B9CBF',
              fontSize: '13px',
            }}
          >
            暂无保存的方案，点击「保存方案快照」创建
          </div>
        ) : (
          state.snapshots.map((snapshot) => (
            <SnapshotCard
              key={snapshot.id}
              snapshot={snapshot}
              onLoad={() => handleLoadSnapshot(snapshot.id)}
              onDelete={(e) => handleDeleteSnapshot(snapshot.id, e)}
            />
          ))
        )}
      </div>

      <AnimatePresence>
        {showClearSnapshotsConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
            }}
            onClick={() => setShowClearSnapshotsConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#16213E',
                borderRadius: '8px',
                padding: '24px',
                minWidth: '300px',
                border: '1px solid #2A3F5F',
              }}
            >
              <h3 style={{ color: '#fff', margin: '0 0 16px 0' }}>确认清空快照</h3>
              <p style={{ color: '#8B9CBF', margin: '0 0 20px 0' }}>
                确定要删除所有已保存的方案快照吗？此操作不可恢复。
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowClearSnapshotsConfirm(false)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    border: '1px solid #2A3F5F',
                    background: 'transparent',
                    color: '#8B9CBF',
                    cursor: 'pointer',
                  }}
                >
                  取消
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClearSnapshots}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#F44336',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  确认清空
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface SnapshotCardProps {
  snapshot: Snapshot;
  onLoad: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

const SnapshotCard: React.FC<SnapshotCardProps> = ({ snapshot, onLoad, onDelete }) => {
  const miniChartData = snapshot.simulationData.map((d) => ({
    month: d.month,
    value: d.satisfaction,
  }));

  const formatChange = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <motion.div
      onClick={onLoad}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      style={{
        minWidth: '160px',
        height: '100px',
        background: '#FFFFFF',
        borderRadius: '8px',
        border: '1px solid #E0E0E0',
        padding: '8px',
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <motion.button
        onClick={onDelete}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{
          position: 'absolute',
          top: '-6px',
          right: '-6px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: '#F44336',
          color: '#fff',
          border: 'none',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          zIndex: 1,
        }}
      >
        ×
      </motion.button>

      <div
        style={{
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '4px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {snapshot.name}
      </div>

      <div style={{ flex: 1, height: '40px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={miniChartData}>
            <Line
              type="monotone"
              dataKey="value"
              stroke="#4CAF50"
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div
        style={{
          fontSize: '9px',
          color: '#666',
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '4px',
        }}
      >
        <span style={{ color: '#4CAF50' }}>
          满意{formatChange(snapshot.summary.satisfactionChange)}
        </span>
        <span style={{ color: snapshot.summary.carbonChange <= 0 ? '#4CAF50' : '#F44336' }}>
          碳排{formatChange(snapshot.summary.carbonChange)}
        </span>
      </div>
    </motion.div>
  );
};

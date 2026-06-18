import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribe, SimulationState } from '../store';
import { eventBus, EVENTS } from '../eventBus';
import { policyTags } from '../engine/policyData';

export const ControlPanel: React.FC = () => {
  const [state, setState] = useState<SimulationState | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSnapshotNameInput, setShowSnapshotNameInput] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');

  useEffect(() => {
    const unsubscribe = subscribe((newState) => {
      setState({ ...newState });
    });
    return unsubscribe;
  }, []);

  const handlePolicyClick = (policyId: string) => {
    eventBus.emit(EVENTS.POLICY_TOGGLE, policyId);
  };

  const handleStartSimulation = () => {
    if (state && state.selectedPolicies.length >= 2) {
      eventBus.emit(EVENTS.START_SIMULATION);
    }
  };

  const handleClearSelection = () => {
    setTimeout(() => {
      eventBus.emit(EVENTS.CLEAR_SELECTION);
      setShowClearConfirm(false);
    }, 200);
  };

  const handleSaveSnapshot = () => {
    if (state && state.simulationData.length > 0) {
      setShowSnapshotNameInput(true);
      setSnapshotName(`方案 ${state.snapshots.length + 1}`);
    }
  };

  const confirmSaveSnapshot = () => {
    if (!state || !snapshotName.trim()) return;

    const firstMonth = state.simulationData[0];
    const lastMonth = state.simulationData[state.simulationData.length - 1];

    const satisfactionChange = firstMonth
      ? ((lastMonth.satisfaction - firstMonth.satisfaction) / firstMonth.satisfaction) * 100
      : 0;
    const carbonChange = firstMonth
      ? ((lastMonth.carbon - firstMonth.carbon) / firstMonth.carbon) * 100
      : 0;
    const economyChange = firstMonth
      ? ((lastMonth.economy - firstMonth.economy) / firstMonth.economy) * 100
      : 0;

    eventBus.emit(EVENTS.SAVE_SNAPSHOT, {
      name: snapshotName.trim(),
      selectedPolicies: state.selectedPolicies,
      simulationData: state.simulationData,
      policyContributions: state.policyContributions,
      summary: {
        satisfactionChange: Math.round(satisfactionChange * 10) / 10,
        carbonChange: Math.round(carbonChange * 10) / 10,
        economyChange: Math.round(economyChange * 10) / 10,
      },
    });

    setShowSnapshotNameInput(false);
    setSnapshotName('');
  };

  if (!state) return null;

  const canSimulate = state.selectedPolicies.length >= 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h2
        style={{
          color: '#FFC107',
          fontSize: '24px',
          fontWeight: 600,
          margin: '0 0 20px 0',
        }}
      >
        政策盘
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        {policyTags.map((policy) => {
          const isSelected = state.selectedPolicies.includes(policy.id);
          const isDisabled = !isSelected && state.selectedPolicies.length >= 5;

          return (
            <motion.div
              key={policy.id}
              onClick={() => !isDisabled && handlePolicyClick(policy.id)}
              whileHover={!isDisabled ? { y: -4, boxShadow: '0px 4px 12px rgba(0,0,0,0.2)' } : {}}
              whileTap={!isDisabled ? { scale: 0.98 } : {}}
              animate={isSelected ? { scale: 1.05 } : { scale: 1 }}
              initial={false}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{
                width: '140px',
                height: '90px',
                borderRadius: '10px',
                backgroundColor: policy.color,
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.5 : 1,
                boxSizing: 'border-box',
                padding: '8px',
                textAlign: 'center',
                border: isSelected ? '2px solid #FFC107' : '2px solid transparent',
                transition: 'border-color 0.3s ease-out',
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                {policy.name}
              </span>
              <span style={{ fontSize: '10px', opacity: 0.9 }}>{policy.description}</span>
            </motion.div>
          );
        })}
      </div>

      <div
        style={{
          color: '#8B9CBF',
          fontSize: '14px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>
          已选: <span style={{ color: '#FFC107', fontWeight: 'bold' }}>{state.selectedPolicies.length}</span> / 5
        </span>
        <span style={{ fontSize: '12px' }}>（至少选择2个）</span>
      </div>

      <motion.button
        onClick={handleStartSimulation}
        disabled={!canSimulate || state.isSimulating}
        whileHover={canSimulate && !state.isSimulating ? { scale: 1.02 } : {}}
        whileTap={canSimulate && !state.isSimulating ? { scale: 0.98 } : {}}
        transition={{ duration: 0.1 }}
        style={{
          height: '40px',
          borderRadius: '8px',
          border: 'none',
          background: canSimulate
            ? 'linear-gradient(135deg, #2196F3 0%, #3F51B5 100%)'
            : '#3A4A6A',
          color: '#fff',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: canSimulate && !state.isSimulating ? 'pointer' : 'not-allowed',
          marginBottom: '12px',
        }}
      >
        {state.isSimulating ? '推演中...' : '开始模拟'}
      </motion.button>

      <motion.button
        onClick={() => setShowClearConfirm(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.1 }}
        style={{
          height: '40px',
          borderRadius: '8px',
          border: 'none',
          background: '#F44336',
          color: '#fff',
          fontSize: '14px',
          cursor: 'pointer',
          marginBottom: '12px',
        }}
      >
        清空选择
      </motion.button>

      <motion.button
        onClick={handleSaveSnapshot}
        disabled={state.simulationData.length === 0}
        whileHover={state.simulationData.length > 0 ? { scale: 1.02 } : {}}
        whileTap={state.simulationData.length > 0 ? { scale: 0.98 } : {}}
        transition={{ duration: 0.1 }}
        style={{
          height: '40px',
          borderRadius: '8px',
          border: 'none',
          background: state.simulationData.length > 0 ? '#4CAF50' : '#3A4A6A',
          color: '#fff',
          fontSize: '14px',
          cursor: state.simulationData.length > 0 ? 'pointer' : 'not-allowed',
        }}
      >
        保存方案快照
      </motion.button>

      <AnimatePresence>
        {showClearConfirm && (
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
            onClick={() => setShowClearConfirm(false)}
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
              <h3 style={{ color: '#fff', margin: '0 0 16px 0' }}>确认清空</h3>
              <p style={{ color: '#8B9CBF', margin: '0 0 20px 0' }}>
                确定要清空所有已选政策和模拟结果吗？
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowClearConfirm(false)}
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
                  onClick={handleClearSelection}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#F44336',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  确认
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSnapshotNameInput && (
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
            onClick={() => setShowSnapshotNameInput(false)}
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
                minWidth: '320px',
                border: '1px solid #2A3F5F',
              }}
            >
              <h3 style={{ color: '#fff', margin: '0 0 16px 0' }}>保存方案</h3>
              <input
                type="text"
                value={snapshotName}
                onChange={(e) => setSnapshotName(e.target.value)}
                placeholder="请输入方案名称"
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #2A3F5F',
                  background: '#0F1729',
                  color: '#fff',
                  fontSize: '14px',
                  marginBottom: '20px',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSnapshotNameInput(false)}
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
                  onClick={confirmSaveSnapshot}
                  disabled={!snapshotName.trim()}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    background: snapshotName.trim() ? '#4CAF50' : '#3A4A6A',
                    color: '#fff',
                    cursor: snapshotName.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  保存
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

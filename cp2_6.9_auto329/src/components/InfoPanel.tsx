import { motion } from 'framer-motion';
import { useStore } from '../store';

const phaseNames: Record<string, string> = {
  selecting: '选药',
  pounding: '捣药',
  weighing: '称药',
  completed: '完成',
};

export default function InfoPanel() {
  const { state } = useStore();
  const phases = ['selecting', 'pounding', 'weighing', 'completed'];

  return (
    <motion.div
      className="panel-section"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="panel-title">药材信息</h2>

      <div className="phase-indicator">
        {phases.map((phase, idx) => (
          <div
            key={phase}
            className={`phase-step ${
              state.currentPhase === phase
                ? 'active breathing'
                : phases.indexOf(state.currentPhase) > idx
                ? 'completed'
                : ''
            }`}
          >
            {idx + 1}.{phaseNames[phase]}
          </div>
        ))}
      </div>

      {state.selectedHerb ? (
        <>
          <motion.div
            className="herb-name"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {state.selectedHerb.name}
          </motion.div>
          <div className="info-item">
            <span className="info-label">性味</span>
            <span className="info-value">{state.selectedHerb.nature}</span>
          </div>
          <div className="info-item">
            <span className="info-label">味</span>
            <span className="info-value">{state.selectedHerb.flavor}</span>
          </div>
          <div className="info-item">
            <span className="info-label">用量范围</span>
            <span className="info-value">
              {state.selectedHerb.dosageRange[0]} - {state.selectedHerb.dosageRange[1]} 钱
            </span>
          </div>
          {state.currentPhase === 'pounding' && (
            <div className="info-item">
              <span className="info-label">已捣次数</span>
              <span className="info-value" style={{ color: '#ff9800', fontWeight: 700 }}>
                {state.poundingCount} 次
              </span>
            </div>
          )}
          {state.currentPhase === 'weighing' && (
            <>
              <div className="info-item">
                <span className="info-label">当前重量</span>
                <span
                  className="info-value"
                  style={{
                    color:
                      Math.abs(
                        state.scaleWeight -
                          (state.prescription.find(
                            (item) => item.herbId === state.selectedHerb?.id
                          )?.requiredDosage ?? 0)
                      ) < 0.05
                        ? '#4caf50'
                        : '#ff9800',
                    fontWeight: 700,
                  }}
                >
                  {state.scaleWeight.toFixed(1)} 钱
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">处方剂量</span>
                <span className="info-value">
                  {
                    state.prescription.find(
                      (item) => item.herbId === state.selectedHerb?.id
                    )?.requiredDosage
                  }{' '}
                  钱
                </span>
              </div>
            </>
          )}
        </>
      ) : (
        <div className="no-selection">
          请从药柜中选择一味药材
          <br />
          <small style={{ fontSize: '12px', opacity: 0.7 }}>
            拖拽抽屉到铜盘中开始
          </small>
        </div>
      )}
    </motion.div>
  );
}

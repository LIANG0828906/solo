import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormationType } from '../App';

interface FormationStats {
  name: string;
  firepower: number;
  hitChance: number;
  desc: string;
}

interface PanelProps {
  currentFormation: FormationType;
  onFormationChange: (formation: FormationType) => void;
  onFire: () => void;
  onTogglePause: () => void;
  isPaused: boolean;
  isFiring: boolean;
  stats: FormationStats;
}

const Panel: React.FC<PanelProps> = ({
  currentFormation,
  onFormationChange,
  onFire,
  onTogglePause,
  isPaused,
  isFiring,
  stats
}) => {
  const formations: { type: FormationType; name: string; desc: string; icon: JSX.Element }[] = [
    {
      type: 'v',
      name: '雁行阵',
      desc: 'V型冲锋阵型，火力集中，适合突击',
      icon: (
        <svg viewBox="0 0 100 60" width="100%" height="100%">
          <circle cx="50" cy="10" r="4" fill="#8b5a2b" stroke="#fff" strokeWidth="0.5" />
          <circle cx="35" cy="25" r="4" fill="#8b5a2b" stroke="#fff" strokeWidth="0.5" />
          <circle cx="65" cy="25" r="4" fill="#8b5a2b" stroke="#fff" strokeWidth="0.5" />
          <circle cx="20" cy="40" r="4" fill="#8b5a2b" stroke="#fff" strokeWidth="0.5" />
          <circle cx="50" cy="40" r="4" fill="#8b5a2b" stroke="#fff" strokeWidth="0.5" />
          <circle cx="80" cy="40" r="4" fill="#8b5a2b" stroke="#fff" strokeWidth="0.5" />
          <circle cx="35" cy="55" r="4" fill="#8b5a2b" stroke="#fff" strokeWidth="0.5" />
          <circle cx="65" cy="55" r="4" fill="#8b5a2b" stroke="#fff" strokeWidth="0.5" />
        </svg>
      )
    },
    {
      type: 'diamond',
      name: '鱼鳞阵',
      desc: '菱形防御阵型，层层递进，防御力强',
      icon: (
        <svg viewBox="0 0 100 70" width="100%" height="100%">
          <circle cx="50" cy="8" r="4" fill="#8b5a2b" stroke="#fff" strokeWidth="0.5" />
          <circle cx="30" cy="22" r="4" fill="#8b5a2b" stroke="#fff" strokeWidth="0.5" />
          <circle cx="50" cy="22" r="4" fill="#8b5a2b" stroke="#fff" strokeWidth="0.5" />
          <circle cx="70" cy="22" r="4" fill="#8b5a2b" stroke="#fff" strokeWidth="0.5" />
          <circle cx="15" cy="36" r="4" fill="#8b5a2b" stroke="#fff" strokeWidth="0.5" />
          <circle cx="35" cy="36" r="4" fill="#8b5a2b" stroke="#fff" strokeWidth="0.5" />
          <circle cx="50" cy="36" r="4" fill="#8b5a2b" stroke="#fff" strokeWidth="0.5" />
          <circle cx="65" cy="36" r="4" fill="#8b5a2b" stroke="#fff" strokeWidth="0.5" />
          <circle cx="85" cy="36" r="4" fill="#8b5a2b" stroke="#fff" strokeWidth="0.5" />
          <circle cx="30" cy="50" r="4" fill="#8b5a2b" stroke="#fff" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="4" fill="#8b5a2b" stroke="#fff" strokeWidth="0.5" />
          <circle cx="70" cy="50" r="4" fill="#8b5a2b" stroke="#fff" strokeWidth="0.5" />
          <circle cx="50" cy="64" r="4" fill="#8b5a2b" stroke="#fff" strokeWidth="0.5" />
        </svg>
      )
    },
    {
      type: 'crescent',
      name: '偃月阵',
      desc: '弧形包围阵型，火力覆盖广，攻击面大',
      icon: (
        <svg viewBox="0 0 100 60" width="100%" height="100%">
          <path 
            d="M 10 50 Q 50 10 90 50" 
            fill="none" 
            stroke="rgba(255,255,255,0.3)" 
            strokeWidth="1" 
            strokeDasharray="4,4"
          />
          <circle cx="15" cy="45" r="4" fill="#8b5a2b" stroke="#fff" strokeWidth="0.5" />
          <circle cx="30" cy="30" r="4" fill="#8b5a2b" stroke="#fff" strokeWidth="0.5" />
          <circle cx="50" cy="20" r="4" fill="#8b5a2b" stroke="#fff" strokeWidth="0.5" />
          <circle cx="70" cy="30" r="4" fill="#8b5a2b" stroke="#fff" strokeWidth="0.5" />
          <circle cx="85" cy="45" r="4" fill="#8b5a2b" stroke="#fff" strokeWidth="0.5" />
          <circle cx="25" cy="48" r="4" fill="#8b5a2b" stroke="#fff" strokeWidth="0.5" />
          <circle cx="50" cy="35" r="4" fill="#8b5a2b" stroke="#fff" strokeWidth="0.5" />
          <circle cx="75" cy="48" r="4" fill="#8b5a2b" stroke="#fff" strokeWidth="0.5" />
          <circle cx="40" cy="50" r="4" fill="#8b5a2b" stroke="#fff" strokeWidth="0.5" />
          <circle cx="60" cy="50" r="4" fill="#8b5a2b" stroke="#fff" strokeWidth="0.5" />
        </svg>
      )
    }
  ];

  const windLevel = Math.floor(Math.random() * 3) + 5;

  return (
    <>
      <div className="panel-left">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="panel-title">水师阵型</div>
        </motion.div>

        <AnimatePresence>
          {formations.map((formation, index) => (
            <motion.div
              key={formation.type}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`glass-panel formation-card ${currentFormation === formation.type ? 'selected' : ''}`}
              onClick={() => onFormationChange(formation.type)}
              whileHover={{ scale: currentFormation === formation.type ? 1.05 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="formation-icon">
                {formation.icon}
              </div>
              <div className="formation-title">{formation.name}</div>
              <div className="formation-desc">{formation.desc}</div>
            </motion.div>
          ))}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="glass-panel"
        >
          <button
            className="fire-button"
            onClick={onFire}
            disabled={isFiring || isPaused}
          >
            {isFiring ? '炮击中...' : '🔥 发 射'}
          </button>
        </motion.div>
      </div>

      <div className="panel-right">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="panel-title">战况信息</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="glass-panel"
        >
          <div className="info-row">
            <span className="info-label">当前阵型</span>
            <span className="info-value">{stats.name}</span>
          </div>
          <div className="info-row">
            <span className="info-label">战船数量</span>
            <span className="info-value">20</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="glass-panel"
        >
          <div className="info-row">
            <span className="info-label">总火力值</span>
            <span className="info-value">{stats.firepower}</span>
          </div>
          <div className="progress-bar-container">
            <motion.div
              className="progress-bar"
              initial={{ width: 0 }}
              animate={{ width: `${stats.firepower}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{
                background: `linear-gradient(90deg, #2ecc71 0%, #f39c12 50%, #e74c3c 100%)`
              }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="glass-panel"
        >
          <div className="info-row">
            <span className="info-label">被击中概率</span>
            <span className="info-value">{stats.hitChance}%</span>
          </div>
          <div className="progress-bar-container">
            <motion.div
              className="progress-bar"
              initial={{ width: 0 }}
              animate={{ width: `${stats.hitChance}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{
                background: `linear-gradient(90deg, #2ecc71 0%, #f39c12 70%, #e74c3c 100%)`
              }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="glass-panel"
        >
          <button
            className="control-button"
            onClick={onTogglePause}
          >
            {isPaused ? '▶ 恢 复' : '⏸ 暂 停'}
          </button>
        </motion.div>
      </div>

      <div className="wind-indicator">
        <div className="compass">
          <div className="compass-rose" />
          <div className="compass-needle" />
        </div>
        <div className="wind-text">
          风力 {windLevel} 级
        </div>
      </div>
    </>
  );
};

export default Panel;

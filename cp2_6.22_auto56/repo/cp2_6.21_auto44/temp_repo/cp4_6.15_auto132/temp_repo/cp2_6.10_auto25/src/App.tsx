import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import MedicineCabinet from './components/MedicineCabinet';
import WeighingScale from './components/WeighingScale';
import FormulaNote from './components/FormulaNote';
import DecoctionPot from './components/DecoctionPot';
import HistoryPanel from './components/HistoryPanel';
import { useStore } from './store/useStore';
import { fetchMedicines } from './services/api';

const App: React.FC = () => {
  const { setMedicines, isPlaybackMode } = useStore();

  useEffect(() => {
    const loadMedicines = async () => {
      try {
        const data = await fetchMedicines();
        setMedicines(data);
      } catch (err) {
        console.error('加载药材数据失败', err);
      }
    };
    loadMedicines();
  }, [setMedicines]);

  return (
    <div className="min-h-screen p-4 md:p-6">
      <header className="text-center mb-6">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="brush-font text-4xl md:text-5xl text-[#5d3a1a] mb-2"
        >
          古代太医院药局
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-[#8b5a2b] text-sm"
        >
          中草药辨识 · 称量 · 配伍 · 煎熬 全流程模拟
        </motion.p>
      </header>

      <HistoryPanel />

      {isPlaybackMode && (
        <div className="fixed top-4 left-4 bg-[#6b4e3a] text-white px-4 py-2 rounded-lg z-40">
          <span className="brush-font">回放模式 - 1.5倍速</span>
        </div>
      )}

      <div className="main-layout flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1 lg:w-1/3"
        >
          <div className="paper-texture rounded-xl p-4">
            <MedicineCabinet />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex-1 lg:w-1/3 space-y-6"
        >
          <div className="paper-texture rounded-xl p-4">
            <WeighingScale />
          </div>
          <div className="paper-texture rounded-xl p-4">
            <FormulaNote />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="flex-1 lg:w-1/3"
        >
          <div className="paper-texture rounded-xl p-4">
            <DecoctionPot />
          </div>
        </motion.div>
      </div>

      <footer className="text-center mt-8 text-[#8b5a2b] text-xs opacity-70">
        <p>十八反：本草明言十八反，半蒌贝蔹及攻乌，藻戟遂芫俱战草，诸参辛芍叛藜芦</p>
        <p className="mt-1">十九畏：硫黄原是火中精，朴硝一见便相争，水银莫与砒霜见，狼毒最怕密陀僧</p>
      </footer>
    </div>
  );
};

export default App;

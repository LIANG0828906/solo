import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Home, ClockFile, ArrowLeft } from 'lucide-react';
import { AppProvider, useAppStore } from '@/shared/store';
import UploadZone from '@/upload/UploadZone';
import DiagnosisPanel from '@/diagnosis/DiagnosisPanel';
import HistoryList from '@/history/HistoryList';
import { DiagnosisRecord, Page } from '@/shared/types';
import './App.css';

const spring = {
  type: 'spring' as const,
  stiffness: 320,
  damping: 30,
};

function Navbar({ currentPage, onNavigate }: { currentPage: Page; onNavigate: (page: Page) => void }) {
  return (
    <motion.nav
      className="navbar"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={spring}
    >
      <div className="nav-container">
        <motion.div
          className="nav-brand"
          onClick={() => onNavigate('home')}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          transition={spring}
        >
          <div className="brand-icon">
            <Leaf size={24} />
          </div>
          <span className="brand-name">绿植诊所</span>
        </motion.div>
        <div className="nav-links">
          <motion.button
            className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => onNavigate('home')}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.96 }}
            transition={spring}
          >
            <Home size={18} />
            <span>诊断</span>
          </motion.button>
          <motion.button
            className={`nav-link ${currentPage === 'history' ? 'active' : ''}`}
            onClick={() => onNavigate('history')}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.96 }}
            transition={spring}
          >
            <ClockFile size={18} />
            <span>历史记录</span>
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
}

function HomePage() {
  return (
    <motion.div
      className="page home-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={spring}
    >
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.05 }}
      >
        <h1 className="page-title">植物健康诊断</h1>
        <p className="page-subtitle">上传叶片照片，AI智能识别病害，获取专业养护方案</p>
      </motion.div>
      <UploadZone />
      <DiagnosisPanel />
    </motion.div>
  );
}

function HistoryPage({ onViewRecord }: { onViewRecord: (record: DiagnosisRecord) => void }) {
  return (
    <motion.div
      className="page history-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={spring}
    >
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.05 }}
      >
        <h1 className="page-title">诊断历史</h1>
        <p className="page-subtitle">查看过往诊断记录，追踪植物健康状态</p>
      </motion.div>
      <HistoryList onViewRecord={onViewRecord} />
    </motion.div>
  );
}

function DetailPage({ record, onBack }: { record: DiagnosisRecord; onBack: () => void }) {
  const statusColors = {
    healthy: 'linear-gradient(90deg, #4CAF50, #81C784)',
    nutrient_deficiency: 'linear-gradient(90deg, #FBC02D, #FFD54F)',
    diseased: 'linear-gradient(90deg, #FF9800, #F44336)',
  };
  const statusLabels = {
    healthy: '健康',
    nutrient_deficiency: '营养不足',
    diseased: '病害',
  };
  const statusColorsHex = {
    healthy: '#4CAF50',
    nutrient_deficiency: '#FBC02D',
    diseased: '#E53935',
  };

  const date = new Date(record.createdAt);
  const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

  return (
    <motion.div
      className="page detail-page"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={spring}
    >
      <motion.button
        className="back-btn"
        onClick={onBack}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ ...spring, delay: 0.05 }}
        whileHover={{ scale: 1.05, x: -4 }}
        whileTap={{ scale: 0.97 }}
      >
        <ArrowLeft size={20} />
        <span>返回</span>
      </motion.button>

      <motion.div
        className="detail-severity-bar"
        style={{ background: statusColors[record.status] }}
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ ...spring, delay: 0.08 }}
      >
        <span className="detail-severity-label">严重等级</span>
        <span className="detail-severity-value">{statusLabels[record.status]}</span>
      </motion.div>

      <div className="detail-content">
        <motion.div
          className="detail-image-wrapper"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...spring, delay: 0.12 }}
        >
          <img src={record.imageUrl} alt={record.plantName} className="detail-image" />
        </motion.div>

        <div className="detail-info">
          <motion.div
            className="detail-header"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.16 }}
          >
            <div>
              <span className="detail-plant">{record.plantName}</span>
              <h1 className="detail-disease">{record.diseaseName}</h1>
              <p className="detail-date">诊断时间：{dateStr}</p>
            </div>
            <motion.div
              className="detail-confidence"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...spring, delay: 0.22 }}
            >
              <div className="confidence-ring large">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#E8F5E9" strokeWidth="8" />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={statusColorsHex[record.status]}
                    strokeWidth="8"
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    initial={{ strokeDasharray: '0 264' }}
                    animate={{ strokeDasharray: `${record.confidence * 2.64} 264` }}
                    transition={{ ...spring, delay: 0.3 }}
                  />
                </svg>
                <span className="confidence-value">{record.confidence}%</span>
                <span className="confidence-label">置信度</span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="detail-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.26 }}
          >
            <h3 className="detail-section-title">症状描述</h3>
            <p className="detail-symptoms">{record.symptoms}</p>
          </motion.div>

          <motion.div
            className="detail-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.32 }}
          >
            <h3 className="detail-section-title">护理建议</h3>
            <div className="detail-suggestions">
              <AnimatePresence>
                {record.suggestions.map((s, i) => (
                  <motion.div
                    key={s.id}
                    className="detail-suggestion-card"
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ ...spring, delay: 0.36 + i * 0.08 }}
                    whileHover={{ scale: 1.03, y: -3 }}
                  >
                    <h4>{s.title}</h4>
                    <p>{s.description}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function AppContent() {
  const { dispatch } = useAppStore();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [detailRecord, setDetailRecord] = useState<DiagnosisRecord | null>(null);

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    setDetailRecord(null);
  };

  const handleViewRecord = (record: DiagnosisRecord) => {
    dispatch({ type: 'SET_CURRENT_RECORD', payload: record });
    setDetailRecord(record);
    setCurrentPage('detail');
  };

  const handleBack = () => {
    setCurrentPage('history');
    setDetailRecord(null);
  };

  return (
    <div className="app-root">
      {currentPage !== 'detail' && <Navbar currentPage={currentPage} onNavigate={handleNavigate} />}
      <main className="app-main">
        <AnimatePresence mode="wait">
          {currentPage === 'home' && <HomePage key="home" />}
          {currentPage === 'history' && <HistoryPage key="history" onViewRecord={handleViewRecord} />}
          {currentPage === 'detail' && detailRecord && (
            <DetailPage key={`detail-${detailRecord.id}`} record={detailRecord} onBack={handleBack} />
          )}
        </AnimatePresence>
      </main>
      <footer className="app-footer">
        <p>© 2026 绿植诊所 - 让每一株植物都健康生长</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

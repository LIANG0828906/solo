import React, { useState } from 'react';
import { Leaf, Home, ClockFile, ArrowLeft } from 'lucide-react';
import { AppProvider, useAppStore } from '@/shared/store';
import UploadZone from '@/upload/UploadZone';
import DiagnosisPanel from '@/diagnosis/DiagnosisPanel';
import HistoryList from '@/history/HistoryList';
import { DiagnosisRecord, Page } from '@/shared/types';
import './App.css';

function Navbar({ currentPage, onNavigate }: { currentPage: Page; onNavigate: (page: Page) => void }) {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand" onClick={() => onNavigate('home')}>
          <div className="brand-icon">
            <Leaf size={24} />
          </div>
          <span className="brand-name">绿植诊所</span>
        </div>
        <div className="nav-links">
          <button
            className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => onNavigate('home')}
          >
            <Home size={18} />
            <span>诊断</span>
          </button>
          <button
            className={`nav-link ${currentPage === 'history' ? 'active' : ''}`}
            onClick={() => onNavigate('history')}
          >
            <ClockFile size={18} />
            <span>历史记录</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

function HomePage() {
  return (
    <div className="page home-page">
      <div className="page-header">
        <h1 className="page-title">植物健康诊断</h1>
        <p className="page-subtitle">上传叶片照片，AI智能识别病害，获取专业养护方案</p>
      </div>
      <UploadZone />
      <DiagnosisPanel />
    </div>
  );
}

function HistoryPage({ onViewRecord }: { onViewRecord: (record: DiagnosisRecord) => void }) {
  return (
    <div className="page history-page">
      <div className="page-header">
        <h1 className="page-title">诊断历史</h1>
        <p className="page-subtitle">查看过往诊断记录，追踪植物健康状态</p>
      </div>
      <HistoryList onViewRecord={onViewRecord} />
    </div>
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

  const date = new Date(record.createdAt);
  const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

  return (
    <div className="page detail-page">
      <button className="back-btn" onClick={onBack}>
        <ArrowLeft size={20} />
        <span>返回</span>
      </button>

      <div
        className="detail-severity-bar"
        style={{ background: statusColors[record.status] }}
      >
        <span className="detail-severity-label">严重等级</span>
        <span className="detail-severity-value">{statusLabels[record.status]}</span>
      </div>

      <div className="detail-content">
        <div className="detail-image-wrapper">
          <img src={record.imageUrl} alt={record.plantName} className="detail-image" />
        </div>

        <div className="detail-info">
          <div className="detail-header">
            <div>
              <span className="detail-plant">{record.plantName}</span>
              <h1 className="detail-disease">{record.diseaseName}</h1>
              <p className="detail-date">诊断时间：{dateStr}</p>
            </div>
            <div className="detail-confidence">
              <div className="confidence-ring large">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#E8F5E9" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={record.status === 'healthy' ? '#4CAF50' : record.status === 'diseased' ? '#E53935' : '#FBC02D'}
                    strokeWidth="8"
                    strokeDasharray={`${record.confidence * 2.64} 264`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    className="confidence-fill"
                  />
                </svg>
                <span className="confidence-value">{record.confidence}%</span>
                <span className="confidence-label">置信度</span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3 className="detail-section-title">症状描述</h3>
            <p className="detail-symptoms">{record.symptoms}</p>
          </div>

          <div className="detail-section">
            <h3 className="detail-section-title">护理建议</h3>
            <div className="detail-suggestions">
              {record.suggestions.map((s, i) => (
                <div key={s.id} className="detail-suggestion-card" style={{ animationDelay: `${i * 0.1}s` }}>
                  <h4>{s.title}</h4>
                  <p>{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
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
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'history' && <HistoryPage onViewRecord={handleViewRecord} />}
        {currentPage === 'detail' && detailRecord && <DetailPage record={detailRecord} onBack={handleBack} />}
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

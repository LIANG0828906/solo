import { useEffect } from 'react';
import EventBridge from './EventBridge';
import useAppStore from './store/useAppStore';
import ApplicationForm from './application/ApplicationForm';
import ResultDashboard from './result/ResultDashboard';
import type { ApplicationData, AssessmentResult } from './types';

function ProcessingPage() {
  return (
    <div className="processing-container">
      <div className="spinner-ring"></div>
      <p className="processing-text">正在评估您的信用...</p>
    </div>
  );
}

function Navbar() {
  const { reset, currentPage } = useAppStore();
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="logo" onClick={reset}>
          <span className="logo-icon">💰</span>
          <span className="logo-text">LoanFlow</span>
        </div>
        {currentPage === 'result' && (
          <button className="btn btn-primary navbar-btn" onClick={reset}>
            重新申请
          </button>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  const { currentPage, setCurrentPage, setApplicationData, setAssessmentResult, reset } = useAppStore();

  useEffect(() => {
    const unsub1 = EventBridge.on('application:submitted', (data) => {
      const appData = data as ApplicationData;
      setApplicationData(appData);
      setCurrentPage('processing');
    });

    const unsub2 = EventBridge.on('assessment:result', (data) => {
      const result = data as AssessmentResult;
      setAssessmentResult(result);
      setTimeout(() => {
        setCurrentPage('result');
      }, 3000);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [setCurrentPage, setApplicationData, setAssessmentResult]);

  return (
    <div className="app-root">
      <Navbar />
      <main className="main-content">
        <div className="page-transition">
          {currentPage === 'application' && <ApplicationForm key="app" />}
          {currentPage === 'processing' && <ProcessingPage key="proc" />}
          {currentPage === 'result' && <ResultDashboard key="res" onRestart={reset} />}
        </div>
      </main>
    </div>
  );
}

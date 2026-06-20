import { useEffect, useState, useCallback } from 'react';
import { eventBridge } from './EventBridge';
import { useAppStore } from './store';
import { ApplicationForm } from './application/ApplicationForm';
import { ResultDashboard } from './result/ResultDashboard';

function Navbar() {
  const reset = useAppStore((s) => s.reset);
  const currentPage = useAppStore((s) => s.currentPage);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleReset = useCallback(() => {
    reset();
    setMenuOpen(false);
  }, [reset]);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="navbar-logo">L</div>
          <span className="navbar-title">LoanFlow</span>
        </div>
        <div className="navbar-actions">
          {currentPage !== 'application' && (
            <button className="navbar-reset" onClick={handleReset}>
              重新申请
            </button>
          )}
        </div>
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <span />
          <span />
          <span />
        </button>
      </nav>
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        {currentPage !== 'application' && (
          <button className="navbar-reset" onClick={handleReset}>
            重新申请
          </button>
        )}
      </div>
    </>
  );
}

function AssessmentPage() {
  return (
    <div className="assessment-page">
      <div className="spinner-wrapper">
        <div className="spinner-ring" />
      </div>
      <p className="assessment-text">正在评估您的信用...</p>
    </div>
  );
}

export default function App() {
  const currentPage = useAppStore((s) => s.currentPage);
  const setAssessmentResult = useAppStore((s) => s.setAssessmentResult);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);

  useEffect(() => {
    const unsubscribe = eventBridge.on('result', (result) => {
      setAssessmentResult(result);
      setCurrentPage('result');
    });
    return unsubscribe;
  }, [setAssessmentResult, setCurrentPage]);

  return (
    <>
      <Navbar />
      <div className="page-container">
        {currentPage === 'application' && <ApplicationForm />}
        {currentPage === 'assessment' && <AssessmentPage />}
        {currentPage === 'result' && <ResultDashboard />}
      </div>
    </>
  );
}

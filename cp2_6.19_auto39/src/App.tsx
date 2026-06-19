import { useMemo, useState, useEffect } from 'react';
import { useContractStore } from './store/useContractStore';
import ClauseBlock from './components/ClauseBlock';
import RevisionPanel from './components/RevisionPanel';
import AcceptSignArea from './components/AcceptSignArea';
import type { Role } from './types';
import './App.css';

function App() {
  const {
    title,
    clauses,
    revisions,
    currentRole,
    initiatorSignature,
    receiverSignature,
    showConfirmModal,
    setCurrentRole,
    setShowConfirmModal,
    resetContract,
  } = useContractStore();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);

  useEffect(() => {
    if (showConfirmModal) {
      setIsModalVisible(true);
      setIsModalClosing(false);
    }
  }, [showConfirmModal]);

  const modifiedClausesCount = useMemo(() => {
    const clauseIds = new Set(
      revisions.filter((r) => r.status === 'accepted').map((r) => r.clauseId)
    );
    return clauseIds.size;
  }, [revisions]);

  const handleCloseModal = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setIsModalVisible(false);
      setShowConfirmModal(false);
      setIsModalClosing(false);
    }, 300);
  };

  const handleReset = () => {
    if (confirm('确定要重置合同吗？所有批注和签名都将被清除。')) {
      resetContract();
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">
            <svg viewBox="0 0 24 24" fill="none" className="title-icon">
              <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="14 2 14 8 20 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            合同条款协商与签名系统
          </h1>

          <div className="header-actions">
            <div className="role-switcher">
              <span className="role-label">当前身份：</span>
              <div className="role-buttons">
                <button
                  className={`role-btn ${
                    currentRole === 'initiator' ? 'active' : ''
                  }`}
                  onClick={() => setCurrentRole('initiator' as Role)}
                >
                  发起方
                </button>
                <button
                  className={`role-btn ${
                    currentRole === 'receiver' ? 'active' : ''
                  }`}
                  onClick={() => setCurrentRole('receiver' as Role)}
                >
                  接收方
                </button>
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={handleReset}>
              重置合同
            </button>
          </div>
        </div>
      </header>

      <div className="main-content">
        <div className="content-area">
          <div className="contract-card">
            <div className="contract-header">
              <h2 className="contract-title">{title}</h2>
              <div className="contract-meta">
                <span className="meta-item">
                  共 {clauses.length} 条条款
                </span>
                <span className="meta-item">
                  已修改 {modifiedClausesCount} 条
                </span>
              </div>
            </div>

            <div className="clauses-list">
              {clauses.map((clause) => (
                <ClauseBlock key={clause.id} clause={clause} />
              ))}
            </div>
          </div>

          <div className="signature-section">
            <h3 className="section-title">签名确认</h3>
            <div className="signatures-grid">
              <AcceptSignArea role="initiator" />
              <AcceptSignArea role="receiver" />
            </div>
          </div>
        </div>

        <RevisionPanel />
      </div>

      {isModalVisible && (
        <div
          className={`modal-overlay ${isModalClosing ? 'closing' : ''}`}
          onClick={handleCloseModal}
        >
          <div
            className={`modal-content ${isModalClosing ? 'closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={handleCloseModal}
              aria-label="关闭"
            >
              <svg viewBox="0 0 24 24" fill="none">
                <line
                  x1="18"
                  y1="6"
                  x2="6"
                  y2="18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="6"
                  y1="6"
                  x2="18"
                  y2="18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <div className="confirm-card">
              <div className="confirm-header">
                <div className="success-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 6L9 17l-5-5"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="confirm-title">合同签署完成</h3>
                <p className="confirm-subtitle">
                  双方已完成签名，合同正式生效
                </p>
              </div>

              <div className="confirm-summary">
                <h4 className="summary-title">合同摘要</h4>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="summary-label">合同名称</span>
                    <span className="summary-value">{title}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">条款总数</span>
                    <span className="summary-value">{clauses.length} 条</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">已修改条款</span>
                    <span className="summary-value">
                      {modifiedClausesCount} 条
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">签署时间</span>
                    <span className="summary-value">
                      {new Date().toLocaleString('zh-CN')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="confirm-signatures">
                <div className="signature-block">
                  <span className="signature-label">发起方签名</span>
                  {initiatorSignature && (
                    <img
                      src={initiatorSignature.dataUrl}
                      alt="发起方签名"
                      className="signature-image"
                    />
                  )}
                  <span className="signature-date">
                    {initiatorSignature &&
                      new Date(initiatorSignature.signedAt).toLocaleString(
                        'zh-CN'
                      )}
                  </span>
                </div>
                <div className="signature-block">
                  <span className="signature-label">接收方签名</span>
                  {receiverSignature && (
                    <img
                      src={receiverSignature.dataUrl}
                      alt="接收方签名"
                      className="signature-image"
                    />
                  )}
                  <span className="signature-date">
                    {receiverSignature &&
                      new Date(receiverSignature.signedAt).toLocaleString(
                        'zh-CN'
                      )}
                  </span>
                </div>
              </div>

              <div className="confirm-footer">
                <button
                  className="btn btn-primary"
                  onClick={handleCloseModal}
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

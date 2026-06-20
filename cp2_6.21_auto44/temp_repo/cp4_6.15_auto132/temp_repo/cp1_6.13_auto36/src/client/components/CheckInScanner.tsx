import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { checkInAPI } from '../services/api';
import type { CheckInRecord } from '../types';

interface ScanResult {
  eventCode: string;
  eventTitle?: string;
  participantName?: string;
  checkInTime?: string;
  alreadyChecked?: boolean;
  message?: string;
}

export default function CheckInScanner() {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [manualName, setManualName] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const processingRef = useRef(false);

  const startScanner = useCallback(async () => {
    if (!scannerRef.current || html5QrCodeRef.current) return;

    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          if (processingRef.current) return;
          processingRef.current = true;

          try {
            const code = extractEventCode(decodedText);
            if (code) {
              handleCodeDetected(code);
            }
          } finally {
            setTimeout(() => {
              processingRef.current = false;
            }, 1500);
          }
        },
        () => {}
      );
      setScanning(true);
      setScannerReady(true);
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setShowManual(true);
    }
  }, []);

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.error('Failed to stop scanner:', err);
      }
      html5QrCodeRef.current = null;
    }
    setScanning(false);
    setScannerReady(false);
  }, []);

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, [startScanner, stopScanner]);

  const extractEventCode = (text: string): string | null => {
    const match = text.match(/(?:code[:=])?([A-Z0-9]{6})/i);
    if (match) return match[1].toUpperCase();
    if (/^[A-Z0-9]{6}$/i.test(text.trim())) return text.trim().toUpperCase();
    return null;
  };

  const handleCodeDetected = async (code: string) => {
    setPendingCode(code);
    setScanResult({ eventCode: code });
    setShowModal(true);
  };

  const handleConfirmCheckIn = async () => {
    if (!pendingCode || !manualName.trim()) return;

    setSubmitting(true);
    const startTime = Date.now();
    try {
      const result = await checkInAPI.submit(pendingCode, manualName.trim());
      const elapsed = Date.now() - startTime;
      const minDelay = elapsed < 1000 ? 1000 - elapsed : 0;
      
      setTimeout(() => {
        setScanResult({
          eventCode: pendingCode!,
          eventTitle: result.eventTitle,
          participantName: result.participantName,
          checkInTime: result.checkInTime,
          alreadyChecked: result.alreadyChecked,
          message: result.message,
        });
        setSubmitting(false);
      }, minDelay);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || '签到失败，请重试';
      setScanResult({
        eventCode: pendingCode!,
        alreadyChecked: false,
        message: errorMsg,
      });
      setSubmitting(false);
    }
  };

  const handleManualSubmit = () => {
    const code = manualCode.trim().toUpperCase();
    if (code) {
      handleCodeDetected(code);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setScanResult(null);
    setPendingCode(null);
    setManualName('');
    processingRef.current = false;
  };

  const hasConfirmed = scanResult && scanResult.participantName;
  const isWarning = scanResult?.alreadyChecked;

  return (
    <div className="scanner-container">
      <div className="scanner-wrapper">
        {!showManual && scannerReady ? (
          <div id="qr-reader" ref={scannerRef} style={{ width: '100%', height: '100%' }} />
        ) : (
          <div className="scanner-placeholder">
            {showManual ? (
              <>
                <div className="scanner-icon">🔢</div>
                <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>手动输入活动编码</div>
                <div className="scanner-hint">摄像头不可用，可手动输入6位活动编码</div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', width: '80%', maxWidth: '360px' }}>
                  <input
                    type="text"
                    placeholder="输入6位编码"
                    value={manualCode}
                    onChange={e => setManualCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    style={{ flex: 1, fontFamily: "'Courier New', monospace", letterSpacing: '2px', textAlign: 'center', fontSize: '18px' }}
                  />
                  <button className="btn btn-primary" onClick={handleManualSubmit}>
                    确认
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="scanner-icon">📷</div>
                <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>正在启动摄像头...</div>
                <div className="scanner-hint">请授予摄像头权限以扫描二维码</div>
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {showManual ? (
          <button className="btn btn-secondary" onClick={() => { setShowManual(false); startScanner(); }}>
            📷 使用摄像头
          </button>
        ) : (
          <button className="btn btn-secondary" onClick={() => { stopScanner(); setShowManual(true); }}>
            🔢 手动输入编码
          </button>
        )}
      </div>

      <div style={{ fontSize: '13px', color: 'var(--text-light)', textAlign: 'center', maxWidth: 500 }}>
        将二维码对准扫描框即可自动识别，识别成功后在弹窗中填写姓名完成签到
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div
            className={'modal' + (isWarning ? ' warning' : '')}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">
                {hasConfirmed ? (scanResult?.alreadyChecked ? '⚠️ 重复签到' : '✅ 签到成功') : '签到确认'}
              </h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>

            <div className="modal-body">
              {!hasConfirmed ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ textAlign: 'center', padding: '12px', background: 'var(--background)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>活动编码</div>
                    <div style={{ fontFamily: "'Courier New', monospace", fontSize: '24px', fontWeight: 700, color: 'var(--primary)', letterSpacing: '4px' }}>
                      {pendingCode}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">参与者姓名 *</label>
                    <input
                      type="text"
                      placeholder="请输入您的姓名"
                      value={manualName}
                      onChange={e => setManualName(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
              ) : scanResult?.alreadyChecked ? (
                <>
                  <div className="checkin-warning-icon">⚠️</div>
                  <div className="checkin-warning-text">
                    {scanResult.message || '已签到，不可重复签到'}
                  </div>
                  <div className="checkin-info">
                    <div className="checkin-name">{scanResult.participantName}</div>
                    <div className="checkin-event">{scanResult.eventTitle}</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="checkin-success-icon">✅</div>
                  <div className="checkin-info">
                    <div className="checkin-name">{scanResult?.participantName}</div>
                    <div className="checkin-event">{scanResult?.eventTitle}</div>
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '12px' }}>
                    <div className="checkin-time-label">签到时间</div>
                    <div className="checkin-time-value">
                      {scanResult?.checkInTime && new Date(scanResult.checkInTime).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              {!hasConfirmed ? (
                <>
                  <button className="btn btn-secondary" onClick={handleCloseModal}>
                    取消
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleConfirmCheckIn}
                    disabled={submitting || !manualName.trim()}
                  >
                    {submitting ? '签到中...' : '确认签到'}
                  </button>
                </>
              ) : (
                <button className="btn btn-primary" onClick={handleCloseModal}>
                  完成
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { ParticipantData, EventData } from './types';
import { Html5Qrcode } from 'html5-qrcode';

interface AdminPanelProps {
  eventId: string;
  onBack: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

interface ScanCodeReaderProps {
  onResult: (code: string) => void;
  onError: (error: string) => void;
}

function ScanCodeReader({ onResult, onError }: ScanCodeReaderProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'qr-reader-container';
  const handledRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      (decodedText) => {
        if (!handledRef.current) {
          handledRef.current = true;
          onResult(decodedText);
          setTimeout(() => {
            handledRef.current = false;
          }, 1500);
        }
      },
      () => {}
    ).catch((err) => {
      onError(err.message || '无法启动摄像头');
    });

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [onResult, onError]);

  return (
    <div
      id={containerId}
      style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}
    />
  );
}

function AdminPanel({ eventId, onBack, showToast }: AdminPanelProps) {
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [event, setEvent] = useState<EventData | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [flashingId, setFlashingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const fetchParticipants = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/participants`);
      const data = await res.json();
      setParticipants(data);
    } catch (err) {
      console.error('获取参与者列表失败:', err);
    }
  }, [eventId]);

  const fetchEvent = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`);
      const data = await res.json();
      setEvent(data);
    } catch (err) {
      console.error('获取活动信息失败:', err);
    }
  }, [eventId]);

  useEffect(() => {
    fetchParticipants();
    fetchEvent();
  }, [fetchParticipants, fetchEvent]);

  const handleCheckIn = useCallback(
    async (participantId: string) => {
      try {
        const res = await fetch(`/api/events/${eventId}/checkin`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ participantId }),
        });

        if (res.ok) {
          await res.json();
          fetchParticipants();
          setFlashingId(participantId);
          setTimeout(() => setFlashingId(null), 600);
          showToast('签到成功', 'success');
        } else {
          const errData = await res.json();
          showToast(errData.error || '签到失败', 'error');
        }
      } catch (err) {
        showToast('签到失败', 'error');
      }
    },
    [eventId, fetchParticipants, showToast]
  );

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/export`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${event?.name || 'participants'}_参与者名单.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast('导出成功', 'success');
    } catch (err) {
      showToast('导出失败', 'error');
    } finally {
      setExporting(false);
    }
  }, [eventId, event?.name, showToast]);

  const handleScanResult = useCallback(
    async (checkInCode: string) => {
      try {
        const res = await fetch(`/api/events/${eventId}/checkin`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ checkInCode }),
        });

        if (res.ok) {
          const data = await res.json();
          fetchParticipants();
          setFlashingId(data.id);
          setTimeout(() => setFlashingId(null), 600);
          showToast(`签到成功：${data.name}`, 'success');
        } else {
          const errData = await res.json();
          showToast(errData.error || '签到失败', 'error');
        }
      } catch (err) {
        showToast('签到失败', 'error');
      }
    },
    [eventId, fetchParticipants, showToast]
  );

  const handleScanError = useCallback(
    (error: string) => {
      showToast(`扫码错误：${error}`, 'error');
    },
    [showToast]
  );

  return (
    <div className="admin-layout">
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn-secondary" onClick={onBack}>
            ← 返回
          </button>
          <h1>管理员后台 - {event?.name || '加载中...'}</h1>
        </div>
      </div>

      {showScanner && (
        <div className="scan-section">
          <h3>扫码签到</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="qr-reader">
              <ScanCodeReader onResult={handleScanResult} onError={handleScanError} />
            </div>
            <button className="btn-secondary" onClick={() => setShowScanner(false)}>
              关闭扫描
            </button>
          </div>
        </div>
      )}

      {!showScanner && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={() => setShowScanner(true)}>
            📷 打开扫码
          </button>
        </div>
      )}

      <div className="participants-table">
        <table>
          <thead>
            <tr>
              <th>姓名</th>
              <th>联系方式</th>
              <th>角色</th>
              <th>签到码</th>
              <th>报名时间</th>
              <th>签到状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {participants.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                  暂无报名者
                </td>
              </tr>
            ) : (
              participants.map((p) => (
                <tr
                  key={p.id}
                  className={`${selectedRowId === p.id ? 'selected' : ''} ${
                    flashingId === p.id ? 'flash-green' : ''
                  }`}
                  onClick={() => setSelectedRowId(p.id)}
                >
                  <td>{p.name}</td>
                  <td>{p.contact}</td>
                  <td>{p.role}</td>
                  <td style={{ fontFamily: 'monospace', letterSpacing: '2px' }}>
                    {p.checkInCode}
                  </td>
                  <td>{new Date(p.registeredAt).toLocaleString('zh-CN')}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        p.checkedIn ? 'status-checked' : 'status-pending'
                      }`}
                    >
                      {p.checkedIn ? '已签到' : '未签到'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-success"
                      disabled={p.checkedIn}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!p.checkedIn) handleCheckIn(p.id);
                      }}
                    >
                      {p.checkedIn ? '已签到' : '签到'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="export-section">
        <button className="btn-primary" onClick={handleExport} disabled={exporting}>
          {exporting && <span className="loading-spinner" />}
          {exporting ? '导出中...' : '📥 导出CSV'}
        </button>
      </div>
    </div>
  );
}

export default AdminPanel;

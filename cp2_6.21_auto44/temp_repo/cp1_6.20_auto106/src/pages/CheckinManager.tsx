import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, Camera, ScanLine, Plus, Check, Volume2, X } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import { CheckinLog } from '../components/CheckinLog';
import { CheckinLogItem, CheckinEvent } from '../types';

export function CheckinManager() {
  const { id } = useParams<{ id: string }>();
  const [eventName, setEventName] = useState('');
  const [stats, setStats] = useState({ total: 0, checkedIn: 0 });
  const [logs, setLogs] = useState<CheckinLogItem[]>([]);
  const [manualId, setManualId] = useState('');
  const [manualError, setManualError] = useState('');
  const [showCheckmark, setShowCheckmark] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const { onCheckin } = useSocket(id || null);

  useEffect(() => {
    onCheckin((data: CheckinEvent) => {
      const newLog: CheckinLogItem = {
        id: data.registrationId,
        name: data.name,
        checkinTime: data.checkinTime,
        checkinSequence: data.checkinSequence,
        isNew: true
      };

      setLogs(prev => [newLog, ...prev]);
      setStats(prev => ({ ...prev, checkedIn: prev.checkedIn + 1 }));

      setTimeout(() => {
        setLogs(prev => prev.map(log =>
          log.id === data.registrationId ? { ...log, isNew: false } : log
        ));
      }, 1000);
    });
  }, [onCheckin]);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const [eventResponse, statsResponse, logsResponse] = await Promise.all([
          fetch(`/api/events/${id}`),
          fetch(`/api/events/${id}/stats`),
          fetch(`/api/events/${id}/registrations`)
        ]);

        const eventData = await eventResponse.json();
        const statsData = await statsResponse.json();
        const logsData = await logsResponse.json();

        if (eventResponse.ok) {
          setEventName(eventData.name);
        }

        if (statsResponse.ok) {
          setStats({
            total: statsData.total,
            checkedIn: statsData.checkedIn
          });
        }

        if (logsResponse.ok) {
          const checkedInLogs = logsData
            .filter((r: { checkedIn: boolean; checkinTime?: string; checkinSequence?: number; name: string; id: string }) => r.checkedIn)
            .sort((a: { checkinTime?: string }, b: { checkinTime?: string }) =>
              new Date(b.checkinTime!).getTime() - new Date(a.checkinTime!).getTime()
            )
            .map((r: { id: string; name: string; checkinTime: string; checkinSequence: number }) => ({
              id: r.id,
              name: r.name,
              checkinTime: r.checkinTime!,
              checkinSequence: r.checkinSequence!
            }));
          setLogs(checkedInLogs);
        }
      } catch (error) {
        console.error('Failed to fetch event data:', error);
      }
    };

    if (id) {
      fetchEventData();
    }
  }, [id]);

  const playBeep = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = 880;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (error) {
      console.error('Failed to play beep:', error);
    }
  }, []);

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
        startScan();
      }
    } catch (error) {
      setCameraError('无法访问摄像头，请确保已授权摄像头权限');
      console.error('Camera error:', error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setCameraActive(false);
  };

  const startScan = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    scanIntervalRef.current = window.setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || isProcessing) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQRDecode(imageData);
        
        if (code) {
          const qrData = JSON.parse(code);
          if (qrData.eventId === id && qrData.registrationId) {
            await handleCheckin(qrData.registrationId);
          }
        }
      } catch (error) {
        // Skip decode errors
      }
    }, 500);
  };

  const jsQRDecode = (imageData: ImageData): string | null => {
    return null;
  };

  const handleCheckin = async (registrationId: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const response = await fetch(`/api/events/${id}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ registrationId })
      });

      if (response.ok) {
        playBeep();
        setShowCheckmark(true);
        setTimeout(() => setShowCheckmark(false), 1000);
      } else {
        const data = await response.json();
        throw new Error(data.error || '签到失败');
      }
    } catch (error) {
      console.error('Checkin error:', error);
    } finally {
      setTimeout(() => setIsProcessing(false), 1000);
    }
  };

  const handleManualCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError('');

    if (!manualId.trim()) {
      setManualError('请输入报名ID');
      return;
    }

    await handleCheckin(manualId.trim());
    setManualId('');
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const attendanceRate = stats.total > 0 ? ((stats.checkedIn / stats.total) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="bg-primary text-white py-6 px-4">
        <div className="container mx-auto">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回登录
          </Link>
          <h1 className="text-3xl font-bold">{eventName || '签到管理'}</h1>
          <p className="text-white/70 mt-2">实时签到管理控制台</p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-500">总报名人数</p>
                <p className="text-3xl font-bold text-primary">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center">
                <Check className="w-7 h-7 text-success" />
              </div>
              <div>
                <p className="text-sm text-gray-500">已签到人数</p>
                <p className="text-3xl font-bold text-success">{stats.checkedIn}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-warning/10 rounded-full flex items-center justify-center">
                <ScanLine className="w-7 h-7 text-warning" />
              </div>
              <div>
                <p className="text-sm text-gray-500">签到率</p>
                <p className="text-3xl font-bold text-warning">{attendanceRate}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  扫码签到
                </h2>
                {!cameraActive ? (
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-all hover:scale-[1.05] active:scale-[0.98] flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    开启摄像头
                  </button>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all hover:scale-[1.05] active:scale-[0.98] flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    关闭摄像头
                  </button>
                )}
              </div>

              {cameraError && (
                <div className="p-4 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm mb-4">
                  {cameraError}
                </div>
              )}

              <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video">
                {cameraActive ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-8 border-2 border-dashed border-white/30 rounded-lg" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <ScanLine className="w-8 h-8 text-white/50 animate-pulse" />
                      </div>
                    </div>
                    {showCheckmark && (
                      <div className="absolute inset-0 bg-success/30 flex items-center justify-center animate-checkmark">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                          <Check className="w-16 h-16 text-success" />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
                    <Camera className="w-16 h-16 mb-4" />
                    <p>摄像头未开启</p>
                    <p className="text-sm">点击上方按钮开启扫码</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
                <Volume2 className="w-4 h-4" />
                <span>扫码成功后会播放"嘀"的提示音</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                手动签到
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                扫码失败时可手动输入报名ID进行签到
              </p>
              <form onSubmit={handleManualCheckin} className="flex gap-3">
                <input
                  type="text"
                  value={manualId}
                  onChange={(e) => {
                    setManualId(e.target.value);
                    setManualError('');
                  }}
                  placeholder="请输入报名ID"
                  className={`
                    flex-1 px-4 py-3 rounded-lg border-2 transition-all
                    focus:outline-none focus:ring-2 focus:ring-primary/30
                    ${manualError
                      ? 'border-danger focus:border-danger focus:ring-danger/30'
                      : 'border-gray-200 focus:border-primary'
                    }
                  `}
                />
                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`
                    px-6 py-3 rounded-lg font-semibold text-white
                    transition-all duration-200 flex items-center gap-2
                    hover:scale-[1.05] active:scale-[0.98]
                    ${isProcessing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-success hover:bg-success-light'
                    }
                  `}
                >
                  <Check className="w-5 h-5" />
                  签到
                </button>
              </form>
              {manualError && (
                <p className="text-danger text-sm mt-2">{manualError}</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
              <ScanLine className="w-5 h-5" />
              实时签到日志
              <span className="text-sm font-normal text-gray-500 ml-auto">
                共 {logs.length} 条记录
              </span>
            </h2>
            <CheckinLog logs={logs} />
          </div>
        </div>
      </main>
    </div>
  );
}

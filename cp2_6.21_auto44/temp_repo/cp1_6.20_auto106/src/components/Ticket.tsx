import { useEffect, useRef } from 'react';
import { Calendar, MapPin, Clock, User } from 'lucide-react';

interface TicketProps {
  eventName: string;
  userName: string;
  qrcodeUrl: string;
  registrationId: string;
  createdAt: string;
  eventDate: string;
  eventLocation: string;
}

export function Ticket({
  eventName,
  userName,
  qrcodeUrl,
  registrationId,
  createdAt,
  eventDate,
  eventLocation
}: TicketProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      alpha: number;
    }> = [];

    const colors = ['#2ecc71', '#3498db', '#f1c40f', '#e74c3c', '#9b59b6'];

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * rect.width,
        y: rect.height + Math.random() * 100,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 3 - 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 4 + 2,
        alpha: Math.random() * 0.5 + 0.3
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);

      particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02;
        p.alpha -= 0.002;

        if (p.alpha <= 0) {
          particles[index] = {
            ...p,
            y: rect.height + Math.random() * 50,
            alpha: Math.random() * 0.5 + 0.3
          };
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="relative animate-fade-in">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      />

      <div
        className="relative bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md mx-auto"
        style={{ zIndex: 1 }}
      >
        <div className="bg-gradient-to-r from-primary to-primary-light p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{eventName}</h2>
              <p className="text-white/70 text-sm mt-1">电子票券</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">🎫</span>
            </div>
          </div>
        </div>

        <div className="border-t-2 border-dashed border-gray-200 relative">
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-background rounded-full" />
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-background rounded-full" />
        </div>

        <div className="p-6">
          <div className="bg-gray-50 rounded-2xl p-6 mb-6">
            <img
              src={qrcodeUrl}
              alt="签到二维码"
              className="w-48 h-48 mx-auto"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">持票人</p>
                <p className="font-medium text-primary">{userName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">活动时间</p>
                <p className="font-medium text-primary">{formatDate(eventDate)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">活动地点</p>
                <p className="font-medium text-primary">{eventLocation}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">报名时间</p>
                <p className="font-medium text-primary">{formatDate(createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              票券编号: {registrationId.slice(0, 8)}...{registrationId.slice(-8)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

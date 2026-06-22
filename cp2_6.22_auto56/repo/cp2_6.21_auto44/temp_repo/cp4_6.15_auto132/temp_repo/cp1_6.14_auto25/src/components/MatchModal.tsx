import React, { useEffect, useRef } from 'react';
import { Heart } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { getInitials } from '../utils/helpers';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  angle: number;
  speed: number;
  opacity: number;
  life: number;
}

const PARTICLE_COLORS = ['#FF6B6B', '#FF8E8E', '#FFB26B', '#FF4757', '#FF6348', '#FF7979'];

const MatchModal: React.FC = () => {
  const { showMatchModal, setShowMatchModal, matchedUser, currentUser } = useStore();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!showMatchModal || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.parentElement?.getBoundingClientRect();
    canvas.width = rect?.width || 400;
    canvas.height = rect?.height || 400;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    startTimeRef.current = Date.now();

    particlesRef.current = Array.from({ length: 40 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 40 + (Math.random() - 0.5) * 0.5;
      return {
        id: i,
        x: centerX,
        y: centerY,
        size: Math.random() * 16 + 8,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        angle,
        speed: Math.random() * 3 + 2,
        opacity: 1,
        life: 1,
      };
    });

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const duration = 2000;
      const progress = Math.min(elapsed / duration, 1);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        const eased = 1 - Math.pow(1 - progress, 3);
        const distance = p.speed * eased * 80;
        const x = centerX + Math.cos(p.angle) * distance;
        const y = centerY + Math.sin(p.angle) * distance;
        const opacity = Math.max(0, 1 - progress);
        const scale = 1 - progress * 0.5;

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        ctx.beginPath();
        const topCurveHeight = p.size * 0.3;
        ctx.moveTo(0, topCurveHeight);
        ctx.bezierCurveTo(
          p.size / 2, -topCurveHeight,
          p.size, topCurveHeight * 0.5,
          0, p.size
        );
        ctx.bezierCurveTo(
          -p.size, topCurveHeight * 0.5,
          -p.size / 2, -topCurveHeight,
          0, topCurveHeight
        );
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.restore();
      });

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [showMatchModal]);

  if (!showMatchModal || !matchedUser) return null;

  const handleClose = () => {
    setShowMatchModal(false);
  };

  const handleGoChat = () => {
    setShowMatchModal(false);
    navigate('/chat');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full animate-[scaleIn_0.3s_ease-out]">
        <div className="relative h-48 bg-gradient-to-br from-[#FF6B6B] to-[#FFB26B] flex items-center justify-center overflow-hidden">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
          />

          <div className="relative z-10 flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg border-4 border-white/30"
              style={{ backgroundColor: currentUser?.avatarColor || '#FF6B6B' }}
            >
              {currentUser ? getInitials(currentUser.nickname) : '我'}
            </div>
            <Heart className="w-10 h-10 text-white animate-pulse" fill="white" />
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg border-4 border-white/30"
              style={{ backgroundColor: matchedUser.avatarColor }}
            >
              {getInitials(matchedUser.nickname)}
            </div>
          </div>
        </div>

        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">🎉 匹配成功！</h2>
          <p className="text-gray-500 mb-1">
            你和 <span className="font-semibold text-[#FF6B6B]">{matchedUser.nickname}</span> 互发心动信号
          </p>
          <p className="text-gray-400 text-sm mb-6">缘分从此刻开始 💕</p>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              继续浏览
            </button>
            <button
              onClick={handleGoChat}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FFB26B] text-white font-bold shadow-lg hover:shadow-xl transition-all"
            >
              开始聊天 💬
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchModal;

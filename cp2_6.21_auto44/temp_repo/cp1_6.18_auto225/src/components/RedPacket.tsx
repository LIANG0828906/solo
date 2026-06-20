import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Sparkles, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import type { Activity } from '@/types';

const BLESSING_MESSAGES = [
  '恭喜发财，万事如意！',
  '小小红包，不成敬意~',
  '感谢小伙伴的陪伴！',
  '开心每一天！',
  '下次继续一起玩！',
  '友谊长存！',
  '财源广进！',
  '大吉大利！',
];

interface RedPacketProps {
  visible: boolean;
  onClose: () => void;
  activityId: string;
  fromParticipantId: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: string;
}

export default function RedPacket({ visible, onClose, activityId, fromParticipantId }: RedPacketProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const startTimeRef = useRef<number | null>(null);

  const [amount, setAmount] = useState<number>(0);
  const [message, setMessage] = useState<string>('');
  const [toParticipantId, setToParticipantId] = useState<string>('');
  const [isOpened, setIsOpened] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);

  const activity = useStore<Activity | undefined>(state =>
    state.activities.find(a => a.id === activityId)
  );
  const sendRedPacket = useStore(state => state.sendRedPacket);

  const availableParticipants = activity?.participants.filter(
    p => p.id !== fromParticipantId
  ) || [];

  const randomAmount = useCallback(() => {
    const val = Math.random() * 9 + 1;
    setAmount(Math.round(val * 100) / 100);
  }, []);

  const randomMessage = useCallback(() => {
    const idx = Math.floor(Math.random() * BLESSING_MESSAGES.length);
    setMessage(BLESSING_MESSAGES[idx]);
  }, []);

  const initParticles = useCallback((canvas: HTMLCanvasElement) => {
    const particles: Particle[] = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const colors = ['#FFD54F', '#FFC107', '#FFB300', '#FF8F00', '#FFE082', '#FFF9C4'];

    for (let i = 0; i < 80; i++) {
      const angle = (Math.PI * 2 * i) / 80 + Math.random() * 0.5;
      const speed = 2 + Math.random() * 6;
      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        radius: 2 + Math.random() * 5,
        alpha: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    particlesRef.current = particles;
  }, []);

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gravity = 0.15;
    const particles = particlesRef.current;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.vy += gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.012;

      if (p.alpha <= 0) continue;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x - p.radius * 0.3, p.y - p.radius * 0.3, p.radius * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fill();
      ctx.restore();
    }
  }, []);

  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    drawParticles(ctx, canvas);

    const elapsed = timestamp - startTimeRef.current;
    if (elapsed < 1500) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [drawParticles]);

  const handleOpen = useCallback(() => {
    setIsOpened(true);
  }, []);

  const handleSend = useCallback(async () => {
    if (!amount || !toParticipantId || amount <= 0) return;
    setIsSending(true);
    try {
      await sendRedPacket(activityId, {
        from: fromParticipantId,
        to: toParticipantId,
        amount,
        message: message || '恭喜发财！',
      });
      onClose();
    } finally {
      setIsSending(false);
    }
  }, [amount, message, toParticipantId, activityId, fromParticipantId, sendRedPacket, onClose]);

  const handleClose = useCallback(() => {
    setIsOpened(false);
    setIsSending(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (visible) {
      randomAmount();
      randomMessage();
      setToParticipantId('');
      setIsOpened(false);
    }
  }, [visible, randomAmount, randomMessage]);

  useEffect(() => {
    if (isOpened && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
      initParticles(canvas);
      startTimeRef.current = null;
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isOpened, initParticles, animate]);

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="red-packet-modal relative w-[320px] max-w-[90vw]"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-[#4A3B32] hover:bg-gray-100 transition-colors"
        >
          <X size={16} />
        </button>

        {!isOpened ? (
          <div className="relative">
            <div className="packet-string absolute -top-8 left-1/2 -translate-x-1/2 w-1 h-10 bg-[#8B4513] rounded-full" />

            <div
              className="relative rounded-3xl overflow-hidden shadow-2xl"
              style={{ background: 'linear-gradient(180deg, #E53935 0%, #C62828 50%, #B71C1C 100%)' }}
            >
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 left-4 w-16 h-16 rounded-full border-2 border-yellow-400" />
                <div className="absolute bottom-8 right-6 w-20 h-20 rounded-full border-2 border-yellow-400" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-yellow-400" />
              </div>

              <div className="relative p-6 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFD54F 0%, #FFC107 50%, #FF8F00 100%)' }}>
                  <Sparkles className="text-[#E53935]" size={40} />
                </div>

                <h2 className="text-2xl font-bold text-yellow-300 mb-2">发红包</h2>
                <p className="text-yellow-100 text-sm mb-6">给小伙伴送上祝福吧~</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-yellow-200 text-sm mb-2 text-left">红包金额</label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-300 text-xl">¥</span>
                        <input
                          type="number"
                          min="0.01"
                          max="10"
                          step="0.01"
                          value={amount || ''}
                          onChange={e => setAmount(Number(e.target.value))}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#8B0000] bg-opacity-50 text-yellow-300 text-xl font-bold text-right border border-yellow-600 focus:outline-none focus:border-yellow-400 placeholder-yellow-600"
                          placeholder="0.00"
                        />
                      </div>
                      <button
                        onClick={randomAmount}
                        className="px-4 py-2 rounded-xl bg-yellow-500 text-[#8B0000] font-medium hover:bg-yellow-400 transition-colors"
                      >
                        <RefreshCw size={20} />
                      </button>
                    </div>
                    <p className="text-yellow-200 text-xs mt-1 text-left">金额范围: 1 - 10 元</p>
                  </div>

                  <div>
                    <label className="block text-yellow-200 text-sm mb-2 text-left">祝福语</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        maxLength={20}
                        className="flex-1 px-4 py-3 rounded-xl bg-[#8B0000] bg-opacity-50 text-yellow-300 border border-yellow-600 focus:outline-none focus:border-yellow-400 placeholder-yellow-600"
                        placeholder="写下你的祝福..."
                      />
                      <button
                        onClick={randomMessage}
                        className="px-4 py-2 rounded-xl bg-yellow-500 text-[#8B0000] font-medium hover:bg-yellow-400 transition-colors"
                      >
                        <RefreshCw size={20} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-yellow-200 text-sm mb-2 text-left">发送给</label>
                    <div className="flex flex-wrap gap-2">
                      {availableParticipants.map(p => (
                        <button
                          key={p.id}
                          onClick={() => setToParticipantId(p.id)}
                          className={cn(
                            'px-4 py-2 rounded-full text-sm font-medium transition-all',
                            toParticipantId === p.id
                              ? 'bg-yellow-500 text-[#8B0000] scale-105'
                              : 'bg-[#8B0000] bg-opacity-50 text-yellow-200 border border-yellow-600 hover:border-yellow-400'
                          )}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleOpen}
                  disabled={!toParticipantId || !amount || amount <= 0 || amount > 10}
                  className={cn(
                    'mt-8 w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all',
                    toParticipantId && amount && amount > 0 && amount <= 10
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-[#8B0000] hover:from-yellow-300 hover:to-yellow-500 shadow-lg'
                      : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  )}
                >
                  <Send size={20} />
                  塞红包
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="relative rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: 'linear-gradient(180deg, #E53935 0%, #C62828 100%)' }}
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
              style={{ pointerEvents: 'none' }}
            />

            <div className="relative p-6 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFD54F 0%, #FFC107 100%)' }}>
                <span className="text-[#E53935] text-3xl font-bold">¥</span>
              </div>

              <h2 className="text-2xl font-bold text-yellow-300 mb-2">红包已准备好</h2>
              <p className="text-yellow-100 text-lg mb-1">{message}</p>

              <div className="my-6 py-6 border-y border-yellow-600 border-opacity-30">
                <p className="text-yellow-200 text-sm mb-2">金额</p>
                <p className="text-5xl font-bold text-yellow-300">¥{amount.toFixed(2)}</p>
              </div>

              <div className="text-yellow-200 text-sm mb-6">
                发送给：<span className="font-bold text-yellow-300">
                  {activity?.participants.find(p => p.id === toParticipantId)?.name}
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsOpened(false)}
                  className="flex-1 py-3 rounded-xl bg-[#8B0000] bg-opacity-50 text-yellow-200 font-medium border border-yellow-600 hover:border-yellow-400 transition-colors"
                >
                  返回修改
                </button>
                <button
                  onClick={handleSend}
                  disabled={isSending}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600 text-[#8B0000] font-bold hover:from-yellow-300 hover:to-yellow-500 transition-all shadow-lg disabled:opacity-50"
                >
                  {isSending ? '发送中...' : '发送红包'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

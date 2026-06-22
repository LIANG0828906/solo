import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer } from 'lucide-react';
import { useStore } from '@/stores/useStore';
import { createUser } from '@/services/api';

const SLOGAN = '记录你的微小仪式，连接每一天。';

export default function Onboarding() {
  const navigate = useNavigate();
  const { setUserId, setOnboarded } = useStore();
  const [revealedCount, setRevealedCount] = useState(0);
  const [showButton, setShowButton] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (revealedCount < SLOGAN.length) {
      const timer = setTimeout(() => {
        setRevealedCount((c) => c + 1);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setShowButton(true), 300);
      return () => clearTimeout(timer);
    }
  }, [revealedCount]);

  const handleEnter = async () => {
    setLoading(true);
    try {
      const user = await createUser();
      localStorage.setItem('ritual_user_id', user.id);
      setUserId(user.id);
      setOnboarded(true);
      navigate('/morning');
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="flex flex-col items-center gap-8">
        <Timer size={80} className="hourglass-animate text-[var(--color-gold)]" />

        <p className="typewriter text-xl font-medium tracking-wider text-white/90">
          {SLOGAN.split('').map((char, i) => (
            <span
              key={i}
              style={{
                animationDelay: `${i * 50}ms`,
              }}
            >
              {revealedCount > i ? char : ''}
            </span>
          ))}
        </p>

        {showButton && (
          <button
            onClick={handleEnter}
            disabled={loading}
            className="ripple-btn mt-4 rounded-full bg-[var(--color-gold)] px-10 py-3 text-lg font-semibold text-[var(--color-dark)] transition-all hover:bg-[var(--color-gold-light)] hover:shadow-gold disabled:opacity-50"
            style={{ animation: 'fadeIn 0.5s ease-out forwards' }}
          >
            {loading ? '加载中...' : '进入'}
          </button>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

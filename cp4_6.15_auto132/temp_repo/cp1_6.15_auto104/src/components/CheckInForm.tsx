import { useState, useMemo } from 'react';
import { createCheckIn } from '@/services/api';
import { useStore, INCENTIVE_QUOTES } from '@/stores/useStore';

interface CheckInFormProps {
  ritualType: 'morning' | 'evening';
}

export default function CheckInForm({ ritualType }: CheckInFormProps) {
  const userId = useStore((s) => s.userId);
  const selectedRitual = useStore((s) => s.selectedRitual);
  const checkInSuccess = useStore((s) => s.checkInSuccess);
  const incentiveQuote = useStore((s) => s.incentiveQuote);
  const selectRitual = useStore((s) => s.selectRitual);
  const setCheckInSuccess = useStore((s) => s.setCheckInSuccess);
  const setIncentiveQuote = useStore((s) => s.setIncentiveQuote);

  const [rippling, setRippling] = useState(false);
  const [particles, setParticles] = useState<
    { id: number; left: number; delay: number }[]
  >([]);

  const randomQuote = useMemo(
    () => INCENTIVE_QUOTES[Math.floor(Math.random() * INCENTIVE_QUOTES.length)],
    [],
  );

  if (!selectedRitual) return null;

  const handleCheckIn = async () => {
    setRippling(true);
    try {
      await createCheckIn({
        userId: userId ?? '',
        ritualId: selectedRitual.id,
        ritualName: selectedRitual.name,
        ritualType,
      });

      const newParticles = Array.from({ length: 5 }, (_, i) => ({
        id: Date.now() + i,
        left: Math.random() * 100,
        delay: Math.random() * 0.3,
      }));
      setParticles(newParticles);

      setIncentiveQuote(randomQuote);
      setCheckInSuccess(true);

      setTimeout(() => {
        selectRitual(null);
        setCheckInSuccess(false);
        setParticles([]);
      }, 2000);
    } finally {
      setRippling(false);
    }
  };

  return (
    <div className="relative max-w-sm mx-auto mt-8 p-6 rounded-xl glass-card">
      {particles.length > 0 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {particles.map((p) => (
            <div
              key={p.id}
              className="gold-particle absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: '#f2a900',
                left: `${p.left}%`,
                top: '10%',
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>
      )}

      <p className="text-center text-white mb-4 text-lg">
        已选择：{selectedRitual.name}
      </p>

      <button
        className={`ripple-btn w-full py-3 rounded-lg font-bold text-lg transition-opacity ${
          rippling ? 'opacity-80' : 'opacity-100'
        }`}
        style={{
          backgroundColor: '#f2a900',
          color: '#1a1a2e',
          borderRadius: '8px',
          padding: '12px 0',
        }}
        onClick={handleCheckIn}
      >
        完成打卡
      </button>

      {checkInSuccess && (
        <p
          className="font-serif text-center mt-4 text-sm"
          style={{
            color: '#ffd54f',
            opacity: 1,
            transition: 'opacity 0.5s ease-in',
          }}
        >
          {incentiveQuote}
        </p>
      )}
    </div>
  );
}

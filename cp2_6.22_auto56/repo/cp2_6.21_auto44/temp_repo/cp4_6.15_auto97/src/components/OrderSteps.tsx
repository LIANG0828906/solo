import { useState, useEffect } from 'react';

interface OrderStepsProps {
  status: 'pending' | 'paid' | 'shipping' | 'delivered';
}

const steps = [
  { key: 'pending', label: '待支付', icon: 'fa-clock' },
  { key: 'paid', label: '已支付', icon: 'fa-credit-card' },
  { key: 'shipping', label: '配送中', icon: 'fa-truck' },
  { key: 'delivered', label: '已签收', icon: 'fa-check-circle' },
];

export default function OrderSteps({ status }: OrderStepsProps) {
  const [visibleSteps, setVisibleSteps] = useState<string[]>([]);

  useEffect(() => {
    const statusIndex = steps.findIndex(s => s.key === status);
    const stepsToShow = steps.slice(0, statusIndex + 1).map(s => s.key);

    setVisibleSteps([]);
    stepsToShow.forEach((step, index) => {
      setTimeout(() => {
        setVisibleSteps(prev => [...prev, step]);
      }, index * 400);
    });
  }, [status]);

  const currentIndex = steps.findIndex(s => s.key === status);

  return (
    <div className="steps-container">
      {steps.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isVisible = visibleSteps.includes(step.key);

        return (
          <div
            key={step.key}
            className={`step ${isCompleted && isVisible ? 'completed' : ''}`}
            style={{ position: 'relative', zIndex: 2 }}
          >
            <div
              className={`step-circle ${isCompleted && isVisible ? 'completed' : ''}`}
              style={{
                transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                background: isCompleted && isVisible
                  ? 'linear-gradient(135deg, #8AB4E8 0%, #4A90D9 30%, #2E5B8A 100%)'
                  : 'var(--color-white)',
                borderColor: isCompleted && isVisible ? '#2E5B8A' : 'var(--color-border)',
                color: isCompleted && isVisible ? 'var(--color-white)' : 'var(--color-text-light)',
              }}
            >
              {isCompleted && isVisible ? (
                <i
                  className={`fas ${step.key === 'delivered' ? 'fa-check' : step.icon}`}
                  style={{
                    animation: 'checkFadeInScale 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                    opacity: 0,
                  }}
                ></i>
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <span
              className="step-label"
              style={{
                color: isCompleted && isVisible ? 'var(--color-text)' : 'var(--color-text-light)',
                fontWeight: isCompleted && isVisible ? 600 : 400,
                transition: 'all 0.4s ease',
              }}
            >
              {step.label}
            </span>

            {index < steps.length - 1 && (
              <div
                style={{
                  position: 'absolute',
                  top: '15px',
                  left: '50%',
                  width: 'calc(100% - 32px)',
                  height: '3px',
                  background: 'var(--color-border)',
                  zIndex: 0,
                  overflow: 'hidden',
                  borderRadius: '2px',
                }}
              >
                <div
                  style={{
                    width: isCompleted && visibleSteps.includes(steps[index + 1].key) ? '100%' : '0%',
                    height: '100%',
                    background: 'linear-gradient(90deg, #4A90D9, #2E5B8A)',
                    transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    transitionDelay: '0.2s',
                  }}
                ></div>
              </div>
            )}
          </div>
        );
      })}

      <style>{`
        @keyframes checkFadeInScale {
          0% {
            opacity: 0;
            transform: scale(0) rotate(-180deg);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.3) rotate(10deg);
          }
          70% {
            transform: scale(0.9) rotate(-5deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
      `}</style>
    </div>
  );
}

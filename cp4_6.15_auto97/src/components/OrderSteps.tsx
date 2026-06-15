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
      }, index * 500);
    });
  }, [status]);

  const currentIndex = steps.findIndex(s => s.key === status);

  return (
    <div className="steps-container">
      {steps.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isVisible = visibleSteps.includes(step.key);
        
        return (
          <div key={step.key} className={`step ${isCompleted && isVisible ? 'completed' : ''}`}>
            <div className={`step-circle ${isCompleted && isVisible ? 'completed' : ''}`}>
              {isCompleted && isVisible ? (
                <i className={`fas ${step.icon}`}></i>
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <span className="step-label">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

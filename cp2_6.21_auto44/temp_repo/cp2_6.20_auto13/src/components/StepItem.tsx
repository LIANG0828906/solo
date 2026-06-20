import { Timer } from 'lucide-react';
import type { Step } from '@/types';

interface StepItemProps {
  step: Step;
  index: number;
}

export default function StepItem({ step, index }: StepItemProps) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="step-circle">{index + 1}</div>
        {index > 0 && <div className="w-0.5 flex-1 bg-warm-border mt-2" />}
      </div>
      <div className="flex-1 pb-6">
        <h4 className="font-serif text-warm-brown text-base mb-1">{step.title}</h4>
        <p className="text-sm text-warm-brown-light leading-relaxed mb-2">{step.content}</p>
        {step.timerSeconds > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-warm-orange-deep bg-orange-50 px-2.5 py-1 rounded-full">
            <Timer size={12} />
            {Math.floor(step.timerSeconds / 60)}分{step.timerSeconds % 60 > 0 ? `${step.timerSeconds % 60}秒` : ''}
          </span>
        )}
        {step.images.length > 0 && (
          <div className="flex gap-2 mt-2">
            {step.images.map((img, i) => (
              <img key={i} src={img} alt="" className="w-20 h-20 object-cover rounded-lg border border-warm-border" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

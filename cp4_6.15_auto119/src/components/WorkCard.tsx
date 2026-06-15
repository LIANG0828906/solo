import { useState, useEffect, useRef } from 'react';
import type { Work } from '@/types';
import { useNavigate } from 'react-router-dom';
import RippleButton from './RippleButton';

interface WorkCardProps {
  work: Work;
  index: number;
}

export default function WorkCard({ work, index }: WorkCardProps) {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 60);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      ref={cardRef}
      className={`
        work-card group relative rounded-card overflow-hidden bg-white cursor-pointer
        shadow-warm transition-all duration-300 ease-out
        hover:-translate-y-2 hover:shadow-warm-hover
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
      style={{
        transitionDelay: `${index * 50}ms`,
      }}
      onClick={() => navigate(`/work/${work.id}`)}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-cream">
        <div
          className={`
            absolute inset-0 bg-cream animate-pulse
            transition-opacity duration-500
            ${loaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}
          `}
        />
        <img
          src={work.images[0]}
          alt={work.name}
          onLoad={() => setLoaded(true)}
          style={{
            filter: loaded ? 'blur(0px)' : 'blur(12px)',
            opacity: loaded ? 1 : 0,
            transition: 'filter 900ms cubic-bezier(0.4, 0, 0.2, 1), opacity 900ms cubic-bezier(0.4, 0, 0.2, 1)',
            transform: loaded ? 'scale(1)' : 'scale(1.05)',
          }}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-4">
        <h3 className="font-display text-lg font-semibold text-walnut mb-2">
          {work.name}
        </h3>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {work.materials.map((m) => (
            <span
              key={m}
              className="px-2.5 py-0.5 rounded-full text-xs font-body font-medium bg-oak-light/20 text-oak-dark"
            >
              {m}
            </span>
          ))}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xs text-oak-dark/60 font-body">起拍价</span>
          <span className="text-xl font-display font-bold text-walnut">
            ¥{work.basePrice}
          </span>
        </div>
      </div>

      <div className="
        absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent
        opacity-0 group-hover:opacity-100 transition-opacity duration-300
        flex flex-col items-center justify-center gap-3
      ">
        <RippleButton
          className="
            px-6 py-2.5 rounded-btn bg-white/90 text-walnut font-body font-semibold text-sm
            hover:bg-white transition-colors duration-300
          "
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/work/${work.id}`);
          }}
        >
          查看详情
        </RippleButton>
        <RippleButton
          className="
            px-6 py-2.5 rounded-btn bg-oak-dark/90 text-white font-body font-semibold text-sm
            hover:bg-oak-dark transition-colors duration-300
          "
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/work/${work.id}`);
          }}
        >
          快速询价
        </RippleButton>
      </div>
    </div>
  );
}

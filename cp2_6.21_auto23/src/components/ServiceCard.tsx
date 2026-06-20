import type { Service } from '@/types';

interface ServiceCardProps {
  service: Service;
  onBook: (service: Service) => void;
}

export default function ServiceCard({ service, onBook }: ServiceCardProps) {
  return (
    <div
      className="group cursor-pointer rounded-xl border border-[#e0d6c8] bg-white p-0 transition-all duration-300 hover:-translate-y-[3px] hover:scale-[1.02] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
      onClick={() => onBook(service)}
    >
      <div
        className="flex h-32 items-center justify-center rounded-t-xl text-4xl"
        style={{ backgroundColor: service.color }}
      >
        <span className="drop-shadow-sm">{service.icon}</span>
      </div>
      <div className="p-4">
        <h3 className="text-base font-bold text-[#3e3228]">{service.name}</h3>
        <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-[#7a6e62]">
          {service.description}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-[#d4a574]">{service.priceRange}</span>
          <span className="text-xs text-[#a09488]">{service.duration}</span>
        </div>
        <button
          className="ripple-btn mt-3 w-full rounded-lg py-2 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-md"
          style={{ backgroundColor: '#d4a574' }}
        >
          立即预约
        </button>
      </div>
    </div>
  );
}


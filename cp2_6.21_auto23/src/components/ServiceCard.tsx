import type { Service } from '@/types';

interface ServiceCardProps {
  service: Service;
  onBook: (service: Service) => void;
}

export default function ServiceCard({ service, onBook }: ServiceCardProps) {
  return (
    <div
      className="ripple-btn group cursor-pointer rounded-xl border border-[#e0d6c8] bg-white p-0 transition-all duration-300 hover:-translate-y-[3px] hover:scale-[1.02] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
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
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-[#4caf50]">{service.priceRange}</span>
          <span className="text-xs text-[#a09488]">{service.duration}</span>
        </div>
        <button className="ripple-btn mt-3 w-full rounded-lg bg-[#4caf50] py-2 text-sm font-semibold text-white transition-colors hover:bg-[#388e3c]">
          立即预约
        </button>
      </div>
    </div>
  );
}

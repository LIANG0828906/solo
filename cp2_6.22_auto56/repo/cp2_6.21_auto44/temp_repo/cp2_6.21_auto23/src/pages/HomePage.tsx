import { useState } from 'react';
import { usePetStore } from '@/store/petStore';
import ServiceCard from '@/components/ServiceCard';
import AppointmentPanel from '@/components/AppointmentPanel';
import ReviewStats from '@/components/ReviewStats';
import type { Service } from '@/types';

export default function HomePage() {
  const { services } = usePetStore();
  const [bookingService, setBookingService] = useState<Service | null>(null);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#3e3228]">
          🐾 宠物美容服务
        </h1>
        <p className="mt-1 text-sm text-[#a09488]">选择心仪的服务，为毛孩子预约美容时光</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onBook={setBookingService}
          />
        ))}
      </div>

      <div className="mt-8">
        <ReviewStats />
      </div>

      {bookingService && (
        <AppointmentPanel
          service={bookingService}
          onClose={() => setBookingService(null)}
        />
      )}
    </div>
  );
}

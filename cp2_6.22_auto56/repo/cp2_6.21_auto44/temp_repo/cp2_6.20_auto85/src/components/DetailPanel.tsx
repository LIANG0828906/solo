import { Calendar, MapPin, Clock, X, Plus } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { regions } from '@/data/regionData';
import { markerIconMap } from '@/utils/markerIcons';
import type { Specialty, Activity } from '@/types';

export default function DetailPanel() {
  const selectedMarker = useAppStore((state) => state.selectedMarker);
  const showDetailPanel = useAppStore((state) => state.showDetailPanel);
  const toggleDetailPanel = useAppStore((state) => state.toggleDetailPanel);
  const addToItinerary = useAppStore((state) => state.addToItinerary);

  if (!showDetailPanel || !selectedMarker) return null;

  const allSpecialties = regions.flatMap((region) => region.specialties);
  const allActivities = regions.flatMap((region) => region.activities);

  let item: (Specialty | Activity) | null = null;

  if (selectedMarker.type === 'specialty') {
    item = allSpecialties.find((s) => s.id === selectedMarker.id) || null;
  } else {
    item = allActivities.find((a) => a.id === selectedMarker.id) || null;
  }

  if (!item) return null;

  const iconConfig = markerIconMap[item.type];

  const handleAddToItinerary = () => {
    addToItinerary({
      itemId: item!.id,
      itemType: selectedMarker.type,
      name: item!.name,
      region: item!.region,
      date: 'bestTime' in item ? item!.bestTime : item!.date,
      image: item!.image,
    });
  };

  return (
    <div
      className="fixed right-0 top-0 h-screen z-50 animate-slide-in-right custom-scrollbar overflow-y-auto shadow-2xl"
      style={{
        width: '380px',
        maxWidth: '90vw',
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="relative">
        <button
          onClick={() => toggleDetailPanel(false)}
          className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-gray-700 shadow-md transition-colors"
        >
          <X size={18} />
        </button>

        <img
          src={item.image}
          alt={item.name}
          className="w-full object-cover"
          style={{ height: '240px' }}
        />
      </div>

      <div className="px-6 pb-28 pt-6">
        <h2
          className="font-serif font-bold mb-3"
          style={{ fontSize: '24px' }}
        >
          {item.name}
        </h2>

        <div className="mb-5">
          <span
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-white text-sm font-medium"
            style={{ background: iconConfig.bgColor }}
          >
            <span>{iconConfig.icon}</span>
            {iconConfig.label}
          </span>
        </div>

        <p className="text-gray-600 mb-6 leading-relaxed" style={{ lineHeight: 1.7 }}>
          {item.description}
        </p>

        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
            {'bestTime' in item ? (
              <Clock
                size={18}
                className="text-brand-orange mt-0.5 flex-shrink-0"
              />
            ) : (
              <Calendar
                size={18}
                className="text-brand-orange mt-0.5 flex-shrink-0"
              />
            )}
            <div>
              <div className="text-xs text-gray-400 mb-0.5">
                {'bestTime' in item ? '最佳时间' : '活动日期'}
              </div>
              <div className="text-sm text-gray-700 font-medium">
                {'bestTime' in item ? item.bestTime : item.date}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin
              size={18}
              className="text-brand-orange mt-0.5 flex-shrink-0"
            />
            <div>
              <div className="text-xs text-gray-400 mb-0.5">区域位置</div>
              <div className="text-sm text-gray-700 font-medium">
                {item.region}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-start gap-3">
            <Plus
              size={18}
              className="text-brand-orange mt-0.5 flex-shrink-0"
            />
            <div>
              <div className="text-xs text-gray-400 mb-1">推荐路线</div>
              <p className="text-sm text-gray-600 leading-relaxed">
                建议提前规划行程，前往{item.region}体验当地特色。可结合周边景点安排一日游深度体验，感受地道的风土人情与文化魅力。
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className="fixed bottom-0 right-0 px-6 py-4"
        style={{
          width: '380px',
          maxWidth: '90vw',
          background:
            'linear-gradient(to top, rgba(255,255,255,0.98) 60%, rgba(255,255,255,0))',
        }}
      >
        <button
          onClick={handleAddToItinerary}
          className="w-full text-white font-semibold rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
          style={{
            background: '#ff6b35',
            padding: '14px',
          }}
        >
          加入行程
        </button>
      </div>
    </div>
  );
}

import { useBouquetStore } from '@/modules/store/useBouquetStore';
import { FLOWERS } from '@/data/flowers';
import { Plus, Minus, X } from 'lucide-react';

export default function FlowerSelector() {
  const selectedFlowers = useBouquetStore((s) => s.selectedFlowers);
  const addFlower = useBouquetStore((s) => s.addFlower);
  const removeFlower = useBouquetStore((s) => s.removeFlower);
  const updateFlowerQuantity = useBouquetStore((s) => s.updateFlowerQuantity);

  const isSelected = (id: string) => selectedFlowers.some((f) => f.flowerId === id);
  const getQuantity = (id: string) => selectedFlowers.find((f) => f.flowerId === id)?.quantity ?? 0;

  return (
    <div className="space-y-5">
      <h3
        className="text-lg font-semibold"
        style={{ fontFamily: 'Georgia, serif', color: '#2E4A2E' }}
      >
        🌸 选择花材
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {FLOWERS.map((flower) => {
          const selected = isSelected(flower.id);
          return (
            <button
              key={flower.id}
              onClick={() => addFlower(flower.id)}
              className="relative flex items-center gap-2 p-3 rounded-[10px] transition-all duration-200 ease-in-out group"
              style={{
                height: '110px',
                background: '#FAFAF5',
                border: selected ? '2.5px solid #D4AF37' : '2px solid #E8E8E0',
                boxShadow: selected
                  ? '0 4px 16px rgba(212,175,55,0.25)'
                  : '0 1px 3px rgba(0,0,0,0.06)',
                transform: selected ? 'translateY(-1px)' : 'none',
              }}
            >
              <div className="flex-shrink-0">
                <img
                  src={`https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
                    `single ${flower.name} flower, clean white background, studio lighting, photorealistic, high quality product photo`
                  )}&image_size=square_hd`}
                  alt={flower.name}
                  className="w-14 h-14 rounded-lg object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement!;
                    const fallback = document.createElement('div');
                    fallback.className = 'w-14 h-14 rounded-lg flex items-center justify-center text-2xl';
                    fallback.style.background = flower.petalColor + '30';
                    fallback.textContent = flower.thumbnail;
                    parent.appendChild(fallback);
                  }}
                />
              </div>
              <div className="flex flex-col items-start min-w-0">
                <span
                  className="font-medium text-sm truncate w-full text-left"
                  style={{ fontFamily: 'Arial, sans-serif', color: '#2E4A2E' }}
                >
                  {flower.name}
                </span>
                <span
                  className="text-xs mt-0.5"
                  style={{ color: '#6B8E4E' }}
                >
                  ¥{flower.price}/支
                </span>
                {selected && (
                  <span
                    className="text-xs mt-1 px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: '#D4AF3720', color: '#B8960F' }}
                  >
                    ×{getQuantity(flower.id)}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedFlowers.length > 0 && (
        <div className="space-y-2">
          <h4
            className="text-sm font-medium"
            style={{ fontFamily: 'Georgia, serif', color: '#2E4A2E' }}
          >
            已选花材
          </h4>
          <div className="space-y-2">
            {selectedFlowers.map((sf) => {
              const flower = FLOWERS.find((f) => f.id === sf.flowerId)!;
              return (
                <div
                  key={sf.flowerId}
                  className="flex items-center justify-between p-2.5 rounded-lg transition-all duration-200"
                  style={{ background: '#F8F6F0', border: '1px solid #E8E8E0' }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: flower.petalColor }}
                    />
                    <span className="text-sm truncate" style={{ color: '#2E4A2E' }}>
                      {flower.name}
                    </span>
                    <span className="text-xs" style={{ color: '#8B8B7A' }}>
                      ¥{flower.price * sf.quantity}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateFlowerQuantity(sf.flowerId, sf.quantity - 1);
                      }}
                      className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200"
                      style={{ background: '#E8E8E0', color: '#5A5A4A' }}
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-6 text-center text-sm font-medium" style={{ color: '#2E4A2E' }}>
                      {sf.quantity}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateFlowerQuantity(sf.flowerId, sf.quantity + 1);
                      }}
                      className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200"
                      style={{ background: '#6B8E4E', color: '#FFFFFF' }}
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFlower(sf.flowerId);
                      }}
                      className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ml-1"
                      style={{ background: '#FFE0E0', color: '#CC3333' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

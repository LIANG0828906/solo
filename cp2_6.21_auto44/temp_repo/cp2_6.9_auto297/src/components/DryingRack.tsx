import { DriedFabric } from '../utils/types';

interface DryingRackProps {
  fabrics: DriedFabric[];
}

export function DryingRack({ fabrics }: DryingRackProps) {
  const bars = [0, 1, 2, 3, 4];

  const renderFabricOnBar = (barIndex: number) => {
    const fabric = fabrics.find((f) => f.position === barIndex);
    if (!fabric) return null;

    const canvas = document.createElement('canvas');
    canvas.width = fabric.imageData.width;
    canvas.height = fabric.imageData.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.putImageData(fabric.imageData, 0, 0);
    }
    const dataUrl = canvas.toDataURL();

    return (
      <div
        key={fabric.id}
        className="dried-fabric"
        style={{
          left: `${20 + (barIndex % 3) * 80}px`,
          animationDelay: `${barIndex * 0.3}s`,
          backgroundImage: `url(${dataUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          className="absolute bottom-1 right-1 w-4 h-4 bg-[#c0392b] text-white text-xs flex items-center justify-center rounded-sm"
          style={{ fontSize: '10px', fontFamily: "'Ma Shan Zheng', cursive" }}
        >
          {fabric.sealChar}
        </div>
      </div>
    );
  };

  return (
    <div className="drying-rack-section">
      <h3 className="text-xl text-center mb-3 text-[#3e2723]">晾布架</h3>
      <div className="drying-rack">
        {bars.map((barIndex) => (
          <div key={barIndex} className="rack-bar">
            {renderFabricOnBar(barIndex)}
          </div>
        ))}
      </div>
      {fabrics.length === 0 && (
        <p className="text-center text-sm mt-2 text-[#5d4037] opacity-60">
          晾干的布匹会挂在这里
        </p>
      )}
    </div>
  );
}

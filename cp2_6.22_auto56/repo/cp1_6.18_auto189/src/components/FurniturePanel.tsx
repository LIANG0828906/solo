import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Armchair, BookOpen, Lamp, Monitor, Sofa, Table } from 'lucide-react';

interface FurnitureItem {
  id: string;
  name: string;
  modelType: string;
}

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  sofa: Sofa,
  coffeeTable: Table,
  floorLamp: Lamp,
  tvStand: Monitor,
  bookshelf: BookOpen,
  armchair: Armchair,
};

export default function FurniturePanel() {
  const addFurniture = useStore((s) => s.addFurniture);
  const [furnitureList, setFurnitureList] = useState<FurnitureItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    fetch('/api/furniture')
      .then((res) => res.json())
      .then((data: { items: FurnitureItem[] }) => setFurnitureList(data.items))
      .catch(() => {});
  }, []);

  const panelContent = (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3">
        <h2 className="font-display text-lg text-white/90">家具库</h2>
        <div className="mt-1 h-0.5 w-10 bg-[#D4A76A] rounded-full" />
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 pb-4 overflow-y-auto flex-1">
        {furnitureList.map((item) => {
          const Icon = iconMap[item.id];
          return (
            <button
              key={item.id}
              className="furniture-card flex flex-col items-center justify-center gap-2 rounded-lg w-[80px] h-[80px] bg-[#2D2D44] hover:bg-[#3a3a55] transition-colors cursor-pointer"
              onClick={() => addFurniture(item.id)}
            >
              {Icon && <Icon className="w-6 h-6 text-[#D4A76A]" />}
              <span className="text-xs text-white/70">{item.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <div className="glass-panel hidden md:flex flex-col fixed right-0 top-0 h-full w-[280px] border-l border-white/5">
        {panelContent}
      </div>

      <div className="md:hidden fixed bottom-[60px] left-0 right-0 z-50">
        <button
          className="flex items-center justify-center w-full py-2 bg-[#1a1a2e]/90 backdrop-blur-md text-white/70 text-sm border-t border-white/10"
          onClick={() => setDrawerOpen(!drawerOpen)}
        >
          {drawerOpen ? '收起家具库 ▼' : '展开家具库 ▲'}
        </button>

        {drawerOpen && (
          <div className="glass-panel animate-slide-up bg-[#1a1a2e]/95 border-t border-white/10 max-h-[60vh] overflow-y-auto">
            {panelContent}
          </div>
        )}
      </div>
    </>
  );
}

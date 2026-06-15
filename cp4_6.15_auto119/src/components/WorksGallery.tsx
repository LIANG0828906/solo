import { useState, useMemo } from 'react';
import type { Work } from '@/types';
import WorkCard from './WorkCard';

interface WorksGalleryProps {
  works: Work[];
}

export default function WorksGallery({ works }: WorksGalleryProps) {
  const [activeFilter, setActiveFilter] = useState<string>('全部');

  const allMaterials = useMemo(() => {
    const materials = new Set<string>();
    works.forEach(w => w.materials.forEach(m => materials.add(m)));
    return ['全部', ...Array.from(materials)];
  }, [works]);

  const filteredWorks = useMemo(() => {
    if (activeFilter === '全部') return works;
    return works.filter(w => w.materials.includes(activeFilter));
  }, [works, activeFilter]);

  return (
    <div>
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {allMaterials.map((material) => (
          <button
            key={material}
            onClick={() => setActiveFilter(material)}
            className={`
              px-5 py-2 rounded-btn font-body text-sm font-medium whitespace-nowrap
              transition-all duration-300
              ${activeFilter === material
                ? 'bg-walnut text-white shadow-warm'
                : 'bg-white text-oak-dark hover:bg-oak-light/20 shadow-sm'
              }
            `}
          >
            {material}
          </button>
        ))}
      </div>

      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5 space-y-5">
        {filteredWorks.map((work, index) => (
          <div key={work.id} className="break-inside-avoid">
            <WorkCard work={work} index={index} />
          </div>
        ))}
      </div>

      {filteredWorks.length === 0 && (
        <div className="text-center py-20 text-oak-dark/50 font-body">
          暂无该材质的作品
        </div>
      )}
    </div>
  );
}

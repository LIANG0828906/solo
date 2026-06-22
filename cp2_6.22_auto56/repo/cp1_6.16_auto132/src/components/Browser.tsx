import { useEffect, useState } from 'react';
import { useCreatureStore } from '../store/useCreatureStore';
import type { Creature, GeneFragment } from '../types';
import { CreatureCard } from './CreatureCard';
import { CreatureModal } from './CreatureModal';
import { FetchService } from '../services/FetchService';

export function Browser() {
  const { creatures, selectedCreature, selectCreature, loadCreatures, loading } =
    useCreatureStore();
  const [draggingGene, setDraggingGene] = useState<GeneFragment | null>(null);

  useEffect(() => {
    if (creatures.length === 0) {
      loadCreatures();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDragStart = (gene: GeneFragment, e: React.DragEvent) => {
    setDraggingGene(gene);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', JSON.stringify(gene));
    try {
      const dragCanvas = document.createElement('canvas');
      FetchService.drawGeneMap(dragCanvas, {
        id: gene.creatureId,
        name: gene.creatureName,
        region: '东方',
        description: '',
        primaryColor: gene.color,
        secondaryColor: '#6A5ACD',
        genes: [gene],
        abilities: { strength: 0, agility: 0, wisdom: 0, mystery: 0, charm: 0, longevity: 0 },
        morphology: [],
      } as Creature, 120, 30);
      const img = new Image();
      img.src = dragCanvas.toDataURL();
      e.dataTransfer.setDragImage(img, 60, 15);
    } catch {
      // ignore
    }
  };

  const handleDragEnd = () => {
    setDraggingGene(null);
  };

  return (
    <div className="browser-panel" onDragEnd={handleDragEnd}>
      <h2 className="section-title">神话生物图鉴</h2>
      {loading && creatures.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✦</div>
          正在召唤远古神话生物...
        </div>
      ) : (
        <div className="creature-grid">
          {creatures.map((creature) => (
            <CreatureCard
              key={creature.id}
              creature={creature}
              onClick={() => selectCreature(creature)}
              onDragStart={handleDragStart}
            />
          ))}
        </div>
      )}
      {selectedCreature && (
        <CreatureModal
          creature={selectedCreature}
          onClose={() => selectCreature(null)}
          onDragStart={handleDragStart}
        />
      )}
      {draggingGene && (
        <div style={{ display: 'none' }} aria-hidden />
      )}
    </div>
  );
}

import { useEffect, useRef } from 'react';
import type { Creature, GeneFragment } from '../types';
import { FetchService } from '../services/FetchService';

interface CreatureCardProps {
  creature: Creature;
  onClick: () => void;
  onDragStart: (gene: GeneFragment, e: React.DragEvent) => void;
}

export function CreatureCard({ creature, onClick, onDragStart }: CreatureCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      FetchService.drawGeneMap(canvasRef.current, creature);
    }
  }, [creature]);

  const visibleGenes = creature.genes.slice(0, 3);

  return (
    <div
      className="creature-card"
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('.gene-bar') || target.closest('.gene-row')) return;
        onClick();
      }}
    >
      <span className="region-badge">{creature.region}</span>
      <h3 className="creature-name">{creature.name}</h3>
      <canvas ref={canvasRef} className="gene-canvas" />
      <div className="gene-rows">
        {visibleGenes.map((gene) => (
          <div key={gene.id} className="gene-row" title={`拖拽 ${gene.name} 到融合槽`}>
            <div
              className="gene-bar"
              draggable
              style={{ background: gene.color, color: gene.color }}
              onDragStart={(e) => {
                e.stopPropagation();
                onDragStart(gene, e);
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <span className="gene-name">{gene.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

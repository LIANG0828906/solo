import { Plus, Minus } from 'lucide-react';
import type { MaterialNeed, UserMaterial } from '@/types';

type MaterialItem = MaterialNeed | UserMaterial;

interface MaterialGridProps {
  materials: MaterialItem[];
  editable?: boolean;
  onQuantityChange?: (id: string, delta: number) => void;
  selectedIds?: Set<string>;
  onSelect?: (id: string) => void;
}

function isUserMaterial(m: MaterialItem): m is UserMaterial {
  return 'quantity' in m && !('requiredQuantity' in m);
}

function isMaterialNeed(m: MaterialItem): m is MaterialNeed {
  return 'requiredQuantity' in m;
}

export default function MaterialGrid({
  materials,
  editable = false,
  onQuantityChange,
  selectedIds,
  onSelect,
}: MaterialGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {materials.map((m) => {
        const selected = selectedIds?.has(m.id);
        const qty = isUserMaterial(m) ? m.quantity : `${m.contributedQuantity}/${m.requiredQuantity}`;

        return (
          <div
            key={m.id}
            className={`bg-purple-card rounded-lg border border-purple-border/50 p-3 flex flex-col items-center gap-1.5 transition-colors ${
              selected ? 'border-amber-primary ring-1 ring-amber-primary/40' : ''
            }`}
            onClick={() => onSelect?.(m.id)}
          >
            {selectedIds !== undefined && (
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                  selected ? 'bg-amber-primary border-amber-primary' : 'border-purple-border'
                }`}
              >
                {selected && <span className="text-[10px] text-white font-bold">✓</span>}
              </div>
            )}

            <span className="text-2xl">{m.emoji}</span>
            <span className="text-sm text-white font-body truncate max-w-full">{m.name}</span>

            <div className="flex items-center gap-1.5 text-xs text-purple-border">
              {editable && isUserMaterial(m) ? (
                <>
                  <button
                    className="w-5 h-5 rounded-full bg-amber-primary text-white flex items-center justify-center text-xs hover:bg-amber-dark transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuantityChange?.(m.id, -1);
                    }}
                  >
                    <Minus size={10} />
                  </button>
                  <span className="text-white min-w-[20px] text-center">{m.quantity}</span>
                  <button
                    className="w-5 h-5 rounded-full bg-amber-primary text-white flex items-center justify-center text-xs hover:bg-amber-dark transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuantityChange?.(m.id, 1);
                    }}
                  >
                    <Plus size={10} />
                  </button>
                </>
              ) : (
                <span>{qty}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

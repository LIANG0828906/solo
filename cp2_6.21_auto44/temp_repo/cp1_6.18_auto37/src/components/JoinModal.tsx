import { useState } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import { usePartyStore } from '@/stores/partyStore';
import type { ContributedMaterial } from '@/types';

interface JoinModalProps {
  open: boolean;
  onClose: () => void;
  activityId: string;
}

export default function JoinModal({ open, onClose, activityId }: JoinModalProps) {
  const userMaterials = usePartyStore((s) => s.userMaterials);
  const joinParty = usePartyStore((s) => s.joinParty);

  const [selected, setSelected] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState<Set<string>>(new Set());

  if (!open) return null;

  const toggleCheck = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setSelected((s) => {
          const copy = { ...s };
          delete copy[id];
          return copy;
        });
      } else {
        next.add(id);
        const mat = userMaterials.find((m) => m.id === id);
        if (mat && !selected[id]) {
          setSelected((s) => ({ ...s, [id]: 1 }));
        }
      }
      return next;
    });
  };

  const setQty = (id: string, qty: number) => {
    const mat = userMaterials.find((m) => m.id === id);
    if (!mat) return;
    const clamped = Math.max(0, Math.min(qty, mat.quantity));
    setSelected((s) => ({ ...s, [id]: clamped }));
  };

  const handleSubmit = async () => {
    const contributions: ContributedMaterial[] = Array.from(checked).map((id) => ({
      materialId: id,
      quantity: selected[id] ?? 0,
    })).filter((c) => c.quantity > 0);

    if (contributions.length === 0) return;
    await joinParty(activityId, contributions);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="w-[480px] max-w-[90vw] bg-purple-deep rounded-[20px] p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-xl text-white">报名并贡献物料</h2>
          <button
            className="text-purple-border hover:text-white transition-colors"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {userMaterials.length === 0 ? (
          <p className="text-center text-purple-border py-8 font-body">
            您还没有可用材料，请先在材料库中添加
          </p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {userMaterials.map((mat) => {
              const isChecked = checked.has(mat.id);
              const qty = selected[mat.id] ?? 0;

              return (
                <div
                  key={mat.id}
                  className={`flex items-center gap-3 bg-purple-card rounded-lg border border-purple-border/50 p-3 transition-colors ${
                    isChecked ? 'border-amber-primary/60' : ''
                  }`}
                >
                  <button
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isChecked ? 'bg-amber-primary border-amber-primary' : 'border-purple-border'
                    }`}
                    onClick={() => toggleCheck(mat.id)}
                  >
                    {isChecked && <span className="text-[10px] text-white font-bold">✓</span>}
                  </button>

                  <span className="text-2xl shrink-0">{mat.emoji}</span>
                  <span className="text-sm text-white font-body flex-1 truncate">{mat.name}</span>

                  {isChecked && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        className="w-5 h-5 rounded-full bg-amber-primary text-white flex items-center justify-center hover:bg-amber-dark transition-colors"
                        onClick={() => setQty(mat.id, qty - 1)}
                      >
                        <Minus size={10} />
                      </button>
                      <span className="text-white text-sm min-w-[20px] text-center">{qty}</span>
                      <button
                        className="w-5 h-5 rounded-full bg-amber-primary text-white flex items-center justify-center hover:bg-amber-dark transition-colors"
                        onClick={() => setQty(mat.id, qty + 1)}
                      >
                        <Plus size={10} />
                      </button>
                      <span className="text-xs text-purple-border">/{mat.quantity}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <button
          className="mt-5 w-full py-2.5 rounded-lg font-display font-bold text-white bg-gradient-to-r from-amber-primary to-amber-dark hover:opacity-90 transition-opacity disabled:opacity-40"
          onClick={handleSubmit}
          disabled={userMaterials.length === 0 || Array.from(checked).every((id) => (selected[id] ?? 0) <= 0)}
        >
          确认报名
        </button>
      </div>
    </div>
  );
}

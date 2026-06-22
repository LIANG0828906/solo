import { useState } from 'react';
import { ChevronRight, ChevronLeft, Plus, Minus } from 'lucide-react';
import { usePartyStore } from '@/stores/partyStore';
import type { UserMaterial } from '@/types';
import { cn } from '@/lib/utils';

const EMOJI_OPTIONS = ['🧶', '🏺', '🎨', '🪵', '🖌️', '✂️', '🪡', '🔨', '🧻', '📄', '🍽️'];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { userMaterials, addMaterial, updateMaterial } = usePartyStore();
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmoji, setFormEmoji] = useState(EMOJI_OPTIONS[0]);
  const [formQuantity, setFormQuantity] = useState(1);

  const handleAdd = async () => {
    if (!formName.trim()) return;
    await addMaterial(formName.trim(), formEmoji, formQuantity);
    setFormName('');
    setFormEmoji(EMOJI_OPTIONS[0]);
    setFormQuantity(1);
    setShowForm(false);
  };

  const handleQty = (m: UserMaterial, delta: number) => {
    updateMaterial(m.id, m.quantity + delta);
  };

  return (
    <>
      {collapsed && (
        <button
          onClick={onToggle}
          className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 z-40
            w-3 bg-purple-sidebar hover:bg-amber-primary rounded-l-lg
            items-center justify-center py-8 transition-colors duration-200"
        >
          <ChevronLeft className="w-3 h-3 text-white" />
        </button>
      )}

      {collapsed && (
        <div className="md:hidden fixed inset-0 z-40 pointer-events-none" />
      )}

      <aside
        className={cn(
          'h-full bg-purple-sidebar border-l border-purple-border/30 flex flex-col',
          'transition-all duration-300 overflow-hidden',
          collapsed ? 'w-0' : 'w-[280px]',
          'max-md:fixed max-md:right-0 max-md:top-0 max-md:z-50 max-md:h-screen',
        )}
      >
        <div className="w-[280px] min-w-[280px] h-full flex flex-col">
          <div className="flex items-center justify-between px-4 py-4 border-b border-purple-border/20">
            <h2 className="font-display font-bold text-white text-lg">我的材料库</h2>
            <button
              onClick={onToggle}
              className="w-8 h-8 flex items-center justify-center rounded-lg
                hover:bg-purple-hover transition-colors"
            >
              <ChevronRight
                className={cn(
                  'w-5 h-5 text-white transition-transform duration-300',
                  collapsed ? 'rotate-0' : 'rotate-180',
                )}
              />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {userMaterials.map((m) => (
              <div
                key={m.id}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-purple-hover transition-colors',
                  m.quantity <= 0 && 'hidden',
                )}
              >
                <span className="text-xl">{m.emoji}</span>
                <span className="text-white text-sm flex-1 truncate">{m.name}</span>
                <span className="text-amber-primary font-bold text-sm min-w-[20px] text-center">
                  {m.quantity}
                </span>
                <button
                  onClick={() => handleQty(m, -1)}
                  className="w-6 h-6 rounded-full bg-purple-card text-white
                    flex items-center justify-center hover:bg-amber-primary transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleQty(m, 1)}
                  className="w-6 h-6 rounded-full bg-purple-card text-white
                    flex items-center justify-center hover:bg-amber-primary transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-purple-border/20 p-3">
            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                  text-white/70 hover:text-white hover:bg-purple-hover transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                添加新材料
              </button>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="材料名称"
                  className="w-full px-3 py-2 rounded-lg bg-purple-card text-white text-sm
                    placeholder-white/40 border border-purple-border/30 outline-none
                    focus:border-amber-primary transition-colors"
                />
                <div className="flex flex-wrap gap-1.5">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setFormEmoji(emoji)}
                      className={cn(
                        'w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-all',
                        formEmoji === emoji
                          ? 'bg-amber-primary scale-110'
                          : 'bg-purple-card hover:bg-purple-hover',
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/60 text-sm">数量</span>
                  <input
                    type="number"
                    min={1}
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 px-3 py-1.5 rounded-lg bg-purple-card text-white text-sm
                      border border-purple-border/30 outline-none focus:border-amber-primary transition-colors"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAdd}
                    className="flex-1 py-2 rounded-lg bg-gradient-to-r from-amber-primary to-amber-dark
                      text-white font-bold text-sm hover:opacity-90 transition-opacity"
                  >
                    确认添加
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-lg bg-purple-card text-white/60 text-sm
                      hover:text-white hover:bg-purple-hover transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {!collapsed && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={onToggle}
        />
      )}
    </>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DyeColor, DyeRecipe } from '../utils/types';

interface DyeRackProps {
  recipe: DyeRecipe | null;
  onSelect: (recipe: DyeRecipe) => void;
  disabled: boolean;
}

const DYE_INFO: Record<DyeColor, { name: string; color: string; hex: string }> = {
  indigo: { name: '靛蓝', color: 'indigo', hex: '#1a5276' },
  madder: { name: '茜草红', color: 'madder', hex: '#a93226' },
  gardenia: { name: '栀子黄', color: 'gardenia', hex: '#f4d03f' },
};

interface Mist {
  id: number;
  color: string;
  x: number;
  y: number;
}

export function DyeRack({ recipe, onSelect, disabled }: DyeRackProps) {
  const [mists, setMists] = useState<Mist[]>([]);

  const handleDyeClick = (color: DyeColor, e: React.MouseEvent) => {
    if (disabled) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const newMist: Mist = {
      id: Date.now(),
      color: DYE_INFO[color].hex,
      x: rect.left + rect.width / 2,
      y: rect.top,
    };

    setMists((prev) => [...prev, newMist]);
    setTimeout(() => {
      setMists((prev) => prev.filter((m) => m.id !== newMist.id));
    }, 1000);

    if (!recipe) {
      onSelect({ primary: color });
    } else if (recipe.primary === color) {
      if (recipe.secondary) {
        onSelect({ primary: recipe.secondary, mixRatio: 1 - (recipe.mixRatio ?? 0.6) });
      }
    } else if (!recipe.secondary) {
      onSelect({ ...recipe, secondary: color, mixRatio: 0.6 });
    } else if (recipe.secondary === color) {
      onSelect({ primary: color });
    } else {
      onSelect({ primary: recipe.primary, secondary: color, mixRatio: 0.6 });
    }
  };

  const isActive = (color: DyeColor) => {
    if (!recipe) return false;
    return recipe.primary === color || recipe.secondary === color;
  };

  const dyes: DyeColor[] = ['indigo', 'madder', 'gardenia'];

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h3 className="text-xl text-[#3e2723]">染料架</h3>
      <div className="flex flex-col gap-6">
        {dyes.map((color) => (
          <div key={color} className="flex flex-col items-center gap-2">
            <motion.div
              className={`dye-jar ${DYE_INFO[color].color} ${isActive(color) ? 'active' : ''}`}
              onClick={(e) => handleDyeClick(color, e)}
              whileHover={!disabled ? { scale: 1.1 } : {}}
              whileTap={!disabled ? { scale: 0.95 } : {}}
              style={{ color: DYE_INFO[color].hex }}
            />
            <span className="text-sm text-[#3e2723]">{DYE_INFO[color].name}</span>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {mists.map((mist) => (
          <motion.div
            key={mist.id}
            className="dye-mist"
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: [0, 0.8, 0], y: -80, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              left: mist.x - 15,
              top: mist.y - 30,
              background: `radial-gradient(circle, ${mist.color}88 0%, ${mist.color}00 70%)`,
              position: 'fixed',
              zIndex: 100,
            }}
          />
        ))}
      </AnimatePresence>

      {recipe && (
        <div className="paper-btn mt-2 text-sm">
          {recipe.secondary ? (
            <span>
              {DYE_INFO[recipe.primary].name} + {DYE_INFO[recipe.secondary].name}
            </span>
          ) : (
            <span>{DYE_INFO[recipe.primary].name}</span>
          )}
        </div>
      )}
    </div>
  );
}

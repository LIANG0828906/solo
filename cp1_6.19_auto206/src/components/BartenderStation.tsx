import { motion } from 'framer-motion';
import { useTavernStore, computeProfile, blendColors, computeMatchScore } from '../store';
import { INGREDIENTS } from '../types';
import type { Ingredient } from '../types';

const CATEGORY_NAMES: Record<string, string> = {
  base: '基底酒',
  liqueur: '利口酒',
  juice: '果汁',
  bitters: '苦精',
};

function IngredientBottle({ ingredient }: { ingredient: Ingredient }) {
  const addIngredient = useTavernStore(s => s.addIngredient);
  const slots = useTavernStore(s => s.slots);
  const canAdd = slots.some(s => !s.ingredient);

  return (
    <motion.div
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      onClick={() => canAdd && addIngredient(ingredient)}
      style={{
        width: 56,
        height: 80,
        borderRadius: 8,
        background: `linear-gradient(180deg, ${ingredient.color}22 0%, ${ingredient.color}08 100%)`,
        border: `1px solid ${canAdd ? ingredient.glowColor + '66' : '#4A3A6A'}44`,
        position: 'relative',
        cursor: canAdd ? 'pointer' : 'not-allowed',
        opacity: canAdd ? 1 : 0.4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '6px 4px',
        transition: 'box-shadow 0.3s',
      }}
      onMouseEnter={(e) => {
        if (canAdd) {
          (e.currentTarget as HTMLElement).style.boxShadow = `0 0 24px ${ingredient.glowColor}66, inset 0 0 12px ${ingredient.glowColor}22`;
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 6,
          width: 20,
          height: 10,
          borderRadius: '3px 3px 1px 1px',
          background: `linear-gradient(180deg, ${ingredient.glowColor} 0%, ${ingredient.glowColor}88 100%)`,
          boxShadow: `0 0 8px ${ingredient.glowColor}`,
        }}
      />
      <div
        style={{
          width: 34,
          height: 46,
          borderRadius: '4px 4px 6px 6px',
          background: `linear-gradient(180deg, ${ingredient.color} 0%, ${ingredient.color}cc 100%)`,
          boxShadow: `inset 0 -8px 16px ${ingredient.glowColor}44, 0 0 12px ${ingredient.color}33`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 6,
            left: 6,
            width: 8,
            height: 20,
            background: 'rgba(255,255,255,0.18)',
            borderRadius: 4,
          }}
        />
      </div>
      <div
        style={{
          fontSize: 8,
          marginTop: 4,
          color: '#B388FF',
          letterSpacing: 0.5,
          textAlign: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%',
          fontFamily: "'ZCOOL KuaiLe', sans-serif",
        }}
      >
        {ingredient.name}
      </div>
    </motion.div>
  );
}

function SlotView({ index }: { index: number }) {
  const slots = useTavernStore(s => s.slots);
  const removeIngredient = useTavernStore(s => s.removeIngredient);
  const adjustAmount = useTavernStore(s => s.adjustAmount);
  const slot = slots[index];

  if (!slot.ingredient) {
    return (
      <div
        style={{
          width: 200,
          height: 80,
          borderRadius: 12,
          background: 'rgba(42,26,74,0.3)',
          border: '1px dashed rgba(179,136,255,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(179,136,255,0.35)',
          fontSize: 13,
          letterSpacing: 2,
        }}
      >
        槽位 {index + 1} · 空
      </div>
    );
  }

  const ing = slot.ingredient;
  const fillPercent = (slot.amount / 100) * 100;

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{
        width: 200,
        height: 80,
        borderRadius: 12,
        background: `linear-gradient(90deg, ${ing.color}18 0%, rgba(42,26,74,0.6) 100%)`,
        border: `1px solid ${ing.glowColor}66`,
        boxShadow: `0 0 16px ${ing.glowColor}22, inset 0 0 12px ${ing.glowColor}11`,
        display: 'flex',
        alignItems: 'center',
        padding: 10,
        gap: 10,
        position: 'relative',
      }}
    >
      <div
        style={{
          width: 36,
          height: 56,
          borderRadius: 6,
          background: `linear-gradient(180deg, ${ing.color} 0%, ${ing.color}aa 100%)`,
          boxShadow: `0 0 10px ${ing.glowColor}66`,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#E0C3FF',
            letterSpacing: 0.5,
            marginBottom: 6,
            fontFamily: "'ZCOOL KuaiLe', sans-serif",
          }}
        >
          {ing.name}
        </div>
        <div
          style={{
            height: 14,
            borderRadius: 7,
            background: 'rgba(0,0,0,0.35)',
            overflow: 'hidden',
            position: 'relative',
            border: '1px solid rgba(179,136,255,0.2)',
          }}
        >
          <motion.div
            animate={{ width: `${fillPercent}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              height: '100%',
              background: `linear-gradient(90deg, ${ing.glowColor} 0%, ${ing.color} 100%)`,
              boxShadow: `0 0 10px ${ing.glowColor}88`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              color: '#fff',
              fontWeight: 700,
              letterSpacing: 0.5,
              textShadow: '0 1px 2px rgba(0,0,0,0.6)',
            }}
          >
            {slot.amount}ml
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => adjustAmount(index, -5)}
            style={{
              flex: 1,
              height: 20,
              borderRadius: 4,
              background: 'rgba(224,64,251,0.15)',
              border: '1px solid rgba(224,64,251,0.4)',
              color: '#E040FB',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
              lineHeight: 1,
              padding: 0,
            }}
          >
            −
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => adjustAmount(index, 5)}
            style={{
              flex: 1,
              height: 20,
              borderRadius: 4,
              background: 'rgba(0,229,255,0.15)',
              border: '1px solid rgba(0,229,255,0.4)',
              color: '#00E5FF',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
              lineHeight: 1,
              padding: 0,
            }}
          >
            +
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => removeIngredient(index)}
            style={{
              width: 28,
              height: 20,
              borderRadius: 4,
              background: 'rgba(255,82,82,0.15)',
              border: '1px solid rgba(255,82,82,0.4)',
              color: '#FF5252',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 700,
              lineHeight: 1,
              padding: 0,
            }}
          >
            ✕
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default function BartenderStation() {
  const slots = useTavernStore(s => s.slots);
  const isMixing = useTavernStore(s => s.isMixing);
  const startMix = useTavernStore(s => s.startMix);
  const finishMix = useTavernStore(s => s.finishMix);
  const currentEmotion = useTavernStore(s => s.currentEmotion);
  const clearSlots = useTavernStore(s => s.clearSlots);

  const hasIngredients = slots.some(s => s.ingredient);
  const categories = ['base', 'liqueur', 'juice', 'bitters'] as const;

  const handleMix = () => {
    if (!hasIngredients || isMixing) return;
    startMix();
    setTimeout(() => {
      const profile = computeProfile(slots);
      const blendedColor = blendColors(slots);
      const matchScore = computeMatchScore(profile, currentEmotion);
      const nameParts = slots.filter(s => s.ingredient).map(s => s.ingredient!.nameEn.split(' ')[0]);
      const name = nameParts.slice(0, 2).join(' ') + ' · NEO';
      finishMix({
        id: `rc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        createdAt: Date.now(),
        name,
        slots: slots.map(s => ({ ...s })),
        profile,
        blendedColor,
        customerMatch: matchScore >= 0.7 ? currentEmotion.type : null,
        matchScore,
      });
    }, 500);
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 860,
        height: 560,
        borderRadius: 20,
        background: 'linear-gradient(135deg, rgba(26,10,62,0.7) 0%, rgba(15,2,32,0.85) 100%)',
        border: '1px solid rgba(179,136,255,0.3)',
        boxShadow: `
          0 0 60px rgba(179,136,255,0.15),
          inset 0 1px 0 rgba(179,136,255,0.15),
          inset 0 0 40px rgba(179,136,255,0.04)
        `,
        backdropFilter: 'blur(8px)',
        display: 'flex',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: 'linear-gradient(90deg, transparent, #B388FF, #E040FB, #00E5FF, transparent)',
          boxShadow: '0 0 20px rgba(179,136,255,0.6)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: 2,
          background: 'linear-gradient(180deg, #B388FF, transparent)',
          boxShadow: '0 0 12px rgba(179,136,255,0.5)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: 2,
          background: 'linear-gradient(180deg, #E040FB, transparent)',
          boxShadow: '0 0 12px rgba(224,64,251,0.5)',
        }}
      />

      <div
        style={{
          width: 140,
          padding: '20px 14px',
          borderRight: '1px solid rgba(179,136,255,0.1)',
          overflowY: 'auto',
        }}
      >
        {categories.map((cat) => {
          const items = INGREDIENTS.filter(i => i.category === cat);
          return (
            <div key={cat} style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 10,
                  color: '#6B4F9E',
                  letterSpacing: 2,
                  marginBottom: 8,
                  paddingLeft: 2,
                }}
              >
                {CATEGORY_NAMES[cat]}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                {items.map(ing => (
                  <IngredientBottle key={ing.id} ingredient={ing} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: 24,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 24,
            right: 24,
            color: 'rgba(179,136,255,0.5)',
            fontSize: 11,
            letterSpacing: 2,
          }}
        >
          MIXING LAB · 混合区
        </div>

        <div style={{ flex: 1 }} />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            marginBottom: 20,
          }}
        >
          {[0, 1, 2].map(i => (
            <SlotView key={i} index={i} />
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 32,
            paddingBottom: 4,
          }}
        >
          <motion.button
            whileHover={{ scale: 1.05, borderColor: '#FF5252' }}
            whileTap={{ scale: 0.95 }}
            onClick={clearSlots}
            disabled={!hasIngredients}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              background: 'rgba(42,26,74,0.6)',
              border: '1px solid rgba(179,136,255,0.3)',
              color: hasIngredients ? '#FF80AB' : 'rgba(179,136,255,0.3)',
              cursor: hasIngredients ? 'pointer' : 'not-allowed',
              fontSize: 13,
              letterSpacing: 2,
              fontFamily: "'Orbitron', sans-serif",
            }}
          >
            清空
          </motion.button>

          <motion.button
            whileHover={{ scale: hasIngredients && !isMixing ? 1.05 : 1 }}
            whileTap={{ scale: hasIngredients && !isMixing ? 0.94 : 1 }}
            onClick={handleMix}
            disabled={!hasIngredients || isMixing}
            animate={isMixing ? { rotate: 360 } : { rotate: 0 }}
            transition={isMixing ? { duration: 1.2, repeat: Infinity, ease: 'linear' } : {}}
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: hasIngredients && !isMixing
                ? 'linear-gradient(135deg, #B388FF 0%, #00E5FF 50%, #E040FB 100%)'
                : 'rgba(74,58,106,0.4)',
              border: 'none',
              cursor: hasIngredients && !isMixing ? 'pointer' : 'not-allowed',
              boxShadow: hasIngredients && !isMixing
                ? '0 0 40px rgba(179,136,255,0.5), 0 0 80px rgba(0,229,255,0.2), inset 0 0 20px rgba(255,255,255,0.2)'
                : 'none',
              color: hasIngredients ? '#fff' : 'rgba(179,136,255,0.4)',
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: 2,
              fontFamily: "'Orbitron', sans-serif",
              position: 'relative',
            }}
          >
            {isMixing ? '⚙' : 'MIX'}
            {isMixing && (
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: '2px solid #00E5FF',
                }}
              />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

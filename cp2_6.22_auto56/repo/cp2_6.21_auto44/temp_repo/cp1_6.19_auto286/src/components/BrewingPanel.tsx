import { motion, AnimatePresence } from 'framer-motion'
import { useRecipeStore } from '../store/useRecipeStore'
import type { BaseId, SyrupId } from '../store/useRecipeStore'

const BASE_CONFIG: { id: BaseId; icon: string; label: string }[] = [
  { id: 'espresso', icon: '☕', label: '浓缩' },
  { id: 'milk', icon: '🥛', label: '牛奶' },
  { id: 'oatMilk', icon: '🌾', label: '燕麦奶' },
  { id: 'matcha', icon: '🍵', label: '抹茶' },
  { id: 'cocoa', icon: '🍫', label: '可可' },
  { id: 'water', icon: '💧', label: '水' },
]

const SYRUP_CONFIG: { id: SyrupId; icon: string; label: string }[] = [
  { id: 'vanilla', icon: '🌿', label: '香草' },
  { id: 'caramel', icon: '🍯', label: '焦糖' },
  { id: 'hazelnut', icon: '🌰', label: '榛果' },
  { id: 'mint', icon: '🍃', label: '薄荷' },
]

const BASE_NAMES: Record<BaseId, string> = {
  espresso: '浓缩',
  milk: '牛奶',
  oatMilk: '燕麦奶',
  matcha: '抹茶',
  cocoa: '可可',
  water: '水',
}

const SYRUP_NAMES: Record<SyrupId, string> = {
  vanilla: '香草',
  caramel: '焦糖',
  hazelnut: '榛果',
  mint: '薄荷',
}

function buildDrinkName(bases: BaseId[], syrups: SyrupId[]): string {
  const parts: string[] = []
  for (const b of bases) parts.push(BASE_NAMES[b])
  for (const s of syrups) parts.push(SYRUP_NAMES[s])
  return parts.join('+')
}

export default function BrewingPanel() {
  const currentBases = useRecipeStore((s) => s.currentBases)
  const currentSyrups = useRecipeStore((s) => s.currentSyrups)
  const isBrewing = useRecipeStore((s) => s.isBrewing)
  const justBrewed = useRecipeStore((s) => s.justBrewed)
  const toggleBase = useRecipeStore((s) => s.toggleBase)
  const toggleSyrup = useRecipeStore((s) => s.toggleSyrup)
  const startBrewing = useRecipeStore((s) => s.startBrewing)
  const finishBrewing = useRecipeStore((s) => s.finishBrewing)
  const saveDrink = useRecipeStore((s) => s.saveDrink)
  const discardDrink = useRecipeStore((s) => s.discardDrink)

  const hasBases = currentBases.length > 0
  const combinationText = hasBases
    ? buildDrinkName(currentBases, currentSyrups)
    : '请选择配方...'

  const canBrew = hasBases && !isBrewing

  function handleBrew() {
    if (!canBrew) return
    startBrewing()
    setTimeout(() => finishBrewing(), 2000)
  }

  return (
    <div
      style={{
        background: '#4E342E',
        border: '2px solid #5D4037',
        borderRadius: 0,
        padding: 16,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: '#FFF8DC',
          textAlign: 'center',
          marginBottom: 12,
        }}
      >
        {combinationText}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          justifyContent: 'center',
          marginBottom: 8,
        }}
      >
        {BASE_CONFIG.map((base) => {
          const selected = currentBases.includes(base.id)
          return (
            <motion.button
              key={base.id}
              layout
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.1, layout: { duration: 0.3, ease: 'easeInOut' } }}
              onClick={() => toggleBase(base.id)}
              style={{
                width: 70,
                height: 70,
                border: '2px dashed white',
                background: selected ? '#8B4513' : '#FFF8DC',
                color: selected ? '#FFF8DC' : '#3E2723',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>{base.icon}</span>
              <span style={{ fontSize: 8, lineHeight: 1, marginTop: 4 }}>{base.label}</span>
            </motion.button>
          )
        })}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        {SYRUP_CONFIG.map((syrup) => {
          const selected = currentSyrups.includes(syrup.id)
          return (
            <motion.button
              key={syrup.id}
              layout
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.1, layout: { duration: 0.3, ease: 'easeInOut' } }}
              onClick={() => toggleSyrup(syrup.id)}
              style={{
                width: 70,
                height: 70,
                border: '2px dashed white',
                background: selected ? '#8B4513' : '#FFF8DC',
                color: selected ? '#FFF8DC' : '#3E2723',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>{syrup.icon}</span>
              <span style={{ fontSize: 8, lineHeight: 1, marginTop: 4 }}>{syrup.label}</span>
            </motion.button>
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <motion.button
          whileTap={canBrew ? { scale: 0.9 } : undefined}
          transition={{ duration: 0.1 }}
          onClick={handleBrew}
          disabled={!canBrew}
          style={{
            width: 160,
            height: 44,
            border: '2px dashed white',
            background: '#FFF8DC',
            color: '#3E2723',
            cursor: canBrew ? 'pointer' : 'not-allowed',
            opacity: canBrew ? 1 : 0.5,
            fontSize: 14,
          }}
        >
          {isBrewing ? (
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            >
              制作中...
            </motion.span>
          ) : (
            '一键制作'
          )}
        </motion.button>
      </div>

      <AnimatePresence>
        {justBrewed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{
              border: '2px dashed white',
              background: '#5D4037',
              color: '#FFF8DC',
              padding: 12,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 12, marginBottom: 8 }}>
              {buildDrinkName(justBrewed.bases, justBrewed.syrups)}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <motion.button
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.1 }}
                onClick={saveDrink}
                style={{
                  border: '2px dashed white',
                  background: '#8B4513',
                  color: '#FFF8DC',
                  padding: '4px 12px',
                  cursor: 'pointer',
                  fontSize: 10,
                }}
              >
                保存
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.1 }}
                onClick={discardDrink}
                style={{
                  border: '2px dashed white',
                  background: '#FFF8DC',
                  color: '#3E2723',
                  padding: '4px 12px',
                  cursor: 'pointer',
                  fontSize: 10,
                }}
              >
                丢弃
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlantStore, HybridResult, Plant } from '@/store/plantStore'

export default function HybridPanel() {
  const plants = usePlantStore((s) => s.plants)
  const hybridize = usePlantStore((s) => s.hybridize)
  const lastHybridResult = usePlantStore((s) => s.lastHybridResult)
  const addPlant = usePlantStore((s) => s.addPlant)

  const [selected, setSelected] = useState<string[]>([])

  function handleSelect(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id)
      }
      if (prev.length >= 2) {
        return prev
      }
      return [...prev, id]
    })
  }

  function handleHybridize() {
    if (selected.length !== 2) return
    const p1 = plants.find((p) => p.id === selected[0])
    const p2 = plants.find((p) => p.id === selected[1])
    if (!p1 || !p2) return
    hybridize(p1, p2)
  }

  function handleAddToDish(result: HybridResult) {
    const x = 0.2 + Math.random() * 0.6
    const y = 0.2 + Math.random() * 0.6
    const plant: Plant = {
      id: result.id,
      name: result.name,
      type: result.type,
      glowColor: result.glowColor,
      resilience: result.resilience,
      x,
      y,
      growth: 10,
    }
    addPlant(plant)
  }

  const canHybridize = selected.length === 2

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="h-full w-full overflow-y-auto rounded-lg border border-white/[0.08] bg-white/[0.06] p-4"
      style={{ backdropFilter: 'blur(8px)' }}
    >
      <h2 className="mb-4 text-lg font-bold text-cyan-400">杂交育种</h2>

      <div className="mb-3 max-h-[200px] overflow-y-auto rounded-lg border border-white/[0.08] bg-white/[0.03]">
        {plants.length === 0 && (
          <p className="p-3 text-center text-white/30 text-sm">暂无植株</p>
        )}
        {plants.map((plant) => {
          const isSelected = selected.includes(plant.id)
          return (
            <div
              key={plant.id}
              onClick={() => handleSelect(plant.id)}
              className={`flex cursor-pointer items-center gap-2 px-3 py-2 transition-colors hover:bg-white/[0.06] ${
                isSelected ? 'ring-2 ring-cyan-400 bg-white/[0.08]' : ''
              }`}
            >
              <span
                className="inline-block h-3 w-3 shrink-0 rounded-full"
                style={{
                  background: `hsl(${plant.glowColor.h}, ${plant.glowColor.s}%, ${plant.glowColor.l}%)`,
                }}
              />
              <span className="text-white/80 text-sm">{plant.name}</span>
              <span className="ml-auto text-white/40 text-xs">{plant.type}</span>
            </div>
          )
        })}
      </div>

      <button
        onClick={handleHybridize}
        disabled={!canHybridize}
        className={`mb-4 w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 py-2 font-bold text-white transition-opacity ${
          canHybridize ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-40'
        }`}
      >
        杂交
      </button>

      <AnimatePresence>
        {lastHybridResult && (
          <motion.div
            key={lastHybridResult.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <HybridResultCard result={lastHybridResult} onAdd={handleAddToDish} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function HybridResultCard({
  result,
  onAdd,
}: {
  result: HybridResult
  onAdd: (r: HybridResult) => void
}) {
  const hslValue = `hsl(${result.glowColor.h}, ${result.glowColor.s}%, ${result.glowColor.l}%)`
  const resiliencePct = Math.round(result.resilience * 100)

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}
      transition={{ duration: 0.2 }}
      className="rounded-lg border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-sm"
    >
      <div className="mb-3 flex items-center gap-3">
        <span
          className="inline-block h-12 w-12 shrink-0 rounded-full"
          style={{
            background: hslValue,
            boxShadow: `0 0 20px ${hslValue}`,
          }}
        />
        <div>
          <p className="text-cyan-300 font-medium">{result.name}</p>
          <p className="text-white/40 text-xs">{result.type}</p>
        </div>
      </div>

      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-white/60 text-xs">适应力</span>
          <span className="font-mono text-white text-xs">{resiliencePct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-green-400 to-yellow-400"
            style={{ width: `${resiliencePct}%` }}
          />
        </div>
      </div>

      <button
        onClick={() => onAdd(result)}
        className="w-full rounded-md border border-cyan-400/30 bg-cyan-400/10 py-1.5 text-cyan-300 text-sm transition-colors hover:bg-cyan-400/20"
      >
        放入培养皿
      </button>
    </motion.div>
  )
}

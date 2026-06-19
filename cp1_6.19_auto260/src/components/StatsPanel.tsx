import React from 'react'
import { useEcosystemStore } from '@/store/ecosystemStore'
import { usePlantStore } from '@/store/plantStore'

const StatsPanel = React.memo(function StatsPanel() {
  const plantCount = usePlantStore((s) => s.plants.length)
  const hybridCount = usePlantStore((s) => s.hybridCount)
  const maxStableDays = useEcosystemStore((s) => s.maxStableDays)
  const stableSeconds = useEcosystemStore((s) => s.stableSeconds)
  const achievementUnlocked = useEcosystemStore((s) => s.achievementUnlocked)

  return (
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.06] p-4" style={{ backdropFilter: 'blur(8px)' }}>
      <h3 className="mb-3 text-sm font-bold text-cyan-400">数据统计</h3>
      <div className="flex flex-col gap-2">
        <StatRow label="存活植物" value={String(plantCount)} />
        <StatRow label="已杂交次数" value={String(hybridCount)} />
        <StatRow label="连续稳定天数" value={`${maxStableDays}天 ${stableSeconds}秒`} />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-white/50 text-xs">成就</span>
          <span className={`text-xs font-medium ${achievementUnlocked ? 'text-yellow-400' : 'text-white/30'}`}>
            {achievementUnlocked ? '🏆 稳定生态' : '未解锁'}
          </span>
        </div>
      </div>
    </div>
  )
})

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/50 text-xs">{label}</span>
      <span className="font-mono text-white text-xs">{value}</span>
    </div>
  )
}

export default StatsPanel

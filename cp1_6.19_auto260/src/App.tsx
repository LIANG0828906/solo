import { useEffect, useRef } from 'react'
import StatusBar from '@/components/StatusBar'
import EcoPanel from '@/components/EcoPanel'
import CultureDish from '@/components/CultureDish'
import HybridPanel from '@/components/HybridPanel'
import StatsPanel from '@/components/StatsPanel'
import { useEcosystemStore } from '@/store/ecosystemStore'
import { usePlantStore } from '@/store/plantStore'

export default function App() {
  const tick = useEcosystemStore((s) => s.tick)
  const tickCount = useEcosystemStore((s) => s.tickCount)
  const temperature = useEcosystemStore((s) => s.temperature)
  const humidity = useEcosystemStore((s) => s.humidity)
  const light = useEcosystemStore((s) => s.light)
  const alertActive = useEcosystemStore((s) => s.alertActive)
  const updateGrowth = usePlantStore((s) => s.updateGrowth)
  const applyAlertDamage = usePlantStore((s) => s.applyAlertDamage)
  const tickRef = useRef(tick)
  const updateGrowthRef = useRef(updateGrowth)
  const applyAlertDamageRef = useRef(applyAlertDamage)

  tickRef.current = tick
  updateGrowthRef.current = updateGrowth
  applyAlertDamageRef.current = applyAlertDamage

  useEffect(() => {
    const interval = setInterval(() => {
      tickRef.current()
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const isSimDay = tickCount > 0 && tickCount % 30 === 0
    if (isSimDay) {
      updateGrowthRef.current(temperature, humidity, light, alertActive, true)
    }
    if (alertActive) {
      applyAlertDamageRef.current()
    }
  }, [tickCount, temperature, humidity, light, alertActive])

  return (
    <div className="min-h-screen bg-[#0f0f23] text-white flex flex-col">
      <StatusBar />

      <header className="flex items-center justify-center py-3 border-b border-white/[0.06]">
        <h1 className="text-lg font-bold tracking-widest text-cyan-400" style={{ fontFamily: "'Orbitron', sans-serif" }}>
          LAB ECOSYSTEM
        </h1>
        <span className="ml-3 text-xs text-white/30">微型生态缸模拟系统</span>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <aside className="w-[20%] min-w-[220px] p-3 flex flex-col">
          <EcoPanel />
        </aside>

        <section className="flex-1 flex items-center justify-center p-4 relative">
          <CultureDish />
          <div className="absolute bottom-4 right-4 w-[200px]">
            <StatsPanel />
          </div>
        </section>

        <aside className="w-[20%] min-w-[220px] p-3 flex flex-col">
          <HybridPanel />
        </aside>
      </main>
    </div>
  )
}

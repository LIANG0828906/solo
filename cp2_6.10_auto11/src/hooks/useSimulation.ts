import { useState, useEffect, useRef } from 'react'

interface SimulationState {
  waterSpeed: number
  rotationSpeed: number
  poundingFrequency: number
  poundingDepth: number
  impulse: number
  fps: number
}

export function useSimulation(
  gateOpening: number,
  bladeAngle: number,
  gearRatio: number
): SimulationState {
  const [state, setState] = useState<SimulationState>({
    waterSpeed: 0,
    rotationSpeed: 0,
    poundingFrequency: 0,
    poundingDepth: 0,
    impulse: 0,
    fps: 60
  })

  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const calculate = () => {
      const now = performance.now()
      const delta = (now - lastTimeRef.current) / 1000

      frameCountRef.current++
      if (delta >= 1) {
        const fps = Math.round(frameCountRef.current / delta)
        frameCountRef.current = 0
        lastTimeRef.current = now

        const waterSpeed = (gateOpening / 100) * 5
        const rotationSpeed = waterSpeed * (bladeAngle / 15) * 0.8
        const poundingFrequency = rotationSpeed / gearRatio
        const poundingDepth = 0.1 + (poundingFrequency / 2) * 0.5
        const impulse = poundingFrequency * poundingDepth * 10

        setState({
          waterSpeed: parseFloat(waterSpeed.toFixed(2)),
          rotationSpeed: parseFloat(rotationSpeed.toFixed(2)),
          poundingFrequency: parseFloat(poundingFrequency.toFixed(2)),
          poundingDepth: parseFloat(Math.min(poundingDepth, 0.6).toFixed(2)),
          impulse: parseFloat(impulse.toFixed(2)),
          fps
        })
      }

      animationRef.current = requestAnimationFrame(calculate)
    }

    animationRef.current = requestAnimationFrame(calculate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gateOpening, bladeAngle, gearRatio])

  return state
}

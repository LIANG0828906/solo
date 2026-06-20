import { FoodParticle, ToxinParticle, ExplosionParticle } from './store'

const DISH_RADIUS = 350
const DISH_CENTER = 350

export class EnvironmentModule {
  isPointInDish(x: number, y: number): boolean {
    const dx = x - DISH_CENTER
    const dy = y - DISH_CENTER
    return Math.sqrt(dx * dx + dy * dy) <= DISH_RADIUS
  }

  clampToDish(x: number, y: number): { x: number; y: number } {
    const dx = x - DISH_CENTER
    const dy = y - DISH_CENTER
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist <= DISH_RADIUS - 10) return { x, y }
    const nx = dx / dist
    const ny = dy / dist
    return {
      x: DISH_CENTER + nx * (DISH_RADIUS - 10),
      y: DISH_CENTER + ny * (DISH_RADIUS - 10)
    }
  }

  updateFoodParticles(particles: FoodParticle[]): FoodParticle[] {
    return particles
      .map((p) => ({ ...p, lifetime: p.lifetime - 1 }))
      .filter((p) => p.lifetime > 0)
  }

  updateToxinParticles(particles: ToxinParticle[]): ToxinParticle[] {
    return particles
      .map((p) => ({ ...p, lifetime: p.lifetime - 1 }))
      .filter((p) => p.lifetime > 0)
  }

  updateExplosionParticles(particles: ExplosionParticle[]): ExplosionParticle[] {
    return particles
      .map((p) => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vx: p.vx * 0.95,
        vy: p.vy * 0.95,
        lifetime: p.lifetime - 1
      }))
      .filter((p) => p.lifetime > 0)
  }

  getTemperatureEffectOnMetabolism(temperature: number): number {
    if (temperature < 15) return 0
    if (temperature > 85) return 2
    return 0.5 + (temperature / 100) * 1.5
  }
}

export const environmentModule = new EnvironmentModule()

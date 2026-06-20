import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'

type LightType = 'point' | 'spot' | 'directional'

interface LightSource {
  id: string
  type: LightType
  position: { x: number; y: number; z: number }
  direction: { x: number; y: number; z: number }
  intensity: number
  colorTemperature: number
}

interface LightingPlan {
  id: string
  name: string
  lights: LightSource[]
  createdAt: string
}

const router = Router()

const plans: LightingPlan[] = []

router.get('/', (_req: Request, res: Response) => {
  res.json(plans)
})

router.post('/', (req: Request, res: Response) => {
  const plan: LightingPlan = {
    id: uuidv4(),
    name: req.body.name ?? 'Untitled Plan',
    lights: req.body.lights ?? [],
    createdAt: new Date().toISOString(),
  }
  plans.push(plan)
  res.status(201).json(plan)
})

router.put('/:id', (req: Request, res: Response) => {
  const index = plans.findIndex((p) => p.id === req.params.id)
  if (index === -1) {
    res.status(404).json({ success: false, error: 'Plan not found' })
    return
  }

  const updated: LightingPlan = {
    ...plans[index],
    name: req.body.name ?? plans[index].name,
    lights: req.body.lights ?? plans[index].lights,
  }
  plans[index] = updated
  res.json(updated)
})

router.delete('/:id', (req: Request, res: Response) => {
  const index = plans.findIndex((p) => p.id === req.params.id)
  if (index === -1) {
    res.status(404).json({ success: false, error: 'Plan not found' })
    return
  }

  plans.splice(index, 1)
  res.json({ success: true })
})

export default router

import { Router, Request, Response } from 'express'
import { projects, materials } from './projects'

const router = Router()

router.get('/:token', (req: Request, res: Response) => {
  const project = projects.find(p => p.publicToken === req.params.token)
  
  if (!project) {
    return res.status(404).json({ error: '项目不存在或链接已过期' })
  }
  
  const projectMaterials = materials
    .filter(m => m.projectId === project.id && m.name.trim() !== '')
    .map(m => ({
      id: m.id,
      name: m.name,
      quantity: m.quantity,
      unitPrice: m.unitPrice
    }))
  
  const totalCost = projectMaterials.reduce(
    (sum, m) => sum + m.quantity * m.unitPrice, 
    0
  )
  
  res.json({
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      stage: project.stage,
      progress: project.progress,
      images: project.images
    },
    materials: projectMaterials,
    totalCost
  })
})

export default router

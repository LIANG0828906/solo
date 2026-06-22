import { Router, Request, Response } from 'express'
import { materials, projects } from './projects'

const router = Router()

router.get('/:projectId', (req: Request, res: Response) => {
  const project = projects.find(p => p.id === req.params.projectId)
  if (!project) {
    return res.status(404).json({ error: '项目不存在' })
  }
  
  const projectMaterials = materials.filter(m => m.projectId === req.params.projectId)
  res.json(projectMaterials)
})

router.post('/:projectId', (req: Request, res: Response) => {
  const project = projects.find(p => p.id === req.params.projectId)
  if (!project) {
    return res.status(404).json({ error: '项目不存在' })
  }
  
  materials.push(req.body)
  res.status(201).json(req.body)
})

router.put('/:projectId/:materialId', (req: Request, res: Response) => {
  const index = materials.findIndex(
    m => m.id === req.params.materialId && m.projectId === req.params.projectId
  )
  
  if (index === -1) {
    return res.status(404).json({ error: '材料不存在' })
  }
  
  materials[index] = {
    ...materials[index],
    ...req.body,
    id: req.params.materialId,
    projectId: req.params.projectId
  }
  
  res.json(materials[index])
})

router.delete('/:projectId/:materialId', (req: Request, res: Response) => {
  const index = materials.findIndex(
    m => m.id === req.params.materialId && m.projectId === req.params.projectId
  )
  
  if (index === -1) {
    return res.status(404).json({ error: '材料不存在' })
  }
  
  const deleted = materials.splice(index, 1)[0]
  res.json(deleted)
})

export default router

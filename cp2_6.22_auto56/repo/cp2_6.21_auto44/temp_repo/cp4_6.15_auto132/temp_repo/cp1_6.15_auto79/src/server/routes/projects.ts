import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { Project, ProjectDetail } from '../types/index.js'
import {
  getAllProjects,
  saveProjects,
  getProjectDetail,
  saveProjectDetail,
  generateJoinCode,
} from '../utils/fileStore.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const projects = getAllProjects<Project>()
    res.status(200).json({
      success: true,
      data: projects,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get projects',
    })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, key, bpm, instruments, creatorId, creatorName } = req.body

    if (!name || !key || !bpm || !creatorId || !creatorName) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
      })
      return
    }

    const now = new Date().toISOString()
    const projectId = uuidv4()
    const joinCode = generateJoinCode()

    const newProject: Project = {
      id: projectId,
      name,
      key,
      bpm,
      instruments: instruments || [],
      joinCode,
      creatorId,
      creatorName,
      createdAt: now,
      updatedAt: now,
    }

    const projects = getAllProjects<Project>()
    projects.push(newProject)
    saveProjects(projects)

    const projectDetail: ProjectDetail = {
      ...newProject,
      notes: [],
    }
    saveProjectDetail(projectId, projectDetail)

    res.status(201).json({
      success: true,
      data: newProject,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create project',
    })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const projectDetail = getProjectDetail<ProjectDetail>(id)

    if (!projectDetail) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      })
      return
    }

    res.status(200).json({
      success: true,
      data: projectDetail,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get project',
    })
  }
})

router.post('/:id/join', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { joinCode } = req.body

    if (!joinCode) {
      res.status(400).json({
        success: false,
        error: 'Join code is required',
      })
      return
    }

    const project = getProjectDetail<ProjectDetail>(id)

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      })
      return
    }

    if (project.joinCode !== joinCode) {
      res.status(401).json({
        success: false,
        error: 'Invalid join code',
      })
      return
    }

    res.status(200).json({
      success: true,
      data: project,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to join project',
    })
  }
})

router.get('/:id/export', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const projectDetail = getProjectDetail<ProjectDetail>(id)

    if (!projectDetail) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      })
      return
    }

    const exportData = {
      project: {
        id: projectDetail.id,
        name: projectDetail.name,
        key: projectDetail.key,
        bpm: projectDetail.bpm,
        instruments: projectDetail.instruments,
        createdAt: projectDetail.createdAt,
        updatedAt: projectDetail.updatedAt,
      },
      notes: projectDetail.notes,
      exportedAt: new Date().toISOString(),
    }

    res.setHeader('Content-Type', 'application/json')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${projectDetail.name}_export.json"`,
    )
    res.status(200).json(exportData)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to export project',
    })
  }
})

export default router

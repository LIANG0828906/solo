import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { Version, ProjectDetail } from '../types/index.js'
import {
  getVersions,
  saveVersion,
  getProjectDetail,
  formatVersionName,
} from '../utils/fileStore.js'

const router = Router()

router.get('/:projectId/versions', async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params

    const project = getProjectDetail<ProjectDetail>(projectId)
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      })
      return
    }

    const versions = getVersions<Version>(projectId)
    res.status(200).json({
      success: true,
      data: versions,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get versions',
    })
  }
})

router.post('/:projectId/versions', async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params
    const { name, snapshot, creatorId, creatorName } = req.body

    if (!snapshot || !creatorId || !creatorName) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
      })
      return
    }

    const project = getProjectDetail<ProjectDetail>(projectId)
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      })
      return
    }

    const existingVersions = getVersions<Version>(projectId)
    const versionNum = existingVersions.length + 1
    const versionName = name || formatVersionName(project.name, versionNum)

    const newVersion: Version = {
      id: uuidv4(),
      projectId,
      name: versionName,
      snapshot,
      creatorId,
      creatorName,
      createdAt: new Date().toISOString(),
    }

    saveVersion(projectId, newVersion.id, newVersion)

    res.status(201).json({
      success: true,
      data: newVersion,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create version',
    })
  }
})

export default router

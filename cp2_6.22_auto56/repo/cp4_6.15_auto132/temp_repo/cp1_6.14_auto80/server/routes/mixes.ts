import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb, type DbMixConfig, type DbTrack, type BandMember } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

router.get('/band/:bandId', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb()
    const mix = db.data.mixConfigs.find((m: DbMixConfig) => m.bandId === req.params.bandId)
    if (!mix) {
      const newMix: DbMixConfig = {
        id: uuidv4(),
        bandId: req.params.bandId,
        tracks: [],
        globalVolume: 80,
        loopMode: 'list',
        createdAt: new Date().toISOString(),
      }
      db.data.mixConfigs.push(newMix)
      await db.write()
      res.json({ success: true, data: newMix })
      return
    }
    res.json({ success: true, data: mix })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取混音配置失败' })
  }
})

router.post('/band/:bandId', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId
    const db = await getDb()
    const band = db.data.bands.find((b) => b.id === req.params.bandId)
    if (!band) {
      res.status(404).json({ success: false, error: '乐队不存在' })
      return
    }
    if (!band.members.some((m: BandMember) => m.userId === userId)) {
      res.status(403).json({ success: false, error: '你不是该乐队成员' })
      return
    }
    const { tracks, globalVolume, loopMode } = req.body
    const existingIndex = db.data.mixConfigs.findIndex(
      (m: DbMixConfig) => m.bandId === req.params.bandId
    )
    if (existingIndex >= 0) {
      const mix = db.data.mixConfigs[existingIndex]
      if (tracks) mix.tracks = tracks
      if (globalVolume !== undefined) mix.globalVolume = globalVolume
      if (loopMode) mix.loopMode = loopMode
      await db.write()
      res.json({ success: true, data: mix })
    } else {
      const mix: DbMixConfig = {
        id: uuidv4(),
        bandId: req.params.bandId,
        tracks: tracks || [],
        globalVolume: globalVolume ?? 80,
        loopMode: loopMode || 'list',
        createdAt: new Date().toISOString(),
      }
      db.data.mixConfigs.push(mix)
      await db.write()
      res.json({ success: true, data: mix })
    }
  } catch (error) {
    res.status(500).json({ success: false, error: '保存混音配置失败' })
  }
})

router.post('/band/:bandId/export', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb()
    const band = db.data.bands.find((b) => b.id === req.params.bandId)
    if (!band) {
      res.status(404).json({ success: false, error: '乐队不存在' })
      return
    }
    const tracks = db.data.tracks.filter(
      (t: DbTrack) => t.bandId === req.params.bandId && !t.muted
    )
    const mix = db.data.mixConfigs.find((m: DbMixConfig) => m.bandId === req.params.bandId)
    res.json({
      success: true,
      data: {
        exportId: uuidv4(),
        trackCount: tracks.length,
        globalVolume: mix?.globalVolume ?? 80,
        loopMode: mix?.loopMode ?? 'list',
        tracks: tracks.map((t: DbTrack) => ({
          id: t.id,
          name: t.name,
          url: `/api/tracks/file/${t.fileName}`,
          volume: t.volume,
          pan: t.pan,
          effects: t.effects,
        })),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '导出失败' })
  }
})

export default router

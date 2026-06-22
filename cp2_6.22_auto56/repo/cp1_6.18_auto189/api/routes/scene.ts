import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const scenesDir = path.join(__dirname, '../../scenes')

if (!fs.existsSync(scenesDir)) {
  fs.mkdirSync(scenesDir, { recursive: true })
}

const router = Router()

router.post('/save', async (req: Request, res: Response): Promise<void> => {
  const uuid = uuidv4()
  const filepath = path.join(scenesDir, `${uuid}.json`)

  try {
    fs.writeFileSync(filepath, JSON.stringify(req.body, null, 2))
    res.json({ shareUrl: `/scene/${uuid}`, uuid })
  } catch (err) {
    res.status(500).json({ error: 'Failed to save scene' })
  }
})

router.get('/:uuid', async (req: Request, res: Response): Promise<void> => {
  const filepath = path.join(scenesDir, `${req.params.uuid}.json`)

  if (!fs.existsSync(filepath)) {
    res.status(404).json({ error: 'Scene not found' })
    return
  }

  try {
    const data = fs.readFileSync(filepath, 'utf-8')
    res.json(JSON.parse(data))
  } catch (err) {
    res.status(500).json({ error: 'Failed to read scene' })
  }
})

export default router

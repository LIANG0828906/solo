import { Router, type Response } from 'express'
import mongoose, { Types } from 'mongoose'
import GuqinModel from '../models/Guqin.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'

const router = Router()

interface InMemoryRecording {
  _id: string
  title: string
  notes: string
  qinming: string
  exportedImage: string
  createdAt: Date
}

interface InMemoryGuqin {
  _id: string
  userId: string
  name: string
  qinzhenMaterial: 'jade' | 'bone' | 'wood' | 'copper'
  stringType: 'taigu' | 'zhongqing' | 'xihe'
  lacquerColor: string
  stringTunings: number[]
  recordings: InMemoryRecording[]
  createdAt: Date
  updatedAt: Date
}

const inMemoryGuqins: InMemoryGuqin[] = []

const isValidObjectId = (id: string): boolean => {
  return Types.ObjectId.isValid(id)
}

const findGuqinsByUserId = async (userId: string) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const guqins = await GuqinModel.find({ userId: new Types.ObjectId(userId) })
      if (guqins) return guqins
    } catch (error) {
      console.log('MongoDB query failed, using in-memory storage')
    }
  }

  return inMemoryGuqins.filter((g) => g.userId === userId)
}

const findGuqinById = async (guqinId: string, userId: string) => {
  if (mongoose.connection.readyState === 1 && isValidObjectId(guqinId)) {
    try {
      const guqin = await GuqinModel.findOne({
        _id: new Types.ObjectId(guqinId),
        userId: new Types.ObjectId(userId),
      })
      if (guqin) return guqin
    } catch (error) {
      console.log('MongoDB query failed, using in-memory storage')
    }
  }

  return inMemoryGuqins.find((g) => g._id === guqinId && g.userId === userId)
}

const createGuqin = async (userId: string, data: Partial<InMemoryGuqin>) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const guqin = new GuqinModel({
        userId: new Types.ObjectId(userId),
        ...data,
      })
      await guqin.save()
      return guqin
    } catch (error) {
      console.log('MongoDB save failed, using in-memory storage')
    }
  }

  const newGuqin: InMemoryGuqin = {
    _id: new Types.ObjectId().toString(),
    userId,
    name: data.name || '未命名古琴',
    qinzhenMaterial: data.qinzhenMaterial || 'wood',
    stringType: data.stringType || 'zhongqing',
    lacquerColor: data.lacquerColor || '#4a2c1a',
    stringTunings: data.stringTunings || [0, 0, 0, 0, 0, 0, 0],
    recordings: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  inMemoryGuqins.push(newGuqin)
  return newGuqin
}

const updateGuqin = async (guqinId: string, userId: string, data: Partial<InMemoryGuqin>) => {
  if (mongoose.connection.readyState === 1 && isValidObjectId(guqinId)) {
    try {
      const guqin = await GuqinModel.findOneAndUpdate(
        {
          _id: new Types.ObjectId(guqinId),
          userId: new Types.ObjectId(userId),
        },
        { ...data, updatedAt: new Date() },
        { new: true }
      )
      if (guqin) return guqin
    } catch (error) {
      console.log('MongoDB update failed, using in-memory storage')
    }
  }

  const index = inMemoryGuqins.findIndex((g) => g._id === guqinId && g.userId === userId)
  if (index !== -1) {
    inMemoryGuqins[index] = {
      ...inMemoryGuqins[index],
      ...data,
      updatedAt: new Date(),
    }
    return inMemoryGuqins[index]
  }
  return null
}

const deleteGuqin = async (guqinId: string, userId: string) => {
  if (mongoose.connection.readyState === 1 && isValidObjectId(guqinId)) {
    try {
      const result = await GuqinModel.findOneAndDelete({
        _id: new Types.ObjectId(guqinId),
        userId: new Types.ObjectId(userId),
      })
      if (result) return true
    } catch (error) {
      console.log('MongoDB delete failed, using in-memory storage')
    }
  }

  const index = inMemoryGuqins.findIndex((g) => g._id === guqinId && g.userId === userId)
  if (index !== -1) {
    inMemoryGuqins.splice(index, 1)
    return true
  }
  return false
}

const addRecording = async (guqinId: string, userId: string, recordingData: {
  title: string
  notes?: string
  qinming?: string
  exportedImage?: string
}) => {
  if (mongoose.connection.readyState === 1 && isValidObjectId(guqinId)) {
    try {
      const guqin = await GuqinModel.findOne({
        _id: new Types.ObjectId(guqinId),
        userId: new Types.ObjectId(userId),
      })
      if (guqin) {
        guqin.recordings.push({
          title: recordingData.title,
          notes: recordingData.notes || '',
          qinming: recordingData.qinming || '',
          exportedImage: recordingData.exportedImage || '',
          _id: new Types.ObjectId(),
          createdAt: new Date(),
        } as any)
        guqin.updatedAt = new Date()
        await guqin.save()
        return guqin
      }
    } catch (error) {
      console.log('MongoDB add recording failed, using in-memory storage')
    }
  }

  const guqin = inMemoryGuqins.find((g) => g._id === guqinId && g.userId === userId)
  if (guqin) {
    const newRecording: InMemoryRecording = {
      _id: new Types.ObjectId().toString(),
      title: recordingData.title,
      notes: recordingData.notes || '',
      qinming: recordingData.qinming || '',
      exportedImage: recordingData.exportedImage || '',
      createdAt: new Date(),
    }
    guqin.recordings.push(newRecording)
    guqin.updatedAt = new Date()
    return guqin
  }
  return null
}

router.use(authMiddleware)

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!
    const guqins = await findGuqinsByUserId(userId)

    res.status(200).json({
      success: true,
      data: guqins,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch guqins',
    })
  }
})

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!
    const guqinId = req.params.id

    const guqin = await findGuqinById(guqinId, userId)

    if (!guqin) {
      res.status(404).json({
        success: false,
        error: 'Guqin not found',
      })
      return
    }

    res.status(200).json({
      success: true,
      data: guqin,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch guqin',
    })
  }
})

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!
    const { name, qinzhenMaterial, stringType, lacquerColor, stringTunings } = req.body

    if (!name) {
      res.status(400).json({
        success: false,
        error: 'Name is required',
      })
      return
    }

    if (stringTunings && (!Array.isArray(stringTunings) || stringTunings.length !== 7)) {
      res.status(400).json({
        success: false,
        error: 'stringTunings must be an array of 7 numbers',
      })
      return
    }

    const guqin = await createGuqin(userId, {
      name,
      qinzhenMaterial,
      stringType,
      lacquerColor,
      stringTunings,
    })

    res.status(201).json({
      success: true,
      data: guqin,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create guqin',
    })
  }
})

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!
    const guqinId = req.params.id
    const { name, qinzhenMaterial, stringType, lacquerColor, stringTunings } = req.body

    if (stringTunings && (!Array.isArray(stringTunings) || stringTunings.length !== 7)) {
      res.status(400).json({
        success: false,
        error: 'stringTunings must be an array of 7 numbers',
      })
      return
    }

    const guqin = await updateGuqin(guqinId, userId, {
      name,
      qinzhenMaterial,
      stringType,
      lacquerColor,
      stringTunings,
    })

    if (!guqin) {
      res.status(404).json({
        success: false,
        error: 'Guqin not found',
      })
      return
    }

    res.status(200).json({
      success: true,
      data: guqin,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update guqin',
    })
  }
})

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!
    const guqinId = req.params.id

    const deleted = await deleteGuqin(guqinId, userId)

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Guqin not found',
      })
      return
    }

    res.status(200).json({
      success: true,
      message: 'Guqin deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete guqin',
    })
  }
})

router.post('/:id/recordings', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!
    const guqinId = req.params.id
    const { title, notes, qinming, exportedImage } = req.body

    if (!title) {
      res.status(400).json({
        success: false,
        error: 'Recording title is required',
      })
      return
    }

    const guqin = await addRecording(guqinId, userId, {
      title,
      notes,
      qinming,
      exportedImage,
    })

    if (!guqin) {
      res.status(404).json({
        success: false,
        error: 'Guqin not found',
      })
      return
    }

    res.status(201).json({
      success: true,
      data: guqin,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to add recording',
    })
  }
})

export default router

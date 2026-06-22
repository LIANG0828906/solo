import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadsDir = path.join(__dirname, '..', '..', 'uploads')

export const processImage = async (
  buffer: Buffer,
  originalName: string,
  size: number = 300
): Promise<string> => {
  const ext = path.extname(originalName) || '.jpg'
  const fileName = `${uuidv4()}${ext}`
  const filePath = path.join(uploadsDir, fileName)

  await sharp(buffer)
    .resize(size, size, {
      fit: 'cover',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 80 })
    .toFile(filePath)

  return `/uploads/${fileName}`
}

export const processImages = async (
  files: Express.Multer.File[]
): Promise<string[]> => {
  const results: string[] = []
  for (const file of files) {
    const imagePath = await processImage(file.buffer, file.originalname, 600)
    results.push(imagePath)
  }
  return results
}

export const deleteImage = (imagePath: string): void => {
  const fullPath = path.join(__dirname, '..', '..', imagePath)
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath)
  }
}

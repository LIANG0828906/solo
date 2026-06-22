export function validateImage(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: '仅支持 JPG/PNG 格式的图片'
    }
  }

  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    return {
      valid: false,
      error: '图片大小不能超过 5MB'
    }
  }

  return { valid: true }
}

export async function processImage(file: File): Promise<{ thumbnail: string; original: File }> {
  return new Promise((resolve, reject) => {
    const startTime = performance.now()

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('无法创建 Canvas 上下文'))
          return
        }

        const size = 120
        canvas.width = size
        canvas.height = size

        const scale = Math.max(size / img.width, size / img.height)
        const x = (size - img.width * scale) / 2
        const y = (size - img.height * scale) / 2

        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, size, size)
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale)

        const thumbnail = canvas.toDataURL('image/jpeg', 0.85)

        const elapsed = performance.now() - startTime
        if (elapsed > 200) {
          console.warn(`缩略图生成耗时 ${elapsed.toFixed(0)}ms，超过 200ms 限制`)
        }

        resolve({
          thumbnail,
          original: file
        })
      }
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

import { useState, useRef, useCallback } from 'react'
import * as opentype from 'opentype.js'
import type { FontData, FontWeight } from '../App'

interface UploadPanelProps {
  onFontUpload: (font: FontData) => void
}

const weightNames: Record<number, string> = {
  100: 'Thin',
  200: 'Extra Light',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'Semi Bold',
  700: 'Bold',
  800: 'Extra Bold',
  900: 'Black'
}

function getWeightName(weight: number): string {
  if (weightNames[weight]) return weightNames[weight]
  const weights = Object.keys(weightNames).map(Number).sort((a, b) => a - b)
  let closest = weights[0]
  for (const w of weights) {
    if (Math.abs(w - weight) < Math.abs(closest - weight)) {
      closest = w
    }
  }
  return weightNames[closest]
}

export default function UploadPanel({ onFontUpload }: UploadPanelProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseFontFile = useCallback(async (file: File) => {
    return new Promise<FontData>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer
          const font = opentype.parse(buffer)
          
          const fontUrl = URL.createObjectURL(file)
          const weight = font.tables.os2?.usWeightClass || 400
          const style = (font.tables.os2?.fsSelection ?? 0) & 1 ? 'italic' : 'normal'
          
          const fontWeight: FontWeight = {
            name: getWeightName(weight),
            weight,
            style,
            fontUrl
          }

          const fontFamily = font.names.fullName?.en || font.names.fontFamily?.en || 'Unknown Font'

          resolve({
            id: `font-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: fontFamily,
            weights: [fontWeight],
            file
          })
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(file)
    })
  }, [])

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.name.match(/\.(ttf|woff|woff2|otf)$/i)) {
        alert(`不支持的文件格式: ${file.name}`)
        continue
      }

      try {
        const fontData = await parseFontFile(file)
        onFontUpload(fontData)
      } catch (err) {
        console.error('字体解析失败:', err)
        alert(`字体解析失败: ${file.name}`)
      }
    }
  }, [parseFontFile, onFontUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    e.target.value = ''
  }, [handleFiles])

  return (
    <div
      className={`upload-panel ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <i className="fas fa-cloud-upload-alt"></i>
      <h3>拖拽字体文件到此处</h3>
      <p>或点击选择文件 · 支持 TTF / WOFF / WOFF2 / OTF 格式</p>
      <input
        ref={fileInputRef}
        type="file"
        accept=".ttf,.woff,.woff2,.otf"
        multiple
        onChange={handleFileChange}
      />
    </div>
  )
}

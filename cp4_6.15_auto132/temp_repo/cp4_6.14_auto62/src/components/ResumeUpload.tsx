import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResumeUploadProps {
  onUploadComplete?: (data: { fileName: string }) => void
  onProgress?: (percent: number) => void
  uploading?: boolean
  progress?: number
}

const MAX_SIZE = 5 * 1024 * 1024
const ACCEPTED_EXTENSIONS = ['.pdf', '.doc', '.docx']

export default function ResumeUpload({
  onUploadComplete,
  onProgress,
  uploading: externalUploading,
  progress: externalProgress,
}: ResumeUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const [internalIsUploading, setInternalIsUploading] = useState(false)
  const [internalProgress, setInternalProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isUploading = externalUploading ?? internalIsUploading
  const uploadProgress = externalProgress ?? internalProgress

  const validateFile = (file: File): boolean => {
    const fileName = file.name.toLowerCase()
    const hasValidExtension = ACCEPTED_EXTENSIONS.some((ext) => fileName.endsWith(ext))
    if (!hasValidExtension) {
      alert('仅支持 PDF、Word 文件格式')
      return false
    }
    if (file.size > MAX_SIZE) {
      alert('文件大小不能超过 5MB')
      return false
    }
    return true
  }

  const startUpload = (file: File) => {
    if (externalUploading !== undefined) {
      return
    }
    setCurrentFile(file)
    setInternalIsUploading(true)
    setInternalProgress(0)
    onProgress?.(0)

    let current = 0
    intervalRef.current = setInterval(() => {
      current += 1
      if (current >= 100) {
        current = 100
        setInternalProgress(100)
        onProgress?.(100)
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        setTimeout(() => {
          setInternalIsUploading(false)
          onUploadComplete?.({ fileName: file.name })
        }, 100)
      } else {
        setInternalProgress(current)
        onProgress?.(current)
      }
    }, 20)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && validateFile(file)) {
      startUpload(file)
    }
  }

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleClick = () => {
    if (!isUploading) {
      inputRef.current?.click()
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validateFile(file)) {
      startUpload(file)
    }
    e.target.value = ''
  }

  return (
    <div className="w-full">
      <div
        className={cn(
          'border-2 border-dashed border-blue-300 rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
          dragOver && 'border-solid bg-blue-50',
          isUploading && 'pointer-events-none'
        )}
        style={dragOver ? { borderColor: '#3b82f6' } : undefined}
        onDrop={handleDrop}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={handleFileChange}
        />
        <Upload className="mx-auto h-12 w-12 text-blue-400 mb-3" />
        <p className="text-gray-700 font-medium mb-1">拖拽PDF/Word文件到此处上传</p>
        <p className="text-gray-400 text-sm">支持PDF、Word文件，最大5MB</p>
      </div>

      {isUploading && (
        <div className="mt-4">
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] rounded-full transition-all duration-[2000ms] ease-linear"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
            {currentFile?.name ?? '上传中'} {uploadProgress}%
          </p>
        </div>
      )}
    </div>
  )
}

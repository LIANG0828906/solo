import React, { useState, useCallback, useRef } from 'react'
import { Upload, FileText, X, CheckCircle2 } from 'lucide-react'
import { useAppStore } from './store'
import type { ParsedFile } from './types'

const ALLOWED_EXTENSIONS = ['.txt', '.js', '.ts', '.py', '.html', '.css']
const MAX_FILE_SIZE = 5 * 1024 * 1024

interface FileUploaderProps {
  type: 'old' | 'new'
  label: string
}

export const FileUploader: React.FC<FileUploaderProps> = ({ type, label }) => {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    setOldFile,
    setNewFile,
    setDiffResult,
    setStatsResult,
    setUploadProgress,
    setIsUploading,
    setIsCalculating,
    setError,
    oldFile,
    newFile,
    ignoreWhitespace,
    contextLines
  } = useAppStore()

  const currentFile = type === 'old' ? oldFile : newFile
  const setFile = type === 'old' ? setOldFile : setNewFile

  const validateFile = (file: File): string | null => {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `不支持的文件格式。支持的格式: ${ALLOWED_EXTENSIONS.join(', ')}`
    }
    if (file.size > MAX_FILE_SIZE) {
      return '文件大小不能超过 5MB'
    }
    return null
  }

  const uploadFile = useCallback(async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    const interval = setInterval(() => {
      setUploadProgress((prev: number) => {
        if (prev >= 90) {
          clearInterval(interval)
          return prev
        }
        return prev + 10
      })
    }, 50)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/parse', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '上传失败')
      }

      const parsedFile: ParsedFile = await response.json()
      setFile(parsedFile)
      setUploadProgress(100)

      setTimeout(() => {
        setUploadProgress(0)
        setIsUploading(false)
      }, 300)

      const otherFile = type === 'old' ? newFile : oldFile
      if (otherFile) {
        setIsCalculating(true)
        const [diffRes, statsRes] = await Promise.all([
          fetch('/api/diff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              oldContent: type === 'old' ? parsedFile.content : otherFile.content,
              newContent: type === 'new' ? parsedFile.content : otherFile.content,
              ignoreWhitespace,
              contextLines
            })
          }),
          fetch('/api/stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              oldContent: type === 'old' ? parsedFile.content : otherFile.content,
              newContent: type === 'new' ? parsedFile.content : otherFile.content,
              ignoreWhitespace
            })
          })
        ])

        if (diffRes.ok && statsRes.ok) {
          const diffData = await diffRes.json()
          const statsData = await statsRes.json()
          setDiffResult(diffData)
          setStatsResult(statsData)
        }
        setIsCalculating(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败')
      setIsUploading(false)
      setUploadProgress(0)
    } finally {
      clearInterval(interval)
    }
  }, [type, oldFile, newFile, ignoreWhitespace, contextLines, setFile, setDiffResult, setStatsResult, setUploadProgress, setIsUploading, setIsCalculating, setError])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      uploadFile(files[0])
    }
  }, [uploadFile])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      uploadFile(files[0])
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [uploadFile])

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFile(null)
    setDiffResult(null)
    setStatsResult(null)
  }

  return (
    <div className="flex-1">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {currentFile && <CheckCircle2 size={16} className="text-green-500" />}
      </div>

      <div
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
          transition-all duration-300 min-h-[140px] flex flex-col items-center justify-center
          ${isDragging 
            ? 'border-[#6C63FF] bg-[#EEF2FF]' 
            : 'border-gray-300 bg-white hover:border-[#6C63FF] hover:bg-gray-50'
          }
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_EXTENSIONS.join(',')}
          onChange={handleFileChange}
          className="hidden"
        />

        {currentFile ? (
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#EEF2FF] rounded-lg">
                  <FileText size={24} className="text-[#6C63FF]" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-800 truncate max-w-[180px]">
                    {currentFile.fileName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {currentFile.lineCount} 行
                  </div>
                </div>
              </div>
              <button
                onClick={handleRemove}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <Upload size={36} className="text-gray-400 mb-3" />
            <div className="text-gray-600 font-medium mb-1">
              拖拽文件到此处，或点击上传
            </div>
            <div className="text-xs text-gray-400">
              支持 {ALLOWED_EXTENSIONS.join(', ')} 格式，最大 5MB
            </div>
          </>
        )}

        {useAppStore.getState().isUploading && (
          <div className="absolute bottom-0 left-0 right-0 h-[6px] bg-gray-100 rounded-b-xl overflow-hidden">
            <div
              className="progress-bar h-full bg-[#6C63FF] transition-all duration-200 rounded-r-xl"
              style={{ width: `${useAppStore.getState().uploadProgress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

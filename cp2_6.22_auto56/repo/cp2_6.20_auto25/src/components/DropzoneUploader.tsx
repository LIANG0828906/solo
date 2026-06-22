import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, AlertCircle } from 'lucide-react'

const ACCEPT = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'video/mp4': ['.mp4'],
}

const MAX_SIZE = 50 * 1024 * 1024

interface DropzoneUploaderProps {
  onFilesAccepted: (files: File[]) => void
  disabled?: boolean
}

export default function DropzoneUploader({ onFilesAccepted, disabled = false }: DropzoneUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesAccepted(acceptedFiles)
    },
    [onFilesAccepted],
  )

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxSize: MAX_SIZE,
    disabled,
    multiple: true,
  })

  const hasRejection = fileRejections.length > 0

  return (
    <div
      {...getRootProps()}
      className={`
        relative border-2 border-dashed rounded-card p-8
        flex flex-col items-center justify-center gap-3
        cursor-pointer transition-colors duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${isDragActive
          ? 'border-indigo bg-surface-lighter/50'
          : hasRejection
            ? 'border-red-500/70 bg-surface-light'
            : 'border-surface-border bg-surface-light'
        }
      `}
    >
      <div
        className={`
          absolute inset-0 rounded-card pointer-events-none
          border-2 border-dashed animate-breathe
          ${isDragActive
            ? 'border-indigo'
            : hasRejection
              ? 'border-red-500/50'
              : 'border-surface-border'
          }
        `}
      />

      <input {...getInputProps()} />

      <Upload
        className={`w-10 h-10 ${
          isDragActive ? 'text-indigo' : hasRejection ? 'text-red-400' : 'text-white/50'
        }`}
      />

      <p className={`text-sm font-medium ${isDragActive ? 'text-indigo-light' : 'text-white/80'}`}>
        拖拽文件到此处
      </p>

      <p className={`text-xs ${isDragActive ? 'text-indigo-light/70' : 'text-white/50'}`}>
        或点击选择文件
      </p>

      <p className="text-xs text-white/30">支持 JPG/PNG/MP4，最大 50MB</p>

      {hasRejection && (
        <div className="flex items-center gap-1.5 mt-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <p className="text-xs text-red-400">
            {fileRejections[0].errors[0]?.code === 'file-too-large'
              ? '文件大小超过 50MB 限制'
              : '不支持的文件格式，仅支持 JPG/PNG/MP4'}
          </p>
        </div>
      )}
    </div>
  )
}

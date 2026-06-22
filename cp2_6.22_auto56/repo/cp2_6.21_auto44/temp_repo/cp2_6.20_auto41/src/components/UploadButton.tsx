import { useRef } from 'react'
import { Upload, Play, Pause } from 'lucide-react'
import { useAudioState } from '@/store/useStore'
import { cn } from '@/lib/utils'

interface UploadButtonProps {
  onFileSelect: (file: File) => void
  onTogglePlay: () => void
  isLoading: boolean
  isPlaying: boolean
}

export default function UploadButton({
  onFileSelect,
  onTogglePlay,
  isLoading,
  isPlaying,
}: UploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioState = useAudioState()
  const hasFile = audioState.currentFileName !== ''

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }

  const handleButtonClick = () => {
    if (hasFile && !isLoading) {
      onTogglePlay()
    }
  }

  return (
    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
      <div className="glass-panel p-8 flex flex-col items-center gap-6 fade-in">
        <button
          onClick={handleButtonClick}
          className={cn(
            'upload-btn glass-panel w-28 h-28 flex items-center justify-center',
            'transition-all duration-300 hover:scale-105 hover:shadow-lg',
            'focus:outline-none focus:ring-2 focus:ring-blue-400',
            hasFile && !isLoading && 'cursor-pointer'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav,.ogg"
            onChange={handleFileChange}
            disabled={isLoading || hasFile}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          {isLoading ? (
            <div className="loading-spinner" />
          ) : hasFile ? (
            <div
              className={cn(
                'play-pause-icon transition-all duration-300',
                isPlaying ? 'playing' : 'paused'
              )}
            >
              {isPlaying ? (
                <Pause className="w-12 h-12 text-blue-400" strokeWidth={2} />
              ) : (
                <Play className="w-12 h-12 text-blue-400 ml-1" strokeWidth={2} />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-10 h-10 text-blue-400" strokeWidth={1.5} />
              <span className="text-xs text-gray-400">上传音频</span>
            </div>
          )}
        </button>

        {hasFile && !isLoading && (
          <div className="flex items-center gap-2">
            <div className="playing-indicator" />
            <span className="text-sm text-gray-300 max-w-[200px] truncate">
              {audioState.currentFileName}
            </span>
          </div>
        )}

        {!hasFile && !isLoading && (
          <p className="text-sm text-gray-400 text-center">
            支持 MP3、WAV、OGG 格式
          </p>
        )}
      </div>
    </div>
  )
}

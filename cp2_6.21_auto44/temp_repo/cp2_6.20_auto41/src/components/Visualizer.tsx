import { useEffect, useRef, useCallback } from 'react'
import { AudioAnalyzer } from '@/AudioAnalyzer'
import { useVisualizerStore, useAudioState, useControlParams, useAudioAnalysis } from '@/store/useStore'
import { Visualizer3D } from '@/components/Visualizer3D'
import UploadButton from '@/components/UploadButton'
import PresetSelector from '@/components/PresetSelector'
import FPSIndicator from '@/components/FPSIndicator'
import ControlPanel from '@/components/ControlPanel'

export default function Visualizer() {
  const audioAnalyzerRef = useRef<AudioAnalyzer | null>(null)
  const audioState = useAudioState()
  const controlParams = useControlParams()
  const audioAnalysis = useAudioAnalysis()
  const { setAudioAnalysis, setAudioState } =
    useVisualizerStore()

  useEffect(() => {
    audioAnalyzerRef.current = new AudioAnalyzer()

    audioAnalyzerRef.current.setOnAnalysisCallback((result) => {
      setAudioAnalysis(result)
    })

    audioAnalyzerRef.current.setOnStateChangeCallback((state) => {
      setAudioState(state)
    })

    return () => {
      audioAnalyzerRef.current?.destroy()
    }
  }, [setAudioAnalysis, setAudioState])

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!audioAnalyzerRef.current) return

      try {
        setAudioState({ isLoading: true, currentFileName: file.name })
        await audioAnalyzerRef.current.loadAudio(file)
        setAudioState({
          isLoading: false,
          currentFileName: file.name,
          duration: audioAnalyzerRef.current.getIsPlaying() ? 0 : 0,
        })
        audioAnalyzerRef.current.play()
      } catch (error) {
        console.error('音频加载失败:', error)
        setAudioState({ isLoading: false, currentFileName: '' })
        alert(error instanceof Error ? error.message : '音频加载失败，请重试')
      }
    },
    [setAudioState]
  )

  const handleTogglePlay = useCallback(() => {
    audioAnalyzerRef.current?.togglePlay()
  }, [])

  useEffect(() => {
    return () => {
      audioAnalyzerRef.current?.destroy()
    }
  }, [])

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="canvas-container">
        <Visualizer3D />
      </div>

      <div className="ui-overlay top-4 left-4">
        {audioState.currentFileName && (
          <div className="glass-panel px-4 py-3 fade-in">
            <div className="flex items-center gap-2">
              <div className="playing-indicator" />
              <span className="text-xs text-white/80 truncate max-w-[200px]">
                {audioState.currentFileName}
              </span>
            </div>
            {audioAnalysis && audioAnalysis.estimatedBPM && audioAnalysis.estimatedBPM > 0 && (
              <div className="mt-1 text-xs text-cyan-400 font-medium">
                BPM: {Math.round(audioAnalysis.estimatedBPM)}
              </div>
            )}
          </div>
        )}
      </div>

      <FPSIndicator />

      {!audioState.currentFileName || audioState.isLoading ? (
        <UploadButton
          onFileSelect={handleFileSelect}
          onTogglePlay={handleTogglePlay}
          isLoading={audioState.isLoading}
          isPlaying={audioState.isPlaying}
        />
      ) : (
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <button
            onClick={handleTogglePlay}
            className="glass-panel w-20 h-20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300"
          >
            {audioState.isPlaying ? (
              <svg
                className="w-10 h-10 text-blue-400 play-pause-icon playing"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg
                className="w-10 h-10 text-blue-400 play-pause-icon paused ml-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>
      )}

      {audioState.currentFileName && !audioState.isLoading && <PresetSelector />}

      <ControlPanel />

      <div className="ui-overlay bottom-4 left-4">
        {controlParams.performanceMode && (
          <div className="glass-panel px-3 py-1.5 fade-in">
            <span className="text-xs text-yellow-400">性能模式已开启</span>
          </div>
        )}
      </div>
    </div>
  )
}

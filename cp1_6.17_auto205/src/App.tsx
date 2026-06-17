import React, { useEffect, useState } from 'react'
import { RecordPage } from './ui/RecordPage'
import { VisualizePage } from './ui/VisualizePage'
import { useAppStore } from './store/useStore'
import { PitchAnalyzer } from './audio/PitchAnalyzer'

const App: React.FC = () => {
  const { appState, setAppState, setPitchData, setRecordingId, reset } = useAppStore()
  const [isLoading, setIsLoading] = useState(false)
  const analyzer = new PitchAnalyzer()

  useEffect(() => {
    const path = window.location.pathname
    if (path.startsWith('/share/')) {
      const id = path.replace('/share/', '')
      loadSharedRecording(id)
    }
  }, [])

  const loadSharedRecording = async (id: string) => {
    setIsLoading(true)
    try {
      const result = await analyzer.getRecording(id)
      if (result) {
        setPitchData({
          pitchSequence: result.pitchSequence,
          volumeSequence: result.volumeSequence
        })
        setRecordingId(result.recordingId)
        setAppState('visualizing')
      } else {
        setAppState('record')
      }
    } catch (error) {
      console.error('Failed to load shared recording:', error)
      setAppState('record')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRecordingComplete = async (audioData: number[], sampleRate: number) => {
    setIsLoading(true)
    try {
      const result = await analyzer.analyze(audioData, sampleRate)
      setPitchData({
        pitchSequence: result.pitchSequence,
        volumeSequence: result.volumeSequence
      })
      setRecordingId(result.recordingId)
      setAppState('visualizing')
    } catch (error) {
      console.error('Analysis failed:', error)
      alert('音高分析失败，请重试')
      setAppState('record')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReRecord = () => {
    reset()
    window.history.pushState({}, '', '/')
  }

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner} />
        <div style={styles.loadingText}>处理中...</div>
      </div>
    )
  }

  return (
    <div style={styles.app}>
      {appState === 'record' && (
        <RecordPage onRecordingComplete={handleRecordingComplete} />
      )}
      {appState === 'visualizing' && (
        <VisualizePage onReRecord={handleReRecord} />
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    width: '100vw',
    height: '100vh',
    overflow: 'hidden'
  },
  loadingContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#121212'
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    border: '3px solid #3A3A4A',
    borderTop: '3px solid #BB86FC',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    marginTop: 16,
    color: '#888',
    fontSize: 14
  }
}

export default App

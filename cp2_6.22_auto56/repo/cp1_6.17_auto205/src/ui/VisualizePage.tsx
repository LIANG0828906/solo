import React, { useEffect, useRef, useState } from 'react'
import { SceneRenderer } from '../scene/SceneRenderer'
import { ControlPanel } from './ControlPanel'
import { useAppStore } from '../store/useStore'
import { PitchAnalyzer } from '../audio/PitchAnalyzer'

interface VisualizePageProps {
  onReRecord: () => void
}

export const VisualizePage: React.FC<VisualizePageProps> = ({ onReRecord }) => {
  const { pitchData, particlesEnabled, trailsEnabled, recordingId } = useAppStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<SceneRenderer | null>(null)
  const [shareCopied, setShareCopied] = useState(false)
  const analyzerRef = useRef(new PitchAnalyzer())

  useEffect(() => {
    if (!containerRef.current) return

    const renderer = new SceneRenderer(containerRef.current)
    rendererRef.current = renderer

    if (pitchData) {
      renderer.setPitchData(pitchData)
    }

    return () => {
      renderer.destroy()
    }
  }, [])

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setParticlesEnabled(particlesEnabled)
    }
  }, [particlesEnabled])

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setTrailsEnabled(trailsEnabled)
    }
  }, [trailsEnabled])

  useEffect(() => {
    if (rendererRef.current && pitchData) {
      rendererRef.current.setPitchData(pitchData)
    }
  }, [pitchData])

  const handleShare = async () => {
    if (!recordingId) return

    try {
      const shareUrl = await analyzerRef.current.getShareUrl(recordingId)
      
      if (shareUrl) {
        navigator.clipboard.writeText(shareUrl)
      } else {
        const fallbackUrl = `${window.location.origin}/share/${recordingId}`
        navigator.clipboard.writeText(fallbackUrl)
      }
      
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    } catch (error) {
      console.error('Share error:', error)
      const fallbackUrl = `${window.location.origin}/share/${recordingId}`
      navigator.clipboard.writeText(fallbackUrl)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.sceneContainer} ref={containerRef} />
      <div style={styles.controlContainer}>
        <ControlPanel
          onShare={handleShare}
          onReRecord={onReRecord}
          shareCopied={shareCopied}
        />
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    background: '#121212'
  },
  sceneContainer: {
    flex: 1,
    width: '70%',
    height: '100%',
    position: 'relative'
  },
  controlContainer: {
    width: 320,
    padding: '20px 20px 20px 0',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    boxSizing: 'border-box'
  }
}

export default VisualizePage

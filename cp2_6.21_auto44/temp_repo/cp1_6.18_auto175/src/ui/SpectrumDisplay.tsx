import { useEffect, useRef } from 'react'

interface Props {
  trackId?: string
  width?: number
  height?: number
  onAttach?: (canvas: HTMLCanvasElement, trackId?: string) => void
  onDetach?: (trackId?: string) => void
}

export default function SpectrumDisplay({ trackId, width, height, onAttach, onDetach }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (c && onAttach) onAttach(c, trackId)
    return () => { if (onDetach) onDetach(trackId) }
  }, [trackId, onAttach, onDetach])

  return (
    <canvas
      ref={ref}
      className={trackId ? 'mini-spectrum' : 'spectrum-display'}
      style={{ width, height, display: 'block' }}
    />
  )
}

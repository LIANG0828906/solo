import { useEffect, useRef, useState } from 'react'
import { FieldScene } from './FieldScene'
import { ControlPanel } from './ControlPanel'
import { defaultParams, type FieldType, type FieldParams } from './ForceField'

function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<FieldScene | null>(null)
  const [fieldType, setFieldType] = useState<FieldType>('gravity')
  const [fieldParams, setFieldParams] = useState<FieldParams>({ ...defaultParams })
  const [fps, setFps] = useState(60)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    const scene = new FieldScene(containerRef.current)
    sceneRef.current = scene
    scene.setFPSCallback(setFps)
    scene.startAnimation()

    return () => {
      scene.dispose()
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.updateField(fieldType, fieldParams)
    }
  }, [fieldType, fieldParams])

  const handleResetCamera = () => {
    sceneRef.current?.resetCamera()
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
        overflow: 'hidden'
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
      />

      <ControlPanel
        fieldType={fieldType}
        fieldParams={fieldParams}
        onFieldTypeChange={setFieldType}
        onParamsChange={setFieldParams}
        onResetCamera={handleResetCamera}
        fps={fps}
        isMobile={isMobile}
      />

      <div
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.5)',
          textAlign: 'right',
          zIndex: 50,
          pointerEvents: 'none'
        }}
      >
        <div>拖拽旋转视角</div>
        <div>滚轮缩放</div>
        <div>点击生成粒子</div>
      </div>
    </div>
  )
}

export default App

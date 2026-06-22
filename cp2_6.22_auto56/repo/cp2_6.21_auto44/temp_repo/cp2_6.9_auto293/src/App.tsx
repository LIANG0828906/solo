import { useState, useCallback, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { saveAs } from 'file-saver'
import { v4 as uuidv4 } from 'uuid'
import { CastingScene } from './scene/CastingScene'
import { UIOverlay } from './components/UIOverlay'
import {
  CopperAlloy,
  PolishTool,
  ProcessStep,
  copperAlloys,
  polishTools
} from './utils/materials'

function App() {
  const [currentStep, setCurrentStep] = useState<ProcessStep>('select')
  const [selectedAlloy, setSelectedAlloy] = useState<CopperAlloy | null>(null)
  const [isSmelting, setIsSmelting] = useState(false)
  const [smeltProgress, setSmeltProgress] = useState(0)
  const [isCasting, setIsCasting] = useState(false)
  const [coolingProgress, setCoolingProgress] = useState(0)
  const [moldOpen, setMoldOpen] = useState(false)
  const [mirrorReflectivity, setMirrorReflectivity] = useState(0.1)
  const [mirrorRoughness, setMirrorRoughness] = useState(0.8)
  const [isRotating, setIsRotating] = useState(false)
  const [currentTool, setCurrentTool] = useState<PolishTool | null>(null)
  const [polishStage, setPolishStage] = useState<'coarse' | 'fine' | 'polish' | null>(null)
  const [reflectionImage, setReflectionImage] = useState<string | null>(null)
  const [showReflection, setShowReflection] = useState(false)

  const smeltIntervalRef = useRef<number | null>(null)
  const coolIntervalRef = useRef<number | null>(null)
  const polishCountRef = useRef(0)

  const resetSmelting = useCallback(() => {
    if (smeltIntervalRef.current) {
      clearInterval(smeltIntervalRef.current)
      smeltIntervalRef.current = null
    }
  }, [])

  const resetCooling = useCallback(() => {
    if (coolIntervalRef.current) {
      clearInterval(coolIntervalRef.current)
      coolIntervalRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      resetSmelting()
      resetCooling()
    }
  }, [resetSmelting, resetCooling])

  const handleAlloySelect = useCallback((alloy: CopperAlloy) => {
    if (currentStep !== 'select') return
    setSelectedAlloy(alloy)
  }, [currentStep])

  const handleIngotDropped = useCallback(() => {
    if (currentStep !== 'select' || !selectedAlloy || isSmelting) return

    setCurrentStep('smelt')
    setIsSmelting(true)
    setSmeltProgress(0)

    const duration = 15000
    const interval = 100
    const increment = interval / duration

    smeltIntervalRef.current = window.setInterval(() => {
      setSmeltProgress(prev => {
        const next = Math.min(prev + increment, 1)
        if (next >= 1) {
          resetSmelting()
        }
        return next
      })
    }, interval)
  }, [currentStep, selectedAlloy, isSmelting, resetSmelting])

  const handleSmeltComplete = useCallback(() => {
    setIsSmelting(false)
  }, [])

  const handleCastClick = useCallback(() => {
    if (currentStep !== 'smelt' || smeltProgress < 1) return

    setCurrentStep('cast')
    setIsCasting(true)
    setCoolingProgress(0)

    setTimeout(() => {
      setCurrentStep('cool')
      const duration = 30000
      const interval = 100
      const increment = interval / duration

      coolIntervalRef.current = window.setInterval(() => {
        setCoolingProgress(prev => {
          const next = Math.min(prev + increment, 1)
          if (next >= 1) {
            resetCooling()
          }
          return next
        })
      }, interval)
    }, 2000)
  }, [currentStep, smeltProgress, resetCooling])

  const handleCoolComplete = useCallback(() => {
    setIsCasting(false)
    setMoldOpen(true)

    setTimeout(() => {
      setCurrentStep('polish')
      setMirrorReflectivity(selectedAlloy?.reflectivity || 0.1)
      setMirrorRoughness(selectedAlloy?.roughness || 0.8)
    }, 1500)
  }, [selectedAlloy])

  const handleToolSelect = useCallback((tool: PolishTool) => {
    if (currentStep !== 'polish') return
    setCurrentTool(tool)

    if (tool.id === 'coarse') {
      setPolishStage('coarse')
    } else if (tool.id === 'fine') {
      setPolishStage('fine')
    } else if (tool.id === 'polish') {
      setPolishStage('polish')
    }
  }, [currentStep])

  const handlePolish = useCallback((tool: PolishTool, _delta: THREE.Vector2) => {
    if (currentStep !== 'polish') return

    polishCountRef.current += 1

    setMirrorRoughness(prev => {
      const next = Math.max(0.02, prev + tool.roughnessChange * 0.1)
      return next
    })

    setMirrorReflectivity(prev => {
      const next = Math.min(0.95, prev + tool.reflectivityChange * 0.05)

      if (next >= 0.9 && polishCountRef.current > 10) {
        setTimeout(() => {
          setCurrentStep('finish')
          setShowReflection(true)
          setPolishStage(null)
          setCurrentTool(null)
        }, 500)
      }

      return next
    })
  }, [currentStep])

  const handleRotateToggle = useCallback(() => {
    setIsRotating(prev => !prev)
  }, [])

  const handleScreenshot = useCallback(() => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return

    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = 1024
    tempCanvas.height = 768
    const ctx = tempCanvas.getContext('2d')!

    ctx.fillStyle = '#2a1b18'
    ctx.fillRect(0, 0, 1024, 768)
    ctx.drawImage(canvas, 0, 0, 1024, 768)

    const watermark = '战国铜镜铸造工坊'
    ctx.font = "24px 'Ma Shan Zheng', cursive"
    ctx.fillStyle = 'rgba(188, 170, 164, 0.8)'
    ctx.textAlign = 'right'
    ctx.fillText(watermark, 1000, 740)

    if (selectedAlloy) {
      ctx.font = "16px 'Noto Serif SC', serif"
      ctx.fillStyle = 'rgba(141, 110, 99, 0.8)'
      ctx.textAlign = 'left'
      ctx.fillText(`材质: ${selectedAlloy.name}`, 20, 740)
      ctx.fillText(`反射率: ${Math.round(mirrorReflectivity * 100)}%`, 20, 715)
    }

    tempCanvas.toBlob((blob) => {
      if (blob) {
        const id = uuidv4().slice(0, 8)
        const filename = `bronze_mirror_${id}.png`
        saveAs(blob, filename)
      }
    }, 'image/png')
  }, [selectedAlloy, mirrorReflectivity])

  const handleAlloyInfo = useCallback((alloy: CopperAlloy) => {
    setSelectedAlloy(alloy)
  }, [])

  const generateReflectionImage = useCallback(() => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return

    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = 200
    tempCanvas.height = 150
    const ctx = tempCanvas.getContext('2d')!

    const gradient = ctx.createRadialGradient(100, 75, 0, 100, 75, 100)
    gradient.addColorStop(0, '#d7ccc8')
    gradient.addColorStop(0.3, '#8d6e63')
    gradient.addColorStop(0.6, '#5d4037')
    gradient.addColorStop(1, '#2a1b18')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 200, 150)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 200
      const y = Math.random() * 150
      const size = Math.random() * 3 + 1
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }

    if (selectedAlloy) {
      ctx.fillStyle = selectedAlloy.color
      ctx.globalAlpha = 0.3
      ctx.fillRect(0, 0, 200, 150)
      ctx.globalAlpha = 1
    }

    setReflectionImage(tempCanvas.toDataURL('image/png'))
  }, [selectedAlloy])

  useEffect(() => {
    if (showReflection && currentStep === 'finish') {
      generateReflectionImage()
      const interval = setInterval(generateReflectionImage, 2000)
      return () => clearInterval(interval)
    }
  }, [showReflection, currentStep, generateReflectionImage])

  const canCast = currentStep === 'smelt' && smeltProgress >= 1
  const canPolish = currentStep === 'polish'

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      background: '#2a1b18'
    }}>
      <CastingScene
        currentStep={currentStep}
        selectedAlloy={selectedAlloy}
        isSmelting={isSmelting}
        smeltProgress={smeltProgress}
        isCasting={isCasting}
        coolingProgress={coolingProgress}
        moldOpen={moldOpen}
        mirrorReflectivity={mirrorReflectivity}
        mirrorRoughness={mirrorRoughness}
        isRotating={isRotating}
        currentTool={currentTool}
        polishStage={polishStage}
        onAlloySelect={handleAlloySelect}
        onIngotDropped={handleIngotDropped}
        onPolish={handlePolish}
        onSmeltComplete={handleSmeltComplete}
        onCoolComplete={handleCoolComplete}
        copperAlloys={copperAlloys}
      />
      <UIOverlay
        currentStep={currentStep}
        selectedAlloy={selectedAlloy}
        smeltProgress={smeltProgress}
        coolingProgress={coolingProgress}
        mirrorReflectivity={mirrorReflectivity}
        mirrorRoughness={mirrorRoughness}
        isRotating={isRotating}
        currentTool={currentTool}
        polishTools={polishTools}
        copperAlloys={copperAlloys}
        onCastClick={handleCastClick}
        onToolSelect={handleToolSelect}
        onRotateToggle={handleRotateToggle}
        onScreenshot={handleScreenshot}
        onAlloyInfo={handleAlloyInfo}
        canCast={canCast}
        canPolish={canPolish}
        showReflection={showReflection}
        reflectionImage={reflectionImage}
      />
    </div>
  )
}

export default App

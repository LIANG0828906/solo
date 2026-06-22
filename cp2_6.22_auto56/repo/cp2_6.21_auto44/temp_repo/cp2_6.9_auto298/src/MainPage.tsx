import { useState, useEffect, useRef, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { JointComponent, JointType, Position } from './JoinCore'
import {
  JOINT_CONFIGS,
  generateInitialPositions,
  generateTargetPositions,
  validateAssembly,
  calculateStressTest
} from './JoinCore'
import {
  generateJointCode,
  copyToClipboard,
  formatTime,
  playSuccessSound,
  generateStampPNG,
  createParticles
} from './Utils'
import {
  WoodBlock,
  ToolIcon,
  StructureDiagram,
  CompassProgress,
  SuccessScroll,
  CrackEffect,
  ParticleExplosion,
  GlueEffect
} from './Components'

const WORKBENCH_WIDTH = 900
const WORKBENCH_HEIGHT = 400
const COMPONENT_SIZE = { width: 120, height: 80, depth: 60 }

export default function MainPage() {
  const [jointType, setJointType] = useState<JointType>('straight')
  const [components, setComponents] = useState<JointComponent[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [diagramScale, setDiagramScale] = useState(1)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [jointCode, setJointCode] = useState('')
  const [authorName, setAuthorName] = useState('无名匠人')
  const [isEarthquake, setIsEarthquake] = useState(false)
  const [showCracks, setShowCracks] = useState(false)
  const [crackLocations, setCrackLocations] = useState<{ x: number; y: number; length: number; angle: number }[]>([])
  const [particles, setParticles] = useState<{ id: string; tx: number; ty: number; delay: number }[]>([])
  const [showGlue, setShowGlue] = useState(false)
  const [showSelectDropdown, setShowSelectDropdown] = useState(false)
  const [copiedMessage, setCopiedMessage] = useState(false)
  const [assemblyComplete, setAssemblyComplete] = useState(false)

  const workbenchRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<number | null>(null)
  const earthquakeTimeoutRef = useRef<number | null>(null)

  const initializeComponents = useCallback((type: JointType) => {
    const { tenon: tenonInit, mortises: mortisesInit } = generateInitialPositions(
      type,
      WORKBENCH_WIDTH,
      WORKBENCH_HEIGHT
    )
    const { tenon: tenonTarget, mortises: mortisesTarget } = generateTargetPositions(
      type,
      WORKBENCH_WIDTH,
      WORKBENCH_HEIGHT
    )

    const newComponents: JointComponent[] = [
      {
        id: uuidv4(),
        type: 'tenon',
        position: { ...tenonInit },
        targetPosition: { ...tenonTarget },
        size: COMPONENT_SIZE,
        attached: true,
        jointType: type,
        order: 0
      },
      ...mortisesInit.map((pos, index) => ({
        id: uuidv4(),
        type: 'mortise' as const,
        position: { ...pos },
        targetPosition: { ...mortisesTarget[index] },
        size: COMPONENT_SIZE,
        attached: false,
        jointType: type,
        order: index + 1
      }))
    ]

    setComponents(newComponents)
    setElapsedTime(0)
    setAttempts(0)
    setShowSuccess(false)
    setShowCracks(false)
    setCrackLocations([])
    setParticles([])
    setShowGlue(false)
    setAssemblyComplete(false)
    setJointCode(generateJointCode(type))

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    timerRef.current = window.setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)
  }, [])

  useEffect(() => {
    initializeComponents(jointType)
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (earthquakeTimeoutRef.current) {
        clearTimeout(earthquakeTimeoutRef.current)
      }
    }
  }, [jointType, initializeComponents])

  const tenon = components.find((c) => c.type === 'tenon')!
  const mortises = components.filter((c) => c.type === 'mortise')
  const attachedCount = mortises.filter((m) => m.attached).length
  const config = JOINT_CONFIGS[jointType]

  const handleAttach = useCallback((id: string, position: Position) => {
    setComponents((prev) => {
      const updated = prev.map((c) =>
        c.id === id ? { ...c, position: { ...position }, attached: true } : c
      )

      const allAttached = validateAssembly(updated)
      if (allAttached) {
        setAssemblyComplete(true)
        setShowGlue(true)
        playSuccessSound()

        if (timerRef.current) {
          clearInterval(timerRef.current)
        }

        setTimeout(() => {
          setShowSuccess(true)
        }, 2000)
      }

      return updated
    })
  }, [])

  const handleError = useCallback((_id: string) => {
    setAttempts((prev) => prev + 1)
  }, [])

  const handleJointTypeChange = (type: JointType) => {
    setJointType(type)
    setShowSelectDropdown(false)
  }

  const handleCopyCode = async () => {
    await copyToClipboard(jointCode)
    setCopiedMessage(true)
    setTimeout(() => setCopiedMessage(false), 2000)
  }

  const handleSaveStamp = async () => {
    await generateStampPNG(
      jointCode,
      config.name,
      authorName,
      formatTime(elapsedTime),
      attempts
    )
  }

  const handleTestStress = () => {
    setShowSuccess(false)
    setIsEarthquake(true)
    setShowCracks(false)

    const isCorrect = true
    const stressResult = calculateStressTest(components, isCorrect)

    setTimeout(() => {
      setCrackLocations(stressResult.crackLocations)
      setShowCracks(true)

      if (stressResult.collapse) {
        setParticles(createParticles(WORKBENCH_WIDTH / 2, WORKBENCH_HEIGHT / 2, stressResult.particleCount))
      }
    }, 1500)

    earthquakeTimeoutRef.current = window.setTimeout(() => {
      setIsEarthquake(false)

      if (!stressResult.collapse) {
        setTimeout(() => {
          setShowSuccess(true)
        }, 500)
      }
    }, 3000)
  }

  const handleReset = () => {
    initializeComponents(jointType)
  }

  return (
    <div className="min-h-screen bg-[#5d4037] relative overflow-hidden">
      <div className="eaves-nav">
        <div className="bamboo-curtain left" />
        <div className="bamboo-curtain right" />
        <div className="flex items-center justify-center h-full">
          <h1 className="brush-font text-3xl text-[#f5e6c8] drop-shadow-lg">
            榫卯工坊
          </h1>
        </div>
      </div>

      <div className="absolute top-20 right-8 z-30">
        <CompassProgress progress={attachedCount} total={mortises.length} />
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-24 flex lg:flex-col gap-4 justify-center flex-wrap">
            <div className="tools-panel lg:flex-col flex-row flex-wrap justify-center">
              <ToolIcon type="chisel" />
              <ToolIcon type="plane" />
              <ToolIcon type="saw" />
              <ToolIcon type="hammer" />
              <ToolIcon type="ruler" />
              <ToolIcon type="square" />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <div className="relative">
                <div
                  className="wood-select flex items-center justify-between gap-2"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onClick={() => setShowSelectDropdown(!showSelectDropdown)}
                >
                  <span>{config.name}</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6L8 10L12 6" stroke="#5d4037" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

                {showTooltip && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-[#f5e6c8] border-2 border-[#6d4c41] rounded-lg p-4 z-40 shadow-lg">
                    <p className="text-[#5d4037] text-sm">{config.description}</p>
                  </div>
                )}

                {showSelectDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-[#f5e6c8] border-2 border-[#6d4c41] rounded-lg z-50 shadow-lg overflow-hidden">
                    {(Object.keys(JOINT_CONFIGS) as JointType[]).map((type) => (
                      <div
                        key={type}
                        className={`px-4 py-3 cursor-pointer hover:bg-[#d4a373] transition-colors ${
                          jointType === type ? 'bg-[#d4a373]' : ''
                        }`}
                        onClick={() => handleJointTypeChange(type)}
                      >
                        <span className="text-[#5d4037] font-medium">
                          {JOINT_CONFIGS[type].name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button className="brass-button" onClick={handleReset}>
                  重新开始
                </button>
              </div>
            </div>

            <div className="flex justify-center">
              <div
                ref={workbenchRef}
                className={`workbench relative ${isEarthquake ? 'earthquake-shake' : ''}`}
                style={{
                  background: `
                    radial-gradient(ellipse at center, #a1887f 0%, transparent 70%),
                    repeating-radial-gradient(
                      circle at 50% 50%,
                      #8d6e63 0px,
                      #a1887f 10px,
                      #8d6e63 20px,
                      #6d4c41 30px
                    ),
                    linear-gradient(90deg, #8d6e63 0%, #a1887f 50%, #8d6e63 100%)
                  `
                }}
              >
                {components.map((component) => (
                  <WoodBlock
                    key={component.id}
                    component={component}
                    tenon={tenon}
                    tolerance={config.tolerance}
                    onAttach={handleAttach}
                    onError={handleError}
                    workbenchRef={workbenchRef}
                  />
                ))}

                <GlueEffect show={showGlue} />
                <CrackEffect show={showCracks} cracks={crackLocations} />
                <ParticleExplosion
                  particles={particles}
                  centerX={WORKBENCH_WIDTH / 2}
                  centerY={WORKBENCH_HEIGHT / 2}
                />
              </div>
            </div>

            {assemblyComplete && (
              <div className="mt-8 flex flex-col items-center gap-4">
                <div className="text-[#f5e6c8] text-lg mb-2">
                  耗时：{formatTime(elapsedTime)} | 尝试：{attempts}次
                </div>
                <div
                  className="code-display flex items-center gap-3"
                  onClick={handleCopyCode}
                >
                  <span>{jointCode}</span>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="5" y="5" width="12" height="12" rx="2" stroke="#5d4037" strokeWidth="2" />
                    <path d="M5 15H4C3.44772 15 3 14.5523 3 14V4C3 3.44772 3.44772 3 4 3H14C14.5523 3 15 3.44772 15 4V5" stroke="#5d4037" strokeWidth="2" />
                  </svg>
                </div>
                {copiedMessage && (
                  <span className="text-[#ffd54f] text-sm">已复制到剪贴板！</span>
                )}
                <button className="brass-button" onClick={handleSaveStamp}>
                  保存图谱
                </button>
              </div>
            )}
          </div>

          <div className="lg:w-72">
            <StructureDiagram
              jointType={jointType}
              scale={diagramScale}
              onScaleChange={setDiagramScale}
            />

            <div className="mt-6 bg-[#f5e6c8]/90 rounded-lg p-4 border-2 border-[#6d4c41]">
              <h3 className="text-[#5d4037] font-bold mb-3">匠人署名</h3>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-3 py-2 bg-[#fff8e7] border-2 border-[#a1887f] rounded-lg text-[#5d4037] focus:outline-none focus:border-[#d4a373]"
                placeholder="请输入您的名号"
              />
            </div>

            <div className="mt-6 bg-[#f5e6c8]/90 rounded-lg p-4 border-2 border-[#6d4c41]">
              <h3 className="text-[#5d4037] font-bold mb-2">操作指南</h3>
              <ul className="text-[#5d4037] text-sm space-y-2">
                <li>• 拖动卯眼构件靠近榫头</li>
                <li>• 位置和角度正确时自动吸附</li>
                <li>• 完成所有拼接后可检测受力</li>
                <li>• 保存您的专属榫卯图谱</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {showSuccess && (
        <SuccessScroll
          time={formatTime(elapsedTime)}
          attempts={attempts}
          code={jointCode}
          onClose={() => setShowSuccess(false)}
          onTestStress={handleTestStress}
        />
      )}

      {showSelectDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSelectDropdown(false)}
        />
      )}
    </div>
  )
}

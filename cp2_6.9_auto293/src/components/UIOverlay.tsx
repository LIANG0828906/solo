import { motion, AnimatePresence } from 'framer-motion'
import { CopperAlloy, PolishTool, ProcessStep, processSteps } from '../utils/materials'

interface UIOverlayProps {
  currentStep: ProcessStep
  selectedAlloy: CopperAlloy | null
  smeltProgress: number
  coolingProgress: number
  mirrorReflectivity: number
  mirrorRoughness: number
  isRotating: boolean
  currentTool: PolishTool | null
  polishTools: PolishTool[]
  copperAlloys: CopperAlloy[]
  onCastClick: () => void
  onToolSelect: (tool: PolishTool) => void
  onRotateToggle: () => void
  onScreenshot: () => void
  onAlloyInfo: (alloy: CopperAlloy) => void
  canCast: boolean
  canPolish: boolean
  showReflection: boolean
  reflectionImage: string | null
}

export function UIOverlay({
  currentStep,
  selectedAlloy,
  smeltProgress,
  coolingProgress,
  mirrorReflectivity,
  mirrorRoughness,
  isRotating,
  currentTool,
  polishTools,
  copperAlloys,
  onCastClick,
  onToolSelect,
  onRotateToggle,
  onScreenshot,
  onAlloyInfo,
  canCast,
  canPolish,
  showReflection,
  reflectionImage
}: UIOverlayProps) {
  const currentStepIndex = processSteps.findIndex(s => s.id === currentStep)

  const getProgressBarColor = (progress: number) => {
    const r = Math.floor(255)
    const g = Math.floor(69 + progress * 186)
    const b = Math.floor(progress * 255)
    return `rgb(${r}, ${g}, ${b})`
  }

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      fontFamily: "'Noto Serif SC', serif",
      color: '#d7ccc8',
      minWidth: '800px'
    }}>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        style={{
          position: 'absolute',
          left: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          pointerEvents: 'auto'
        }}
      >
        {processSteps.map((step, index) => {
          const isActive = step.id === currentStep
          const isCompleted = index < currentStepIndex
          return (
            <motion.div
              key={step.id}
              initial={false}
              animate={{
                scale: isActive ? 1.1 : 1,
                opacity: isCompleted || isActive ? 1 : 0.5
              }}
              transition={{ duration: 0.3 }}
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, #5d9b8f 0%, #3b7a6f 100%)'
                  : 'rgba(62, 39, 35, 0.9)',
                border: `2px solid ${isActive ? '#8d6e63' : '#5d4037'}`,
                borderRadius: '8px',
                padding: '12px 16px',
                minWidth: '140px',
                boxShadow: isActive
                  ? '0 4px 20px rgba(93, 155, 143, 0.4)'
                  : '0 2px 10px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div style={{
                fontFamily: "'Ma Shan Zheng', cursive",
                fontSize: '20px',
                color: isActive ? '#fff' : '#bcaaa4',
                marginBottom: '4px'
              }}>
                {index + 1}. {step.name}
              </div>
              <div style={{
                fontSize: '11px',
                color: isActive ? '#e0f2f1' : '#8d6e63'
              }}>
                {step.description}
              </div>
              {isCompleted && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#4caf50',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    color: '#fff'
                  }}
                >
                  ✓
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </motion.div>

      <AnimatePresence>
        {(currentStep === 'smelt' || smeltProgress > 0) && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{
              position: 'absolute',
              right: '40px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'auto'
            }}
          >
            <div style={{
              background: 'rgba(62, 39, 35, 0.95)',
              border: '2px solid #8d6e63',
              borderRadius: '8px',
              padding: '16px 12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                fontFamily: "'Ma Shan Zheng', cursive",
                fontSize: '18px',
                color: '#bcaaa4'
              }}>
                熔炼进度
              </div>
              <div style={{
                width: '30px',
                height: '200px',
                background: '#2a1810',
                borderRadius: '15px',
                border: '2px solid #5d4037',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${smeltProgress * 100}%` }}
                  transition={{ duration: 0.5 }}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: `linear-gradient(to top, ${getProgressBarColor(smeltProgress)}, ${getProgressBarColor(Math.min(1, smeltProgress + 0.2))})`,
                    borderRadius: '0 0 13px 13px'
                  }}
                />
              </div>
              <div style={{
                fontSize: '14px',
                color: '#ffab91',
                fontWeight: 600
              }}>
                {Math.round(smeltProgress * 100)}%
              </div>
              {selectedAlloy && (
                <div style={{
                  fontSize: '11px',
                  color: '#8d6e63',
                  marginTop: '4px'
                }}>
                  材料: {selectedAlloy.name}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {currentStep === 'cool' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{
              position: 'absolute',
              right: '40px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'auto'
            }}
          >
            <div style={{
              background: 'rgba(62, 39, 35, 0.95)',
              border: '2px solid #8d6e63',
              borderRadius: '8px',
              padding: '16px 12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                fontFamily: "'Ma Shan Zheng', cursive",
                fontSize: '18px',
                color: '#bcaaa4'
              }}>
                冷却进度
              </div>
              <div style={{
                width: '30px',
                height: '200px',
                background: '#2a1810',
                borderRadius: '15px',
                border: '2px solid #5d4037',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <motion.div
                  animate={{ height: `${coolingProgress * 100}%` }}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: `linear-gradient(to top, #696969, #808080)`,
                    borderRadius: '0 0 13px 13px'
                  }}
                />
              </div>
              <div style={{
                fontSize: '14px',
                color: '#90a4ae',
                fontWeight: 600
              }}>
                {Math.round(coolingProgress * 100)}%
              </div>
              <div style={{
                fontSize: '11px',
                color: '#8d6e63'
              }}>
                冷却中...
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {currentStep === 'smelt' && smeltProgress >= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'absolute',
              bottom: '40px',
              left: '50%',
              transform: 'translateX(-50%)',
              pointerEvents: 'auto'
            }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCastClick}
              disabled={!canCast}
              style={{
                background: canCast
                  ? 'linear-gradient(135deg, #5d9b8f 0%, #3b7a6f 100%)'
                  : 'rgba(93, 155, 143, 0.4)',
                border: '2px solid #8d6e63',
                borderRadius: '8px',
                padding: '16px 32px',
                fontFamily: "'Ma Shan Zheng', cursive",
                fontSize: '24px',
                color: canCast ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                cursor: canCast ? 'pointer' : 'not-allowed',
                boxShadow: canCast
                  ? '0 4px 20px rgba(93, 155, 143, 0.5)'
                  : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              翻模浇铸
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {canPolish && currentStep === 'polish' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'absolute',
              bottom: '30px',
              left: '50%',
              transform: 'translateX(-50%)',
              pointerEvents: 'auto'
            }}
          >
            <div style={{
              background: 'rgba(62, 39, 35, 0.95)',
              border: '2px solid #8d6e63',
              borderRadius: '12px',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              alignItems: 'center'
            }}>
              <div style={{
                fontFamily: "'Ma Shan Zheng', cursive",
                fontSize: '22px',
                color: '#bcaaa4'
              }}>
                研磨工具
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {polishTools.map(tool => {
                  const isSelected = currentTool?.id === tool.id
                  return (
                    <motion.button
                      key={tool.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onToolSelect(tool)}
                      style={{
                        background: isSelected
                          ? 'linear-gradient(135deg, #5d9b8f 0%, #3b7a6f 100%)'
                          : 'rgba(93, 64, 55, 0.8)',
                        border: `2px solid ${isSelected ? '#8d6e63' : '#5d4037'}`,
                        borderRadius: '8px',
                        padding: '12px 20px',
                        cursor: 'pointer',
                        minWidth: '100px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{
                        fontFamily: "'Ma Shan Zheng', cursive",
                        fontSize: '16px',
                        color: isSelected ? '#fff' : '#d7ccc8',
                        marginBottom: '4px'
                      }}>
                        {tool.name}
                      </div>
                      <div style={{
                        fontSize: '10px',
                        color: isSelected ? '#b2dfdb' : '#8d6e63'
                      }}>
                        {tool.id === 'coarse' && '去除凸起'}
                        {tool.id === 'fine' && '细腻拉丝'}
                        {tool.id === 'polish' && '镜面抛光'}
                      </div>
                    </motion.button>
                  )
                })}
              </div>
              <div style={{
                display: 'flex',
                gap: '20px',
                alignItems: 'center',
                fontSize: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#8d6e63' }}>反射率:</span>
                  <div style={{
                    width: '100px',
                    height: '8px',
                    background: '#2a1810',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <motion.div
                      animate={{ width: `${mirrorReflectivity * 100}%` }}
                      style={{
                        height: '100%',
                        background: 'linear-gradient(90deg, #b87333, #ffd700)'
                      }}
                    />
                  </div>
                  <span style={{ color: '#ffd700', minWidth: '35px' }}>
                    {Math.round(mirrorReflectivity * 100)}%
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#8d6e63' }}>粗糙度:</span>
                  <div style={{
                    width: '100px',
                    height: '8px',
                    background: '#2a1810',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <motion.div
                      animate={{ width: `${mirrorRoughness * 100}%` }}
                      style={{
                        height: '100%',
                        background: 'linear-gradient(90deg, #7a7a7a, #4a4a4a)'
                      }}
                    />
                  </div>
                  <span style={{ color: '#90a4ae', minWidth: '35px' }}>
                    {Math.round(mirrorRoughness * 100)}%
                  </span>
                </div>
              </div>
              <div style={{
                fontSize: '11px',
                color: '#8d6e63',
                textAlign: 'center'
              }}>
                提示: 选择工具后，在镜面上按住鼠标并拖动进行研磨
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {currentStep === 'finish' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'absolute',
              bottom: '30px',
              left: '50%',
              transform: 'translateX(-50%)',
              pointerEvents: 'auto',
              display: 'flex',
              gap: '16px'
            }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRotateToggle}
              style={{
                background: isRotating
                  ? 'linear-gradient(135deg, #8d6e63 0%, #5d4037 100%)'
                  : 'linear-gradient(135deg, #5d9b8f 0%, #3b7a6f 100%)',
                border: '2px solid #8d6e63',
                borderRadius: '8px',
                padding: '14px 28px',
                fontFamily: "'Ma Shan Zheng', cursive",
                fontSize: '20px',
                color: '#fff',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(93, 155, 143, 0.4)',
                transition: 'all 0.3s ease'
              }}
            >
              {isRotating ? '停止旋转' : '旋转展示'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onScreenshot}
              style={{
                background: 'linear-gradient(135deg, #8d6e63 0%, #5d4037 100%)',
                border: '2px solid #8d6e63',
                borderRadius: '8px',
                padding: '14px 28px',
                fontFamily: "'Ma Shan Zheng', cursive",
                fontSize: '20px',
                color: '#fff',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(141, 110, 99, 0.4)',
                transition: 'all 0.3s ease'
              }}
            >
              截图保存
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReflection && reflectionImage && currentStep === 'finish' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              pointerEvents: 'auto'
            }}
          >
            <div style={{
              background: 'rgba(62, 39, 35, 0.95)',
              border: '2px solid #8d6e63',
              borderRadius: '8px',
              padding: '12px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
            }}>
              <div style={{
                fontFamily: "'Ma Shan Zheng', cursive",
                fontSize: '16px',
                color: '#bcaaa4',
                marginBottom: '8px',
                textAlign: 'center'
              }}>
                镜面反射
              </div>
              <div style={{
                width: '200px',
                height: '150px',
                borderRadius: '4px',
                overflow: 'hidden',
                border: '1px solid #5d4037'
              }}>
                <img
                  src={reflectionImage}
                  alt="Reflection"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center'
        }}
      >
        <h1 style={{
          fontFamily: "'Ma Shan Zheng', cursive",
          fontSize: '36px',
          color: '#bcaaa4',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
          marginBottom: '4px'
        }}>
          战国铜镜铸造工坊
        </h1>
        <p style={{
          fontSize: '13px',
          color: '#8d6e63'
        }}>
          选料 · 熔炼 · 翻模 · 冷却 · 研磨 · 成品
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          position: 'absolute',
          left: '20px',
          top: '20px',
          pointerEvents: 'auto'
        }}
      >
        <div style={{
          background: 'rgba(62, 39, 35, 0.9)',
          border: '2px solid #8d6e63',
          borderRadius: '8px',
          padding: '12px 16px',
          maxWidth: '220px'
        }}>
          <div style={{
            fontFamily: "'Ma Shan Zheng', cursive",
            fontSize: '16px',
            color: '#bcaaa4',
            marginBottom: '8px'
          }}>
            铜料配方
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {copperAlloys.map(alloy => (
              <motion.div
                key={alloy.id}
                whileHover={{ x: 5 }}
                onClick={() => onAlloyInfo(alloy)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: selectedAlloy?.id === alloy.id
                    ? 'rgba(93, 155, 143, 0.3)'
                    : 'transparent',
                  cursor: 'pointer',
                  border: selectedAlloy?.id === alloy.id
                    ? '1px solid #5d9b8f'
                    : '1px solid transparent'
                }}
              >
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '3px',
                  background: alloy.color,
                  border: '1px solid rgba(255,255,255,0.3)'
                }} />
                <div style={{ fontSize: '12px', color: '#d7ccc8' }}>
                  {alloy.name}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <style>{`
        @media (max-width: 1024px) {
          div[style*="left: 20px"][style*="top: 20px"] {
            max-width: 180px;
          }
        }
      `}</style>
    </div>
  )
}

import { useState } from 'react'
import { motion } from 'framer-motion'
import { SketchPicker } from 'react-color'
import { useArtStore } from '@/store/useArtStore'
import { PRESET_WORDS, EMOTION_COLORS, EmotionCategory } from '@/types'

const springConfig = { stiffness: 200, damping: 20 }

export const ControlPanel = () => {
  const {
    wordBlocks,
    selectedBlockId,
    updateWordBlock,
  } = useArtStore()

  const [showColorPicker, setShowColorPicker] = useState(false)

  const selectedBlock = wordBlocks.find((b) => b.id === selectedBlockId)

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    text: string,
    category: EmotionCategory
  ) => {
    e.dataTransfer.setData('text/plain', text)
    e.dataTransfer.setData('category', category)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const categoryLabels: Record<EmotionCategory, string> = {
    warm: '暖色情绪',
    cool: '冷色情绪',
    neutral: '中性情绪',
  }

  const groupedWords = PRESET_WORDS.reduce(
    (acc, word) => {
      if (!acc[word.category]) {
        acc[word.category] = []
      }
      acc[word.category].push(word)
      return acc
    },
    {} as Record<EmotionCategory, typeof PRESET_WORDS>
  )

  return (
    <motion.div
      className="w-72 h-full flex flex-col gap-4 p-4 overflow-y-auto"
      style={{
        background: 'rgba(27, 40, 56, 0.85)',
        backdropFilter: 'blur(8px)',
        borderRight: '1px solid rgba(139, 157, 195, 0.2)',
        fontFamily: '"Noto Sans SC", sans-serif',
      }}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', ...springConfig }}
    >
      <div className="text-center pb-3 border-b border-white/10">
        <h1
          className="text-xl font-bold"
          style={{ color: '#C9A96E', letterSpacing: 2 }}
        >
          情绪字体画布
        </h1>
        <p className="text-xs mt-1" style={{ color: '#8B9DC3' }}>
          拖拽词语 · 调节参数 · 创作艺术
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <h2 className="text-sm font-medium mb-3" style={{ color: '#8B9DC3' }}>
          词语库
        </h2>

        {(Object.keys(groupedWords) as EmotionCategory[]).map((category) => (
          <div key={category} className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: EMOTION_COLORS[category] }}
              />
              <span className="text-xs" style={{ color: '#A5B1C2' }}>
                {categoryLabels[category]}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {groupedWords[category].map((word) => (
                <motion.div
                  key={word.text}
                  className="relative"
                  whileHover={{
                    scale: 1.05,
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', ...springConfig }}
                >
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, word.text, category)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-grab active:cursor-grabbing h-full"
                    style={{
                      background: 'rgba(58, 80, 107, 0.5)',
                      border: '1px solid rgba(139, 157, 195, 0.2)',
                      userSelect: 'none',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      const target = e.currentTarget
                      target.style.background = 'rgba(58, 80, 107, 0.8)'
                      target.style.borderColor = EMOTION_COLORS[category]
                      target.style.boxShadow = `0 0 12px ${EMOTION_COLORS[category]}40`
                    }}
                    onMouseLeave={(e) => {
                      const target = e.currentTarget
                      target.style.background = 'rgba(58, 80, 107, 0.5)'
                      target.style.borderColor = 'rgba(139, 157, 195, 0.2)'
                      target.style.boxShadow = 'none'
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: EMOTION_COLORS[category] }}
                    />
                    <span
                      className="text-sm truncate"
                      style={{ color: EMOTION_COLORS[category] }}
                    >
                      {word.text}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedBlock && (
        <motion.div
          className="pt-4 border-t border-white/10 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', ...springConfig }}
        >
          <h2 className="text-sm font-medium" style={{ color: '#8B9DC3' }}>
            文字调节
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-xs block mb-2" style={{ color: '#A5B1C2' }}>
                文字内容
              </label>
              <input
                type="text"
                value={selectedBlock.text}
                onChange={(e) =>
                  updateWordBlock(selectedBlock.id, { text: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  background: 'rgba(58, 80, 107, 0.5)',
                  border: '1px solid rgba(139, 157, 195, 0.3)',
                  color: selectedBlock.color,
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div>
              <label className="text-xs block mb-2" style={{ color: '#A5B1C2' }}>
                颜色
              </label>
              <div className="relative">
                <motion.div
                  className="w-full h-10 rounded-lg cursor-pointer flex items-center justify-between px-3"
                  style={{
                    background: 'rgba(58, 80, 107, 0.5)',
                    border: '1px solid rgba(139, 157, 195, 0.3)',
                  }}
                  whileHover={{ borderColor: '#C9A96E' }}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                >
                  <div
                    className="w-6 h-6 rounded-md"
                    style={{ backgroundColor: selectedBlock.color }}
                  />
                  <span className="text-xs" style={{ color: '#8B9DC3' }}>
                    {selectedBlock.color.toUpperCase()}
                  </span>
                </motion.div>
                {showColorPicker && (
                  <motion.div
                    className="absolute z-50 mt-2"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', ...springConfig }}
                    style={{ right: 0 }}
                  >
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-xl"
                      style={{
                        background: 'rgba(27, 40, 56, 0.95)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(139, 157, 195, 0.3)',
                      }}
                    >
                      <SketchPicker
                        color={selectedBlock.color}
                        onChange={(color: { hex: string }) =>
                          updateWordBlock(selectedBlock.id, { color: color.hex })
                        }
                        disableAlpha
                        presetColors={[
                          '#F3A683',
                          '#C9A96E',
                          '#78D1E1',
                          '#A5B1C2',
                          '#8B9DC3',
                          '#FFFFFF',
                        ]}
                        styles={{
                          default: {
                            picker: {
                              background: 'transparent',
                              boxShadow: 'none',
                            },
                          },
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs block mb-2" style={{ color: '#A5B1C2' }}>
                字号: {selectedBlock.fontSize}px
              </label>
              <input
                type="range"
                min="16"
                max="72"
                value={selectedBlock.fontSize}
                onChange={(e) =>
                  updateWordBlock(selectedBlock.id, {
                    fontSize: Number(e.target.value),
                  })
                }
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #C9A96E ${((selectedBlock.fontSize - 16) / 56) * 100}%, rgba(139, 157, 195, 0.3) ${((selectedBlock.fontSize - 16) / 56) * 100}%)`,
                }}
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: '#6B7B95' }}>
                <span>16px</span>
                <span>72px</span>
              </div>
            </div>

            <div>
              <label className="text-xs block mb-2" style={{ color: '#A5B1C2' }}>
                字重: {selectedBlock.fontWeight}
              </label>
              <input
                type="range"
                min="300"
                max="900"
                step="100"
                value={selectedBlock.fontWeight}
                onChange={(e) =>
                  updateWordBlock(selectedBlock.id, {
                    fontWeight: Number(e.target.value),
                  })
                }
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #C9A96E ${((selectedBlock.fontWeight - 300) / 600) * 100}%, rgba(139, 157, 195, 0.3) ${((selectedBlock.fontWeight - 300) / 600) * 100}%)`,
                }}
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: '#6B7B95' }}>
                <span>300</span>
                <span>900</span>
              </div>
            </div>

            <div className="pt-2">
              <div
                className="text-xs mb-2"
                style={{ color: '#8B9DC3' }}
              >
                当前动画: {selectedBlock.animation ? getAnimationName(selectedBlock.animation) : '无'}
              </div>
              <div
                className="text-xs"
                style={{ color: '#6B7B95' }}
              >
                点击文字右下角 ⚙ 图标设置动画效果
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div
        className="pt-3 border-t border-white/10 text-center text-xs"
        style={{ color: '#6B7B95' }}
      >
        双击文字可编辑内容
      </div>
    </motion.div>
  )
}

function getAnimationName(type: string): string {
  const names: Record<string, string> = {
    pulse: '脉动',
    float: '漂浮',
    breathe: '呼吸',
    flow: '流动',
  }
  return names[type] || type
}

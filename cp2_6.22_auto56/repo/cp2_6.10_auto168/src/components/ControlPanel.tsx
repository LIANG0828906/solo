import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Pause, Info, Calendar, Star } from 'lucide-react'
import { useAppStore, RING_DATA, MONTHS } from '@/store/useAppStore'

export default function ControlPanel() {
  const currentMonth = useAppStore(state => state.currentMonth)
  const selectedRing = useAppStore(state => state.selectedRing)
  const showInfo = useAppStore(state => state.showInfo)
  const hoveredRing = useAppStore(state => state.hoveredRing)
  const autoRotate = useAppStore(state => state.autoRotate)
  const setCurrentMonth = useAppStore(state => state.setCurrentMonth)
  const setSelectedRing = useAppStore(state => state.setSelectedRing)
  const setShowInfo = useAppStore(state => state.setShowInfo)
  const setAutoRotate = useAppStore(state => state.setAutoRotate)

  const selectedRingData = RING_DATA.find(r => r.id === selectedRing)
  const hoveredRingData = RING_DATA.find(r => r.id === hoveredRing)

  const getCurrentSolarTerm = () => {
    const termIndex = Math.floor((currentMonth / 11) * 24)
    const terms = ['立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至', '小寒', '大寒']
    return terms[termIndex] || '立春'
  }

  return (
    <>
      <AnimatePresence>
        {hoveredRingData && !selectedRing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="ancient-panel rounded-lg px-6 py-3 flex items-center gap-3">
              <Star className="w-5 h-5 text-yellow-400 animate-gold-pulse" />
              <span className="chinese-title text-yellow-200 text-lg">{hoveredRingData.chineseName}</span>
              <span className="text-gray-400 text-sm">点击查看详情</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-6 right-6 z-40 w-80 max-w-[calc(100vw-3rem)]
                   md:bottom-8 md:right-8 md:w-96"
      >
        <div className="ancient-panel rounded-2xl p-6 gold-border">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="chinese-title text-2xl text-yellow-300 tracking-wider">
                璇玑玉衡
              </h2>
              <button
                onClick={() => setAutoRotate(!autoRotate)}
                className="ancient-button rounded-lg px-3 py-1.5 flex items-center gap-2 text-sm text-yellow-100"
                title={autoRotate ? '暂停自动旋转' : '开始自动旋转'}
              >
                {autoRotate ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-gray-400 text-sm">北宋·司天监 天文观测仪</p>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-yellow-500" />
              <span className="text-yellow-200">年历调节</span>
            </div>
            
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">当前月份</span>
                <span className="text-yellow-300 font-bold text-lg chinese-title">
                  {MONTHS[currentMonth]}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="11"
                step="1"
                value={currentMonth}
                onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                className="ancient-slider w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>正月</span>
                <span>腊月</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-black/20">
              <Info className="w-4 h-4 text-yellow-500 flex-shrink-0" />
              <div className="text-sm">
                <span className="text-gray-400">当前节气：</span>
                <span className="text-yellow-300 ml-1">{getCurrentSolarTerm()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-yellow-200 text-sm mb-3 flex items-center gap-2">
              <Star className="w-4 h-4" />
              环圈列表
            </h3>
            {RING_DATA.map((ring) => (
              <button
                key={ring.id}
                onClick={() => {
                  if (selectedRing === ring.id) {
                    setSelectedRing(null)
                  } else {
                    setSelectedRing(ring.id)
                    setShowInfo(true)
                  }
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-300
                  ${selectedRing === ring.id 
                    ? 'bg-gradient-to-r from-yellow-600/30 to-transparent border border-yellow-500/50' 
                    : 'bg-black/20 hover:bg-black/40 border border-transparent'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: ring.color }}
                      />
                      <span className="text-yellow-100">{ring.chineseName}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {ring.markings.length} 个刻度
                    </div>
                  </div>
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ 
                      backgroundColor: selectedRing === ring.id ? '#ffd700' : 'transparent',
                      boxShadow: selectedRing === ring.id ? '0 0 10px #ffd700' : 'none'
                    }}
                  />
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-yellow-900/50">
            <p className="text-xs text-gray-500 text-center">
              拖拽旋转 · 滚轮缩放 · 点击查看
            </p>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showInfo && selectedRingData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg px-4"
          >
            <div className="info-popup rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
              
              <button
                onClick={() => {
                  setShowInfo(false)
                  setSelectedRing(null)
                }}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-yellow-400" />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ 
                    backgroundColor: selectedRingData.color + '30',
                    border: `2px solid ${selectedRingData.color}`,
                    boxShadow: `0 0 30px ${selectedRingData.color}40`
                  }}
                >
                  <div 
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: selectedRingData.color }}
                  />
                </div>
                <div>
                  <h2 className="chinese-title text-3xl text-yellow-300">
                    {selectedRingData.chineseName}
                  </h2>
                  <p className="text-gray-400 text-sm">{selectedRingData.name}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="prose prose-invert">
                  <p className="text-gray-200 leading-relaxed text-lg">
                    {selectedRingData.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="p-4 rounded-xl bg-black/30 border border-yellow-900/30">
                    <div className="text-xs text-gray-500 mb-1">半径尺寸</div>
                    <div className="text-yellow-300 text-xl">{selectedRingData.radius} 尺</div>
                  </div>
                  <div className="p-4 rounded-xl bg-black/30 border border-yellow-900/30">
                    <div className="text-xs text-gray-500 mb-1">刻度数量</div>
                    <div className="text-yellow-300 text-xl">{selectedRingData.markings.length} 个</div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-yellow-200 mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    主要刻度
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRingData.markings.slice(0, 12).map((marking, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full text-sm bg-yellow-900/30 text-yellow-200 border border-yellow-700/30"
                      >
                        {marking.label}
                      </span>
                    ))}
                    {selectedRingData.markings.length > 12 && (
                      <span className="px-3 py-1 rounded-full text-sm text-gray-500">
                        +{selectedRingData.markings.length - 12} 更多
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showInfo && selectedRingData && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => {
            setShowInfo(false)
            setSelectedRing(null)
          }}
        />
      )}
    </>
  )
}

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wind, DoorOpen, Flame, Gauge, Sparkles, ChevronUp, ChevronDown } from 'lucide-react'
import { useIncenseStore } from '@/store/useIncenseStore'
import { INCENSE_NAMES, FAN_CONSTANTS } from '@/utils/constants'

const FAN_LEVEL_NAMES = ['关闭', '微风', '中风', '强风']

export function ControlPanel() {
  const { incenseType, fan, doorWindow, particleCount, fps } = useIncenseStore()
  const [isExpanded, setIsExpanded] = useState(false)

  const fanConfig = FAN_CONSTANTS.LEVELS[fan.level]

  return (
    <>
      <motion.div
        initial={{ x: 250, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="hidden md:flex fixed right-4 top-1/2 -translate-y-1/2 w-[200px] flex-col gap-4 p-4 rounded-lg z-10"
        style={{
          backgroundColor: 'rgba(26, 26, 26, 0.85)',
          backdropFilter: 'blur(4px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div className="text-center pb-3 border-b border-amber-900/30">
          <h2 className="text-amber-200 text-lg font-serif mb-1">西市香料铺</h2>
          <p className="text-amber-400/70 text-xs">Tang Dynasty Incense</p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Flame className="w-5 h-5 text-orange-400" />
            <div className="flex-1">
              <p className="text-amber-200/60 text-xs">当前香料</p>
              <p className="text-amber-100 font-medium">{INCENSE_NAMES[incenseType]}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Wind className="w-5 h-5 text-cyan-400" />
            <div className="flex-1">
              <p className="text-amber-200/60 text-xs">扇风档位</p>
              <p className="text-amber-100 font-medium">
                {fan.level > 0 ? `${FAN_LEVEL_NAMES[fan.level]} · ${fan.angle.toFixed(0)}°` : '关闭'}
              </p>
              {fan.level > 0 && (
                <div className="w-full h-1 bg-amber-900/50 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-300"
                    style={{ width: `${(fan.level / 3) * 100}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DoorOpen className="w-5 h-5 text-green-400" />
            <div className="flex-1">
              <p className="text-amber-200/60 text-xs">门窗状态</p>
              <div className="flex gap-2 mt-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded ${doorWindow.leftDoor ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}
                >
                  左门 {doorWindow.leftDoor ? '开' : '关'}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${doorWindow.backWindow ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}
                >
                  后窗 {doorWindow.backWindow ? '开' : '关'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-amber-900/30">
          <p className="text-amber-200/60 text-xs mb-2 flex items-center gap-2">
            <Gauge className="w-4 h-4" />
            性能监控
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-black/30 rounded p-2 text-center">
              <p className="text-amber-300 font-mono text-lg">{particleCount}</p>
              <p className="text-amber-200/50 text-xs">粒子数</p>
            </div>
            <div className="bg-black/30 rounded p-2 text-center">
              <p
                className={`font-mono text-lg ${fps >= 50 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400'}`}
              >
                {fps}
              </p>
              <p className="text-amber-200/50 text-xs">FPS</p>
            </div>
          </div>
          {fan.level > 0 && (
            <div className="mt-2 bg-black/30 rounded p-2">
              <p className="text-amber-200/50 text-xs">风速: {fanConfig.speed}°/s</p>
              <p className="text-amber-200/50 text-xs">摆幅: {fanConfig.amplitude}°</p>
              <p className="text-amber-200/50 text-xs">加速: {fanConfig.acceleration}x</p>
            </div>
          )}
        </div>

        <div className="pt-2">
          <p className="text-amber-400/50 text-xs text-center">
            <Sparkles className="w-3 h-3 inline mr-1" />
            点击炉盖切换香料
            <br />
            拖拽蒲扇调整方向
          </p>
        </div>
      </motion.div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-10">
        <motion.div
          className="w-full"
          style={{
            backgroundColor: 'rgba(26, 26, 26, 0.9)',
            backdropFilter: 'blur(4px)',
            borderTop: '1px solid rgba(212, 175, 55, 0.3)',
          }}
        >
          <div
            className="h-[60px] flex items-center justify-between px-4 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-3">
              <Flame className="w-5 h-5 text-orange-400" />
              <div>
                <p className="text-amber-100 text-sm font-medium">{INCENSE_NAMES[incenseType]}</p>
                <p className="text-amber-400/70 text-xs">{FAN_LEVEL_NAMES[fan.level]}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-amber-300 font-mono text-sm">{particleCount} 粒子</p>
                <p
                  className={`font-mono text-xs ${fps >= 50 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400'}`}
                >
                  {fps} FPS
                </p>
              </div>
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-amber-400" />
              ) : (
                <ChevronUp className="w-5 h-5 text-amber-400" />
              )}
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden px-4 pb-4"
              >
                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex justify-between">
                    <span className="text-amber-200/70 text-sm">扇风角度</span>
                    <span className="text-amber-100 font-mono">{fan.angle.toFixed(0)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-200/70 text-sm">左门</span>
                    <span
                      className={`text-sm ${doorWindow.leftDoor ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {doorWindow.leftDoor ? '开启' : '关闭'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-200/70 text-sm">后窗</span>
                    <span
                      className={`text-sm ${doorWindow.backWindow ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {doorWindow.backWindow ? '开启' : '关闭'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  )
}

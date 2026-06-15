import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import FermentationVat from './components/FermentationVat'
import FinishedJarCard from './components/FinishedJarCard'
import {
  FermentationVat as FermentationVatType,
  FinishedJar,
  BrewingLog,
  MaterialType,
  materialNames,
  loadVats,
  saveVats,
  loadJars,
  saveJars,
  loadLogs,
  saveLogs,
  createVat,
  updateVatProgress,
  isVatComplete,
  convertToJar,
  formatTime,
  formatDate,
} from './utils/brewingLogic'

export default function App() {
  const [vats, setVats] = useState<FermentationVatType[]>([])
  const [jars, setJars] = useState<FinishedJar[]>([])
  const [logs, setLogs] = useState<BrewingLog[]>([])
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType>('gaoliang')
  const [isSteaming, setIsSteaming] = useState(false)
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewJar, setPreviewJar] = useState<FinishedJar | null>(null)

  useEffect(() => {
    setVats(loadVats())
    setJars(loadJars())
    setLogs(loadLogs())
  }, [])

  useEffect(() => {
    saveVats(vats)
  }, [vats])

  useEffect(() => {
    saveJars(jars)
  }, [jars])

  useEffect(() => {
    saveLogs(logs)
  }, [logs])

  useEffect(() => {
    const interval = setInterval(() => {
      setVats((prevVats) => {
        const updatedVats = prevVats.map(updateVatProgress)
        const completedVats = updatedVats.filter(isVatComplete)
        const remainingVats = updatedVats.filter((vat) => !isVatComplete(vat))

        if (completedVats.length > 0) {
          const newJars: FinishedJar[] = []
          const newLogs: BrewingLog[] = []
          completedVats.forEach((vat) => {
            const { jar, log } = convertToJar(vat)
            newJars.push(jar)
            newLogs.push(log)
          })
          setJars((prev) => [...newJars, ...prev])
          setLogs((prev) => [...newLogs, ...prev])
        }

        return remainingVats
      })
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const handleSteam = useCallback(() => {
    if (isSteaming) return
    setIsSteaming(true)

    setTimeout(() => {
      const newVat = createVat(selectedMaterial)
      setVats((prev) => [...prev, newVat])
      setIsSteaming(false)
    }, 3000)
  }, [selectedMaterial, isSteaming])

  const handleStir = useCallback((updatedVat: FermentationVatType) => {
    setVats((prev) => {
      const newVats = prev.map((vat) =>
        vat.id === updatedVat.id ? updatedVat : vat
      )

      if (isVatComplete(updatedVat)) {
        const { jar, log } = convertToJar(updatedVat)
        setJars((prevJars) => [jar, ...prevJars])
        setLogs((prevLogs) => [log, ...prevLogs])
        return newVats.filter((vat) => vat.id !== updatedVat.id)
      }

      return newVats
    })
  }, [])

  const sortedLogs = [...logs].sort((a, b) => b.completedAt - a.completedAt)
  const sortedJars = [...jars].sort((a, b) => b.completedAt - a.completedAt)

  return (
    <div
      className="min-h-screen p-4 md:p-6"
      style={{ backgroundColor: '#c2a571' }}
    >
      <motion.h1
        className="text-3xl md:text-4xl font-bold text-center mb-6 text-[#5d4037]"
        style={{ fontFamily: '"Liu Jian Mao Cao", cursive' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        北魏酿醋工坊
      </motion.h1>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            className="bg-[#d4a574] bg-opacity-40 rounded-xl p-4 md:p-6 border-2 border-[#5d4037]"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2
              className="text-xl md:text-2xl font-bold text-[#5d4037] mb-4 flex items-center gap-2"
              style={{ fontFamily: '"Liu Jian Mao Cao", cursive' }}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <ellipse cx="14" cy="25" rx="10" ry="2" fill="#5d4037" opacity="0.3" />
                <path d="M4 10 Q2 18 6 24 L22 24 Q26 18 24 10 Q14 7 4 10" fill="#8b4513" stroke="#5d4037" strokeWidth="1.5" />
                <ellipse cx="14" cy="10" rx="10" ry="3" fill="#a0522d" stroke="#5d4037" strokeWidth="1.5" />
              </svg>
              发酵缸区
            </h2>

            {vats.length === 0 ? (
              <div className="text-center py-12 text-[#5d4037] opacity-60">
                <p className="text-lg">暂无发酵中的醋胚</p>
                <p className="text-sm mt-2">选择原料并点击蒸粮开始酿制</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                {vats.map((vat) => (
                  <FermentationVat
                    key={vat.id}
                    vat={vat}
                    onStir={handleStir}
                  />
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            className="bg-[#d4a574] bg-opacity-40 rounded-xl p-4 md:p-6 border-2 border-[#5d4037]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2
              className="text-xl md:text-2xl font-bold text-[#5d4037] mb-4 flex items-center gap-2"
              style={{ fontFamily: '"Liu Jian Mao Cao", cursive' }}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <ellipse cx="14" cy="25" rx="10" ry="2" fill="#5d4037" opacity="0.3" />
                <path d="M5 8 Q3 16 6 23 L22 23 Q25 16 23 8 Q14 5 5 8" fill="#5d4037" stroke="#3d2314" strokeWidth="1.5" />
                <ellipse cx="14" cy="8" rx="9" ry="2.5" fill="#8b4513" stroke="#3d2314" strokeWidth="1.5" />
              </svg>
              工作台
            </h2>

            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
              <div className="flex-1">
                <label className="block text-sm font-bold text-[#5d4037] mb-2">
                  选择原料
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['gaoliang', 'xiaomi', 'nuomi'] as MaterialType[]).map(
                    (material) => (
                      <motion.button
                        key={material}
                        className={`py-3 px-4 rounded-lg font-bold transition-all ${
                          selectedMaterial === material
                            ? 'bg-[#8b4513] text-white shadow-lg'
                            : 'bg-[#faf0e0] text-[#5d4037] border-2 border-[#8b4513]'
                        }`}
                        onClick={() => setSelectedMaterial(material)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 17,
                          duration: 0.3,
                        }}
                      >
                        {materialNames[material]}
                      </motion.button>
                    )
                  )}
                </div>
              </div>

              <div className="relative">
                <motion.button
                  className="w-full md:w-auto bg-[#5d4037] text-white py-4 px-8 rounded-xl font-bold text-lg relative overflow-hidden"
                  onClick={handleSteam}
                  whileHover={{ scale: isSteaming ? 1 : 1.05 }}
                  whileTap={{ scale: isSteaming ? 1 : 0.95 }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 17,
                    duration: 0.3,
                  }}
                  disabled={isSteaming}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <ellipse cx="12" cy="21" rx="8" ry="1.5" fill="#8b4513" opacity="0.3" />
                      <path d="M4 7 Q2 14 5 20 L19 20 Q22 14 20 7 Q12 4 4 7" fill="#8b4513" stroke="#5d4037" strokeWidth="1.5" />
                      <ellipse cx="12" cy="7" rx="8" ry="2" fill="#a0522d" stroke="#5d4037" strokeWidth="1.5" />
                    </svg>
                    {isSteaming ? '蒸煮中...' : '蒸粮'}
                  </div>

                  <AnimatePresence>
                    {isSteaming && (
                      <>
                        <motion.div
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-24 rounded-full pointer-events-none"
                          style={{
                            background:
                              'radial-gradient(ellipse at center bottom, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 40%, transparent 70%)',
                          }}
                          initial={{ opacity: 0, y: 0, scale: 0.8 }}
                          animate={{
                            opacity: [0, 0.8, 0],
                            y: -80,
                            scale: [0.8, 1.5, 2],
                          }}
                          exit={{ opacity: 0 }}
                          transition={{
                            duration: 3,
                            ease: 'easeOut',
                          }}
                        />
                        <motion.div
                          className="absolute bottom-0 left-1/3 -translate-x-1/2 w-12 h-20 rounded-full pointer-events-none"
                          style={{
                            background:
                              'radial-gradient(ellipse at center bottom, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 40%, transparent 70%)',
                          }}
                          initial={{ opacity: 0, y: 0, scale: 0.8 }}
                          animate={{
                            opacity: [0, 0.6, 0],
                            y: -60,
                            scale: [0.8, 1.3, 1.8],
                          }}
                          exit={{ opacity: 0 }}
                          transition={{
                            duration: 2.5,
                            ease: 'easeOut',
                            delay: 0.3,
                          }}
                        />
                        <motion.div
                          className="absolute bottom-0 left-2/3 -translate-x-1/2 w-10 h-16 rounded-full pointer-events-none"
                          style={{
                            background:
                              'radial-gradient(ellipse at center bottom, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.35) 40%, transparent 70%)',
                          }}
                          initial={{ opacity: 0, y: 0, scale: 0.8 }}
                          animate={{
                            opacity: [0, 0.7, 0],
                            y: -70,
                            scale: [0.8, 1.4, 1.9],
                          }}
                          exit={{ opacity: 0 }}
                          transition={{
                            duration: 2.8,
                            ease: 'easeOut',
                            delay: 0.6,
                          }}
                        />
                      </>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-[#d4a574] bg-opacity-40 rounded-xl p-4 md:p-6 border-2 border-[#5d4037]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <h2
              className="text-xl md:text-2xl font-bold text-[#5d4037] mb-4 flex items-center gap-2"
              style={{ fontFamily: '"Liu Jian Mao Cao", cursive' }}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="3" y="4" width="22" height="20" rx="2" fill="#faf0e0" stroke="#8b4513" strokeWidth="1.5" />
                <line x1="7" y1="9" x2="21" y2="9" stroke="#5d4037" strokeWidth="1" />
                <line x1="7" y1="13" x2="21" y2="13" stroke="#5d4037" strokeWidth="1" />
                <line x1="7" y1="17" x2="17" y2="17" stroke="#5d4037" strokeWidth="1" />
              </svg>
              酿制日志
            </h2>

            {sortedLogs.length === 0 ? (
              <div className="text-center py-8 text-[#5d4037] opacity-60">
                <p>暂无酿制记录</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {sortedLogs.map((log) => (
                  <motion.div
                    key={log.id}
                    className="bg-[#faf0e0] rounded-lg border-2 border-[#8b4513] overflow-hidden"
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className="p-3 flex justify-between items-center cursor-pointer"
                      onClick={() =>
                        setExpandedLogId(
                          expandedLogId === log.id ? null : log.id
                        )
                      }
                    >
                      <div>
                        <span
                          className="font-bold text-[#8b4513]"
                          style={{
                            fontFamily: '"Liu Jian Mao Cao", cursive',
                            fontSize: '18px',
                          }}
                        >
                          {log.jarNumber}
                        </span>
                        <span className="ml-3 text-sm text-[#5d4037]">
                          {materialNames[log.material]} · 酸度 {log.finalAcidity.toFixed(1)}°
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#5d4037]">
                          {formatDate(log.completedAt)}
                        </span>
                        <motion.span
                          animate={{
                            rotate: expandedLogId === log.id ? 180 : 0,
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          ▼
                        </motion.span>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedLogId === log.id && (
                        <motion.div
                          className="px-3 pb-3 border-t border-[#8b4513] border-opacity-30"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="pt-3 space-y-2 text-sm text-[#5d4037]">
                            <p>
                              <strong>开始时间：</strong>
                              {formatTime(log.startTime)}
                            </p>
                            <p>
                              <strong>完成时间：</strong>
                              {formatTime(log.completedAt)}
                            </p>
                            <p>
                              <strong>翻拌次数：</strong>
                              {log.stirTimes.length} 次
                            </p>
                            <p className="font-bold mt-3 mb-2">翻拌时间线：</p>
                            <div className="bg-[#c2a571] bg-opacity-30 rounded p-3 max-h-40 overflow-y-auto space-y-1">
                              {log.stirTimes.length === 0 ? (
                                <p className="text-xs opacity-60">无翻拌记录</p>
                              ) : (
                                log.stirTimes.map((time, index) => (
                                  <p key={index} className="text-xs">
                                    第 {index + 1} 次：{formatTime(time)}
                                  </p>
                                ))
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <motion.div
            className="bg-[#d4a574] bg-opacity-40 rounded-xl p-4 md:p-6 border-2 border-[#5d4037]"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h2
              className="text-xl md:text-2xl font-bold text-[#5d4037] mb-4 flex items-center gap-2"
              style={{ fontFamily: '"Liu Jian Mao Cao", cursive' }}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <ellipse cx="14" cy="26" rx="8" ry="1.5" fill="#5d4037" opacity="0.3" />
                <path d="M6 6 Q4 14 7 25 L21 25 Q24 14 22 6 Q14 3 6 6" fill="#8b4513" stroke="#5d4037" strokeWidth="1.5" />
                <ellipse cx="14" cy="6" rx="8" ry="2" fill="#a0522d" stroke="#5d4037" strokeWidth="1.5" />
                <path d="M8 6 Q8 2 14 2 Q20 2 20 6" fill="none" stroke="#5d4037" strokeWidth="1.5" />
              </svg>
              陈酿醋坛
            </h2>

            {sortedJars.length === 0 ? (
              <div className="text-center py-12 text-[#5d4037] opacity-60">
                <p className="text-lg">暂无陈酿完成的醋坛</p>
                <p className="text-sm mt-2">发酵完成后自动转入陈酿</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 max-h-[600px] overflow-y-auto pr-2">
                {sortedJars.map((jar) => (
                  <FinishedJarCard key={jar.id} jar={jar} />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showPreview && previewJar && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              className="bg-[#faf0e0] rounded-lg p-4 border-4 border-[#8b4513]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                className="text-xl font-bold text-[#5d4037] mb-3 text-center"
                style={{ fontFamily: '"Liu Jian Mao Cao", cursive' }}
              >
                醋帖预览
              </h3>
              <canvas
                id="sticker-preview"
                width="400"
                height="600"
                className="rounded border-2 border-[#8b4513]"
              />
              <motion.button
                className="w-full mt-4 bg-[#5d4037] text-white py-3 rounded-lg font-bold"
                onClick={() => setShowPreview(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 17,
                  duration: 0.3,
                }}
              >
                关闭
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 767px) {
          button {
            min-height: 48px;
          }
        }
        * {
          -webkit-tap-highlight-color: transparent;
        }
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(139, 69, 19, 0.1);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(139, 69, 19, 0.4);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 69, 19, 0.6);
        }
      `}</style>
    </div>
  )
}

import { useRef, useEffect, useState } from 'react'
import { useAppStore } from './store'
import { voxelizeModel } from './voxelEngine'
import { ColorMode } from './types'

export default function UIControls() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const visibleLayerCount = useAppStore((s) => s.visibleLayerCount)
  const maxLayers = useAppStore((s) => s.maxLayers)
  const colorMode = useAppStore((s) => s.colorMode)
  const monochromeColor = useAppStore((s) => s.monochromeColor)
  const setVisibleLayerCount = useAppStore((s) => s.setVisibleLayerCount)
  const setColorMode = useAppStore((s) => s.setColorMode)
  const setMonochromeColor = useAppStore((s) => s.setMonochromeColor)
  const setIsProcessing = useAppStore((s) => s.setIsProcessing)
  const setVoxelizationResult = useAppStore((s) => s.setVoxelizationResult)
  const setProcessingProgress = useAppStore((s) => s.setProcessingProgress)
  const reset = useAppStore((s) => s.reset)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 900)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleFileSelect = async (file: File) => {
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.obj') && !fileName.endsWith('.gltf') && !fileName.endsWith('.glb')) {
      alert('仅支持 .obj, .gltf, .glb 格式的文件')
      return
    }

    try {
      reset()
      setIsProcessing(true)
      setProcessingProgress(0)

      const result = await voxelizeModel(file, (progress) => {
        setProcessingProgress(progress)
      })

      setVoxelizationResult(result)
    } catch (error) {
      console.error('Voxelization error:', error)
      alert(`体素化失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const colorModes: Array<{ id: ColorMode; label: string; icon: JSX.Element }> = [
    {
      id: 'original',
      label: '原色模式',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M12 2a10 10 0 010 20V12h10A10 10 0 0012 2z" fill="#FF6B6B" />
          <path d="M22 12A10 10 0 0012 2v10h10z" fill="#4ECDC4" opacity="0.8" />
        </svg>
      ),
    },
    {
      id: 'monochrome',
      label: '单色模式',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.3" />
          <rect x="7" y="7" width="10" height="10" rx="1" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: 'gradient',
      label: '渐变模式',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="gradIcon" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#1E3A5F" />
              <stop offset="100%" stopColor="#FFB74D" />
            </linearGradient>
          </defs>
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" fill="url(#gradIcon)" />
        </svg>
      ),
    },
  ]

  const panelStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed' as const,
        bottom: '20px',
        left: '20px',
        right: '20px',
        zIndex: 50,
      }
    : {
        position: 'fixed' as const,
        top: '20px',
        right: '20px',
        zIndex: 50,
        width: '340px',
      }

  return (
    <>
      <div
        style={{
          ...panelStyle,
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'column',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          gap: isMobile ? '12px' : '16px',
        }}>
          <div style={{ flex: isMobile ? '1 1 100%' : 'none' }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '8px',
                background: isDragging ? '#5BA3FF' : '#3A8DFF',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: 'none',
                userSelect: 'none',
              }}
              onMouseEnter={(e) => {
                if (!isDragging) (e.currentTarget as HTMLElement).style.background = '#5BA3FF'
              }}
              onMouseLeave={(e) => {
                if (!isDragging) (e.currentTarget as HTMLElement).style.background = '#3A8DFF'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              上传模型文件
            </div>
            <div style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.5)',
              marginTop: '6px',
              textAlign: 'center',
            }}>
              支持 .obj / .gltf / .glb
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".obj,.gltf,.glb"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />

          <div style={{
            flex: isMobile ? '1 1 100%' : 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: '13px',
                fontWeight: 500,
              }}>
                层数控制
              </span>
              <span style={{
                color: '#3A8DFF',
                fontSize: '13px',
                fontFamily: 'monospace',
                fontWeight: 600,
              }}>
                {visibleLayerCount} / {maxLayers}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={maxLayers || 1}
              step={1}
              value={visibleLayerCount}
              onChange={(e) => setVisibleLayerCount(parseInt(e.target.value, 10))}
              disabled={maxLayers === 0}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: maxLayers === 0 ? 'rgba(255,255,255,0.1)' : `linear-gradient(to right, #3A8DFF 0%, #3A8DFF ${(visibleLayerCount / (maxLayers || 1)) * 100}%, rgba(255,255,255,0.1) ${(visibleLayerCount / (maxLayers || 1)) * 100}%, rgba(255,255,255,0.1) 100%)`,
                appearance: 'none' as const,
                cursor: maxLayers === 0 ? 'not-allowed' : 'pointer',
                outline: 'none',
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '8px',
            }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                ↓ 键:减少一层
              </span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                ↑ 键:增加一层
              </span>
            </div>
          </div>

          {colorMode === 'monochrome' && (
            <div style={{
              flex: isMobile ? '1 1 100%' : 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              <span style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: '13px',
                fontWeight: 500,
              }}>
                自定义颜色
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  border: '2px solid rgba(255,255,255,0.2)',
                  background: monochromeColor,
                  boxShadow: `0 0 20px ${monochromeColor}66`,
                }} />
                <input
                  type="color"
                  value={monochromeColor}
                  onChange={(e) => setMonochromeColor(e.target.value)}
                  style={{
                    width: '100%',
                    height: '36px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: isMobile ? '50%' : '20px',
        transform: isMobile ? 'translateX(50%)' : 'none',
        zIndex: 50,
        display: 'flex',
        gap: '12px',
        padding: isMobile ? '12px' : 0,
        ...(isMobile ? {
          position: 'fixed' as const,
          bottom: '140px',
          left: '50%',
          right: 'auto',
          transform: 'translateX(-50%)',
        } : {}),
      }}>
        {colorModes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setColorMode(mode.id)}
            title={mode.label}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: colorMode === mode.id
                ? '2px solid #3A8DFF'
                : '2px solid rgba(255,255,255,0.2)',
              background: colorMode === mode.id
                ? 'rgba(58,141,255,0.2)'
                : 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(8px)',
              color: colorMode === mode.id ? '#3A8DFF' : 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              animation: colorMode === mode.id ? 'glowPulse 2s ease-in-out infinite' : 'none',
              boxShadow: colorMode === mode.id
                ? '0 0 20px rgba(58,141,255,0.5), inset 0 0 10px rgba(58,141,255,0.2)'
                : 'none',
            }}
          >
            {mode.icon}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes glowPulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(58,141,255,0.5), inset 0 0 10px rgba(58,141,255,0.2);
          }
          50% {
            box-shadow: 0 0 30px rgba(58,141,255,0.8), inset 0 0 15px rgba(58,141,255,0.4);
          }
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 2px solid #3A8DFF;
        }

        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 2px solid #3A8DFF;
        }

        input[type="color"] {
          -webkit-appearance: none;
          padding: 0;
        }
        input[type="color"]::-webkit-color-swatch-wrapper {
          padding: 4px;
        }
        input[type="color"]::-webkit-color-swatch {
          border: none;
          border-radius: 6px;
        }
      `}</style>
    </>
  )
}

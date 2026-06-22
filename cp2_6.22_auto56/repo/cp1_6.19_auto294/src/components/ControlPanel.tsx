import { motion } from 'framer-motion'
import {
  useStore,
  FILTER_PRESETS,
  type FilterType,
  type WatermarkPosition,
} from '@/store'

const FILTER_KEYS = Object.keys(FILTER_PRESETS) as Array<
  keyof typeof FILTER_PRESETS
>

const FILTER_COLORS: Record<FilterType, string> = {
  none: '#8892B0',
  vintage: '#D4A574',
  coolGray: '#7B8FA1',
  vibrant: '#E94560',
  japanese: '#A8D8EA',
  monochrome: '#C0C0C0',
}

const POSITION_OPTIONS: { value: WatermarkPosition; label: string; icon: string }[] = [
  { value: 'topLeft', label: '左上', icon: '↖' },
  { value: 'topRight', label: '右上', icon: '↗' },
  { value: 'center', label: '居中', icon: '●' },
  { value: 'bottomLeft', label: '左下', icon: '↙' },
  { value: 'bottomRight', label: '右下', icon: '↘' },
]

const SIZE_OPTIONS: { value: 16 | 24 | 32; label: string }[] = [
  { value: 16, label: '16px 小' },
  { value: 24, label: '24px 中' },
  { value: 32, label: '32px 大' },
]

const SectionTitle = ({ children, icon }: { children: React.ReactNode; icon: string }) => (
  <div
    style={{
      fontSize: 13,
      fontWeight: 600,
      color: '#EAEAEA',
      marginBottom: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    }}
  >
    <span style={{ fontSize: 15 }}>{icon}</span>
    {children}
  </div>
)

export default function ControlPanel() {
  const {
    photos,
    applyFilter,
    watermarkText,
    watermarkSize,
    watermarkPosition,
    isWatermarkVisible,
    isExporting,
    updateWatermark,
    toggleWatermark,
    exportAll,
  } = useStore()

  const hasPhotos = photos.length > 0

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      <div
        style={{
          padding: 16,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <SectionTitle icon="🎨">调色滤镜</SectionTitle>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
          }}
        >
          {FILTER_KEYS.map((key) => {
            const preset = FILTER_PRESETS[key]
            return (
              <motion.button
                key={key}
                whileTap={{ scale: 1.15 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17, duration: 0.15 }}
                onClick={() => hasPhotos && applyFilter(key)}
                disabled={!hasPhotos}
                style={{
                  padding: '10px 8px',
                  borderRadius: 6,
                  backgroundColor: hasPhotos ? '#E94560' : '#16213E',
                  color: hasPhotos ? '#fff' : '#555',
                  fontSize: 12,
                  fontWeight: 500,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'background-color 0.15s ease',
                  cursor: hasPhotos ? 'pointer' : 'not-allowed',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  if (hasPhotos) e.currentTarget.style.backgroundColor = '#FF6B6B'
                }}
                onMouseLeave={(e) => {
                  if (hasPhotos) e.currentTarget.style.backgroundColor = '#E94560'
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: 24,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${FILTER_COLORS[key]}40, ${FILTER_COLORS[key]}80)`,
                    filter: preset.css,
                  }}
                />
                <span>{preset.label}</span>
              </motion.button>
            )
          })}
        </div>
        {hasPhotos && (
          <div
            style={{
              marginTop: 10,
              fontSize: 11,
              color: '#8892B0',
              textAlign: 'center',
            }}
          >
            💡 应用到全部 · 缩略图右键可单独撤销
          </div>
        )}
      </div>

      <div
        style={{
          padding: 16,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <SectionTitle icon="💧">水印设置</SectionTitle>

        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: 'block',
              fontSize: 11,
              color: '#8892B0',
              marginBottom: 6,
            }}
          >
            水印文字
          </label>
          <input
            type="text"
            value={watermarkText}
            onChange={(e) => updateWatermark({ text: e.target.value })}
            placeholder="输入水印文字..."
            maxLength={30}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: '#16213E',
              color: '#EAEAEA',
              fontSize: 13,
              transition: 'border-color 0.15s ease',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#E94560')}
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')
            }
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: 'block',
              fontSize: 11,
              color: '#8892B0',
              marginBottom: 6,
            }}
          >
            字号大小
          </label>
          <select
            value={watermarkSize}
            onChange={(e) =>
              updateWatermark({ size: Number(e.target.value) as 16 | 24 | 32 })
            }
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: '#16213E',
              color: '#EAEAEA',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {SIZE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: 'block',
              fontSize: 11,
              color: '#8892B0',
              marginBottom: 6,
            }}
          >
            水印位置
          </label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 4,
            }}
          >
            {POSITION_OPTIONS.map((opt) => (
              <motion.button
                key={opt.value}
                whileTap={{ scale: 0.92 }}
                onClick={() => updateWatermark({ position: opt.value })}
                title={opt.label}
                style={{
                  aspectRatio: '1',
                  borderRadius: 4,
                  border:
                    watermarkPosition === opt.value
                      ? '2px solid #E94560'
                      : '1px solid rgba(255,255,255,0.1)',
                  backgroundColor:
                    watermarkPosition === opt.value
                      ? 'rgba(233,69,96,0.15)'
                      : '#16213E',
                  color:
                    watermarkPosition === opt.value ? '#E94560' : '#8892B0',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                {opt.icon}
              </motion.button>
            ))}
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={toggleWatermark}
          disabled={!watermarkText.trim()}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 6,
            backgroundColor:
              watermarkText.trim() && isWatermarkVisible
                ? '#16a085'
                : watermarkText.trim()
                ? '#16213E'
                : '#0a1929',
            border: watermarkText.trim()
              ? `1px solid ${isWatermarkVisible ? '#16a085' : 'rgba(255,255,255,0.15)'}`
              : '1px solid rgba(255,255,255,0.05)',
            color: watermarkText.trim() ? '#fff' : '#555',
            fontSize: 13,
            fontWeight: 500,
            cursor: watermarkText.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease',
          }}
        >
          {isWatermarkVisible ? '✓ 水印已显示（点击隐藏）' : '生成水印预览'}
        </motion.button>
      </div>

      <div style={{ padding: 16, flex: 1 }}>
        <SectionTitle icon="📦">导出</SectionTitle>

        <div
          style={{
            padding: 12,
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderRadius: 6,
            marginBottom: 12,
            fontSize: 11,
            color: '#8892B0',
            lineHeight: 1.7,
          }}
        >
          <div style={{ marginBottom: 4, color: '#EAEAEA', fontWeight: 500 }}>
            导出将包含：
          </div>
          <div>• {photos.length} 张已调色/水印的照片</div>
          <div>• 1 张组图拼接海报 (12:5)</div>
          <div>• 按编号顺序打包为 ZIP</div>
        </div>

        <motion.button
          whileTap={!isExporting && hasPhotos ? { scale: 0.97 } : {}}
          onClick={() => !isExporting && hasPhotos && exportAll()}
          disabled={!hasPhotos || isExporting}
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: 8,
            backgroundColor:
              hasPhotos && !isExporting ? '#E94560' : '#16213E',
            color: hasPhotos && !isExporting ? '#fff' : '#555',
            fontSize: 15,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            cursor:
              hasPhotos && !isExporting ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.15s ease',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            if (hasPhotos && !isExporting)
              e.currentTarget.style.backgroundColor = '#FF6B6B'
          }}
          onMouseLeave={(e) => {
            if (hasPhotos && !isExporting)
              e.currentTarget.style.backgroundColor = '#E94560'
          }}
        >
          {isExporting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  repeat: Infinity,
                  duration: 1,
                  ease: 'linear',
                }}
                style={{
                  width: 18,
                  height: 18,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                }}
              />
              正在导出...
            </>
          ) : (
            <>
              <span style={{ fontSize: 18 }}>⬇</span>
              导出全部 (ZIP)
            </>
          )}
        </motion.button>

        {!hasPhotos && (
          <div
            style={{
              marginTop: 10,
              fontSize: 11,
              color: '#8892B0',
              textAlign: 'center',
            }}
          >
            请先上传照片
          </div>
        )}
      </div>
    </div>
  )
}

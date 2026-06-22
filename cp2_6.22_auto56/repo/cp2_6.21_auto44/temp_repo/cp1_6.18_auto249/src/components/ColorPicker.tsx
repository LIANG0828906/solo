import { useCallback, useMemo, useRef } from 'react'
import { useColorStore } from '../store/colorStore'

const WHEEL_SIZE = 220
const WHEEL_RADIUS = WHEEL_SIZE / 2

const QUICK_COLORS = [
  '#B39DDB',
  '#A5D6A7',
  '#FFCC80',
  '#F8BBD0',
  '#90CAF9',
  '#FFAB91',
  '#B0BEC5',
  '#CE93D8',
  '#81C784',
  '#FFD54F',
  '#F48FB1',
  '#64B5F6',
]

const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0

  if (h >= 0 && h < 60) { r = c; g = x; b = 0 }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0 }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c }
  else if (h >= 300 && h < 360) { r = c; g = 0; b = x }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ]
}

const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase()
}

const getColorFromWheel = (cx: number, cy: number): string => {
  const dx = cx - WHEEL_RADIUS
  const dy = cy - WHEEL_RADIUS
  const distance = Math.sqrt(dx * dx + dy * dy) / WHEEL_RADIUS

  if (distance > 1) return ''

  let angle = Math.atan2(dy, dx) * (180 / Math.PI)
  if (angle < 0) angle += 360

  const saturation = distance
  const lightness = 0.55

  const [r, g, b] = hslToRgb(angle, saturation, lightness)
  return rgbToHex(r, g, b)
}

export default function ColorPicker() {
  const { selectedColor, setSelectedColor, selectedDate, openModal } = useColorStore()
  const svgRef = useRef<SVGSVGElement>(null)
  const previewKey = useRef(0)
  previewKey.current++

  const gradients = useMemo(() => {
    const stops = []
    for (let i = 0; i <= 12; i++) {
      const hue = (i / 12) * 360
      const [r, g, b] = hslToRgb(hue, 1, 0.55)
      stops.push({
        offset: `${(i / 12) * 100}%`,
        color: `rgb(${r},${g},${b})`,
      })
    }
    return stops
  }, [])

  const conicGradient = useMemo(() => {
    const colors = gradients.map(s => `${s.color} ${s.offset}`).join(', ')
    return `conic-gradient(from 0deg, ${colors})`
  }, [gradients])

  const handleWheelClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const scaleX = WHEEL_SIZE / rect.width
    const scaleY = WHEEL_SIZE / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    const color = getColorFromWheel(x, y)
    if (color) {
      setSelectedColor(color)
      previewKey.current = 0
    }
  }, [setSelectedColor])

  const handleWheelMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.buttons !== 1) return
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const scaleX = WHEEL_SIZE / rect.width
    const scaleY = WHEEL_SIZE / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    const color = getColorFromWheel(x, y)
    if (color) {
      setSelectedColor(color)
    }
  }, [setSelectedColor])

  return (
    <div className="color-picker-section">
      <h2 className="section-title">
        <span>🎨</span>
        <span>选择今日心情色彩</span>
      </h2>

      <div className="color-wheel-wrapper">
        <svg
          ref={svgRef}
          className="color-wheel"
          width={WHEEL_SIZE}
          height={WHEEL_SIZE}
          viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
          onClick={handleWheelClick}
          onMouseMove={handleWheelMove}
        >
          <defs>
            <radialGradient id="wheelFade" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <clipPath id="wheelClip">
              <circle cx={WHEEL_RADIUS} cy={WHEEL_RADIUS} r={WHEEL_RADIUS - 1} />
            </clipPath>
          </defs>

          <foreignObject
            x="0"
            y="0"
            width={WHEEL_SIZE}
            height={WHEEL_SIZE}
            clipPath="url(#wheelClip)"
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                background: conicGradient,
                borderRadius: '50%',
              }}
            />
          </foreignObject>

          <circle
            cx={WHEEL_RADIUS}
            cy={WHEEL_RADIUS}
            r={WHEEL_RADIUS - 1}
            fill="url(#wheelFade)"
          />
        </svg>

        <div className="color-preview-area">
          <div
            key={previewKey.current}
            className="selected-color-preview"
            style={{ backgroundColor: selectedColor }}
          />
          <div className="color-hex-value">{selectedColor}</div>
        </div>
      </div>

      <div className="quick-colors">
        {QUICK_COLORS.map(color => (
          <button
            key={color}
            className={`quick-color-btn ${selectedColor === color ? 'active' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => {
              setSelectedColor(color)
              previewKey.current = 0
            }}
            title={color}
          />
        ))}
      </div>

      <button className="btn btn-primary" onClick={openModal} style={{ width: '100%', maxWidth: 320 }}>
        ✍️ 记录 {selectedDate} 的心情
      </button>
    </div>
  )
}

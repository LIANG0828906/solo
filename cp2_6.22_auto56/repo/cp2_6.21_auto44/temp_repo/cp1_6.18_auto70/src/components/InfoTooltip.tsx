import { useStore } from '@/store/useStore'

export default function InfoTooltip() {
  const hoverInfo = useStore((s) => s.hoverInfo)
  const { atom, bond, screenX, screenY } = hoverInfo

  if (!atom && !bond) return null

  const offsetX = 15
  const offsetY = 15
  const left = Math.min(screenX + offsetX, window.innerWidth - 220)
  const top = Math.min(screenY + offsetY, window.innerHeight - 150)

  return (
    <div className="info-tooltip" style={{ left, top }}>
      {atom && (
        <>
          <div className="tooltip-title">
            {atom.symbol} — {atom.type}
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">符号</span>
            <span className="tooltip-value">{atom.symbol}</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">类型</span>
            <span className="tooltip-value">{atom.type}</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">位置</span>
            <span className="tooltip-value">
              ({atom.x.toFixed(2)}, {atom.y.toFixed(2)}, {atom.z.toFixed(2)})
            </span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">半径</span>
            <span className="tooltip-value">{atom.radius.toFixed(2)}</span>
          </div>
        </>
      )}
      {bond && (
        <>
          <div className="tooltip-title">化学键</div>
          <div className="tooltip-row">
            <span className="tooltip-label">类型</span>
            <span className="tooltip-value">
              {bond.bondType === 'single' ? '单键' : bond.bondType === 'double' ? '双键' : '三键'}
            </span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">键长</span>
            <span className="tooltip-value">{bond.length.toFixed(3)} Å</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">键角</span>
            <span className="tooltip-value">{bond.angle.toFixed(1)}°</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">连接</span>
            <span className="tooltip-value">
              {bond.atomAId} ↔ {bond.atomBId}
            </span>
          </div>
        </>
      )}
    </div>
  )
}

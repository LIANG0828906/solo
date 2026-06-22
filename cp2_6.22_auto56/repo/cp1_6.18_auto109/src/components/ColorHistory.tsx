import { useColorStore } from '../stores/colorStore'
import './ColorHistory.css'

export function ColorHistory() {
  const { history, currentColor, setCurrentColor, addToHistory, clearHistory } =
    useColorStore()

  const handleColorClick = (color: string) => {
    setCurrentColor(color)
    addToHistory(color)
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <h4 className="history-title">历史记录</h4>
        {history.length > 0 && (
          <button className="clear-history-btn" onClick={clearHistory}>
            清空
          </button>
        )}
      </div>
      <div className="history-list">
        {history.length === 0 ? (
          <div className="history-empty">暂无历史记录</div>
        ) : (
          history.map((color, index) => (
            <div
              key={`${color}-${index}`}
              className={`history-item ${
                currentColor.toUpperCase() === color.toUpperCase() ? 'active' : ''
              }`}
              onClick={() => handleColorClick(color)}
            >
              <div
                className="history-swatch"
                style={{ backgroundColor: color }}
              />
              <span className="history-hex">{color.toUpperCase()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ColorHistory

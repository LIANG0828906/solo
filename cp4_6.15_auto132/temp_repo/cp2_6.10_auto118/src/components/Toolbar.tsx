import { useStore } from '../store'
import { INK_BUTTONS } from '../types'
import './Toolbar.scss'

export default function Toolbar() {
  const { activeInkType, setActiveInkType } = useStore()

  return (
    <div className="toolbar">
      <div className="toolbar-title">墨色选择</div>
      <div className="ink-buttons">
        {INK_BUTTONS.map(ink => (
          <button
            key={ink.type}
            className={`ink-button ${activeInkType === ink.type ? 'active' : ''}`}
            onClick={() => setActiveInkType(ink.type)}
            title={`${ink.name} - ${ink.color}`}
          >
            <div 
              className="ink-swatch"
              style={{ backgroundColor: ink.color }}
            />
            <div className="ink-info">
              <span className="ink-name">{ink.name}</span>
              <span className="ink-hex">{ink.color}</span>
            </div>
          </button>
        ))}
      </div>
      <div className="toolbar-instructions">
        <p>点击或拖拽画纸滴墨</p>
        <p>滚轮缩放视图</p>
        <p>多滴墨交互融合</p>
      </div>
    </div>
  )
}

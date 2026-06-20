import './InfoPanel/InfoPanel.css'

export default function ControlsHint() {
  return (
    <div className="controls-hint">
      <span className="control-hint-text">
        <span className="control-key">W</span>
        <span className="control-key">A</span>
        <span className="control-key">S</span>
        <span className="control-key">D</span>
        平移
      </span>
      <span className="control-hint-text">
        <span className="control-key">Q</span>
        <span className="control-key">E</span>
        升降
      </span>
      <span className="control-hint-text">
        <span className="control-key">鼠标拖拽</span>
        旋转视角
      </span>
      <span className="control-hint-text">
        <span className="control-key">点击</span>
        查看生物
      </span>
    </div>
  )
}

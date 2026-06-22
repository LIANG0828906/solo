import { useRoomState } from '../domain/roomState';
import RoomCanvas from './RoomCanvas';
import ConfigPanel from './ConfigPanel';
import { getStyleById } from '../domain/roomData';
import './styles.css';

export default function App() {
  const { state } = useRoomState();
  const style = getStyleById(state.currentStyle);

  return (
    <div className="app-container">
      <div className="main-layout">
        <div className="canvas-section">
          <div className="style-keywords">
            {style.keywords.map((keyword, index) => (
              <span key={index} className="keyword-tag">
                {keyword}
              </span>
            ))}
          </div>
          <RoomCanvas />
        </div>
        <div className="config-section">
          <ConfigPanel />
        </div>
      </div>
      <div className="status-bar">
        <span>装饰品总数: {state.decorations.length}</span>
        <span>当前风格: {style.name}</span>
        <span>家具调整次数: {state.furnitureAdjustCount}</span>
      </div>
    </div>
  );
}

import Scene3D from './scene/Scene3D';
import ControlPanel from './controls/ControlPanel';
import SunIndicator from './controls/SunIndicator';
import './App.css';

export default function App() {
  return (
    <div className="app-container">
      <div className="scene-container">
        <Scene3D />
        <SunIndicator />
      </div>
      <div className="panel-container">
        <ControlPanel />
      </div>
    </div>
  );
}

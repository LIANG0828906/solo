import BuildingScene from './views/BuildingScene';
import ControlPanel from './views/ControlPanel';

export default function App() {
  return (
    <div className="app-container">
      <div className="scene-container">
        <BuildingScene />
      </div>
      <ControlPanel />
    </div>
  );
}

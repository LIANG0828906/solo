import GameCanvas from './components/GameCanvas';
import UIPanel from './components/UIPanel';

export default function App() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0A0A0A]">
      <GameCanvas />
      <UIPanel />
    </div>
  );
}

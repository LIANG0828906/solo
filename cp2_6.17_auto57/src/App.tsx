import { GameBoard } from './ui/GameBoard';
import { ScorePanel } from './ui/ScorePanel';

function App() {
  return (
    <div className="w-full h-screen overflow-hidden bg-[#3E2723]">
      <ScorePanel />
      <GameBoard />
    </div>
  );
}

export default App;

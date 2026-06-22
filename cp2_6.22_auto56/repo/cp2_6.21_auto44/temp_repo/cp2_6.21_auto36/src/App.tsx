import GameBoard from './components/GameBoard';
import WinPanel from './components/WinPanel';
import './App.css';

function App() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center py-8 px-4 app-container">
      <div className="w-full max-w-2xl">
        <GameBoard />
        <WinPanel />
      </div>
    </div>
  );
}

export default App;

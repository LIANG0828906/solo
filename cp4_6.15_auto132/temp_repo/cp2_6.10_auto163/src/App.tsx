import BankerArea from './components/BankerArea';
import DiceBoard from './components/DiceBoard';
import BettingPanel from './components/BettingPanel';
import './App.css';

const App = () => {
  return (
    <div className="game-container">
      <div className="game-layout">
        <div className="left-panel">
          <BankerArea />
        </div>
        <div className="center-panel table-felt">
          <div className="table-border">
            <div className="table-inner">
              <DiceBoard />
            </div>
          </div>
        </div>
        <div className="right-panel">
          <BettingPanel />
        </div>
      </div>
    </div>
  );
};

export default App;

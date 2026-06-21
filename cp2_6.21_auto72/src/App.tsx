import { BandStage } from './components/BandStage';
import { ControlPanel } from './components/ControlPanel';
import './styles.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">
          <span className="title-neon">虚拟乐队</span>
          <span className="title-sub">合奏排练室</span>
        </h1>
      </header>
      
      <main className="app-main">
        <BandStage />
      </main>
      
      <footer className="app-footer">
        <ControlPanel />
      </footer>
    </div>
  );
}

export default App;

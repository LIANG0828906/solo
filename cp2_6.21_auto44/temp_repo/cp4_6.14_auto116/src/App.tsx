import ControlPanel from './components/ControlPanel';
import MapContainer from './components/MapContainer';

function App() {
  return (
    <div className="app">
      <ControlPanel />
      <main className="main-content">
        <MapContainer />
      </main>
    </div>
  );
}

export default App;

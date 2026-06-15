import { BrowserRouter, Routes, Route } from 'react-router-dom';
import io from 'socket.io-client';
import Lobby from './pages/Lobby';
import Room from './pages/Room';

const socket = io();

function App() {
  return (
    <BrowserRouter>
      <div style={{ width: '100vw', height: '100vh', backgroundColor: '#1a1a2e', overflow: 'hidden' }}>
        <Routes>
          <Route path="/" element={<Lobby socket={socket} />} />
          <Route path="/room/:code" element={<Room socket={socket} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

import React from 'react';
import ReactDOM from 'react-dom/client';
import { io, Socket } from 'socket.io-client';
import App from './App';
import './styles.css';

const socket: Socket = io({
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => {
  console.log('WebSocket连接已建立:', socket.id);
});

socket.on('disconnect', () => {
  console.log('WebSocket连接已断开');
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App socket={socket} />
  </React.StrictMode>
);

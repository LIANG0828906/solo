import React from 'react';
import { useRoomStore } from '@/store/roomStore';
import { HomePage } from '@/components/HomePage';
import { RoomPage } from '@/components/RoomPage';

const globalStyle: React.CSSProperties = {
  margin: 0,
  padding: 0,
  width: '100%',
  height: '100%',
  overflow: 'hidden',
};

export const App: React.FC = () => {
  const roomId = useRoomStore((s) => s.roomId);

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html, body, #root {
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #0B0E27;
        }
        body {
          font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        button {
          font-family: inherit;
        }
        input {
          font-family: inherit;
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #3A3A5C;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #4A4A6C;
        }
      `}</style>
      <div style={globalStyle}>{roomId ? <RoomPage /> : <HomePage />}</div>
    </>
  );
};

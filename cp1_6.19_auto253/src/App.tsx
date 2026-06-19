import React, { useEffect, useCallback } from 'react';
import { useAppStore } from './store';
import Canvas from './Canvas';
import Timeline from './Timeline';
import GifPreview from './GifPreview';
import {
  getSocket,
  setupSocketHandlers,
  cleanupSocketHandlers,
  emitJoin,
  emitPixelUpdate,
  emitFramesUpdate,
  emitFrameLock
} from './socket';
import { generateRandomColor, generateRandomName } from './utils/frame';
import type { Frame, FrameData, PixelColor, User } from './types';

declare global {
  interface Window {
    socketEmitPixelUpdate?: (frameId: string, x: number, y: number, color: PixelColor) => void;
    socketEmitFramesUpdate?: (frames: Frame[]) => void;
    socketEmitFrameLock?: (frameId: string, userId: string | undefined) => void;
  }
}

const App: React.FC = () => {
  const onlineUsers = useAppStore((s) => s.onlineUsers);
  const setOnlineUsers = useAppStore((s) => s.setOnlineUsers);
  const setFrames = useAppStore((s) => s.setFrames);
  const setCurrentFrame = useAppStore((s) => s.setCurrentFrame);
  const updatePixel = useAppStore((s) => s.updatePixel);
  const setFrameEditor = useAppStore((s) => s.setFrameEditor);
  const replaceFrameData = useAppStore((s) => s.replaceFrameData);
  const localUser = useAppStore((s) => s.localUser);
  const setLocalUser = useAppStore((s) => s.setLocalUser);

  const initLocalUser = useCallback(() => {
    let stored = localStorage.getItem('pixel_user');
    let user: User;
    if (stored) {
      try {
        user = JSON.parse(stored);
      } catch {
        user = {
          id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: generateRandomName(),
          color: generateRandomColor()
        };
      }
    } else {
      user = {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: generateRandomName(),
        color: generateRandomColor()
      };
    }
    localStorage.setItem('pixel_user', JSON.stringify(user));
    setLocalUser(user);
    return user;
  }, [setLocalUser]);

  useEffect(() => {
    const user = initLocalUser();
    const socket = getSocket();

    const handlers = {
      onUserList: (users: User[]) => {
        setOnlineUsers(users);
      },
      onFramesInit: (frames: Frame[], currentFrameId: string) => {
        if (frames && frames.length > 0) {
          setFrames(frames);
          setCurrentFrame(currentFrameId || frames[0].id);
        }
      },
      onFrameUpdate: (frameId: string, x: number, y: number, color: PixelColor) => {
        updatePixel(frameId, x, y, color);
      },
      onFramesUpdate: (frames: Frame[]) => {
        setFrames(frames);
      },
      onFrameLock: (frameId: string, userId: string | undefined) => {
        setFrameEditor(frameId, userId);
      },
      onFrameDataReplace: (frameId: string, data: FrameData) => {
        replaceFrameData(frameId, data);
      }
    };

    setupSocketHandlers(socket, handlers);
    emitJoin(socket, user);

    window.socketEmitPixelUpdate = (frameId, x, y, color) => {
      emitPixelUpdate(socket, frameId, x, y, color);
    };
    window.socketEmitFramesUpdate = (frames) => {
      emitFramesUpdate(socket, frames);
    };
    window.socketEmitFrameLock = (frameId, userId) => {
      emitFrameLock(socket, frameId, userId);
    };

    return () => {
      cleanupSocketHandlers(socket, handlers);
      socket.disconnect();
      delete window.socketEmitPixelUpdate;
      delete window.socketEmitFramesUpdate;
      delete window.socketEmitFrameLock;
    };
  }, [initLocalUser, setOnlineUsers, setFrames, setCurrentFrame, updatePixel, setFrameEditor, replaceFrameData]);

  return (
    <div className="app">
      <div className="top-bar">
        <div className="top-bar-title">🎨 像素动画协作编辑器</div>
        <div className="user-list">
          {onlineUsers.map((u) => (
            <div
              key={u.id}
              className="avatar tooltip"
              style={{ background: u.color }}
              data-name={u.name + (u.id === localUser?.id ? ' (我)' : '')}
              title={u.name}
            >
              {u.name.charAt(0)}
            </div>
          ))}
        </div>
      </div>

      <div className="main-area">
        <Canvas />
        <GifPreview />
      </div>

      <Timeline />
    </div>
  );
};

export default App;

import React, { useReducer, useEffect, useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { RoomManager } from './pages/RoomManager';
import { BookViewer } from './pages/BookViewer';
import { storage } from './utils/storage';
import { syncManager } from './utils/sync';
import { getRandomColor } from './utils/mockBook';
import type { Room, User, Highlight, Message, SyncAction } from './utils/types';

type Action =
  | { type: 'SET_USER_NAME'; payload: string }
  | { type: 'SET_ROOMS'; payload: Room[] }
  | { type: 'SET_USERS'; payload: { roomId: string; users: User[] } }
  | { type: 'ADD_ROOM'; payload: Room }
  | { type: 'SET_CURRENT_ROOM'; payload: Room | null }
  | { type: 'SET_CURRENT_USER'; payload: User | null }
  | { type: 'ADD_HIGHLIGHT'; payload: Highlight }
  | { type: 'UPDATE_HIGHLIGHT'; payload: Highlight }
  | { type: 'SET_HIGHLIGHTS'; payload: Highlight[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'MARK_MESSAGE_RECEIVED'; payload: { messageId: string; userId: string; userName: string } }
  | { type: 'MARK_MESSAGE_READ'; payload: { messageId: string; userId: string; userName: string } }
  | { type: 'SELECT_HIGHLIGHT'; payload: string | null }
  | { type: 'SET_BLINK'; payload: number | null }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'REMOVE_USER'; payload: { userId: string; roomId: string } };

interface CombinedState {
  userName: string;
  currentRoom: Room | null;
  currentUser: User | null;
  rooms: Room[];
  users: User[];
  highlights: Highlight[];
  messages: Message[];
  selectedHighlightId: string | null;
  blinkParagraphIndex: number | null;
  allUsers: Record<string, User[]>;
}

const initialState: CombinedState = {
  userName: '',
  currentRoom: null,
  currentUser: null,
  rooms: [],
  users: [],
  highlights: [],
  messages: [],
  selectedHighlightId: null,
  blinkParagraphIndex: null,
  allUsers: {},
};

function reducer(state: CombinedState, action: Action): CombinedState {
  switch (action.type) {
    case 'SET_USER_NAME':
      return { ...state, userName: action.payload };
    case 'SET_ROOMS':
      return { ...state, rooms: action.payload.sort((a, b) => b.lastActive - a.lastActive) };
    case 'ADD_ROOM':
      return {
        ...state,
        rooms: [action.payload, ...state.rooms.filter((r) => r.id !== action.payload.id)],
      };
    case 'SET_CURRENT_ROOM':
      return {
        ...state,
        currentRoom: action.payload,
        highlights: action.payload ? state.highlights : [],
        messages: action.payload ? state.messages : [],
        users: action.payload ? state.users : [],
      };
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_HIGHLIGHTS':
      return { ...state, highlights: action.payload };
    case 'ADD_HIGHLIGHT': {
      const exists = state.highlights.some((h) => h.id === action.payload.id);
      if (exists) {
        return {
          ...state,
          highlights: state.highlights.map((h) =>
            h.id === action.payload.id ? action.payload : h
          ),
        };
      }
      return { ...state, highlights: [...state.highlights, action.payload] };
    }
    case 'UPDATE_HIGHLIGHT':
      return {
        ...state,
        highlights: state.highlights.map((h) =>
          h.id === action.payload.id ? action.payload : h
        ),
      };
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload.sort((a, b) => a.createdAt - b.createdAt) };
    case 'ADD_MESSAGE': {
      const exists = state.messages.some((m) => m.id === action.payload.id);
      if (exists) return state;
      return { ...state, messages: [...state.messages, action.payload] };
    }
    case 'MARK_MESSAGE_RECEIVED': {
      return {
        ...state,
        messages: state.messages.map((m) => {
          if (m.id !== action.payload.messageId) return m;
          const readBy = m.readBy ? [...m.readBy] : [];
          if (!readBy.includes(action.payload.userId)) {
            readBy.push(action.payload.userId);
          }
          return { ...m, readBy };
        }),
      };
    }
    case 'MARK_MESSAGE_READ': {
      return {
        ...state,
        messages: state.messages.map((m) => {
          if (m.id !== action.payload.messageId) return m;
          const readBy = m.readBy ? [...m.readBy] : [];
          if (!readBy.includes(action.payload.userId)) {
            readBy.push(action.payload.userId);
          }
          return { ...m, readBy };
        }),
      };
    }
    case 'SELECT_HIGHLIGHT':
      return { ...state, selectedHighlightId: action.payload };
    case 'SET_BLINK':
      return { ...state, blinkParagraphIndex: action.payload };
    case 'SET_USERS': {
      const newAllUsers = { ...state.allUsers, [action.payload.roomId]: action.payload.users };
      if (state.currentRoom?.id === action.payload.roomId) {
        return { ...state, users: action.payload.users, allUsers: newAllUsers };
      }
      return { ...state, allUsers: newAllUsers };
    }
    case 'ADD_USER': {
      const roomUsers = state.allUsers[action.payload.roomId] || [];
      const newRoomUsers = [...roomUsers.filter((u) => u.id !== action.payload.id), action.payload];
      const newAllUsers = { ...state.allUsers, [action.payload.roomId]: newRoomUsers };
      if (state.currentRoom?.id === action.payload.roomId) {
        return { ...state, users: newRoomUsers, allUsers: newAllUsers };
      }
      return { ...state, allUsers: newAllUsers };
    }
    case 'REMOVE_USER': {
      const roomUsers = state.allUsers[action.payload.roomId] || [];
      const newRoomUsers = roomUsers.filter((u) => u.id !== action.payload.userId);
      const newAllUsers = { ...state.allUsers, [action.payload.roomId]: newRoomUsers };
      if (state.currentRoom?.id === action.payload.roomId) {
        return { ...state, users: newRoomUsers, allUsers: newAllUsers };
      }
      return { ...state, allUsers: newAllUsers };
    }
    default:
      return state;
  }
}

export const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [initialized, setInitialized] = useState(false);
  const currentUserRef = React.useRef<User | null>(null);

  useEffect(() => {
    currentUserRef.current = state.currentUser;
  }, [state.currentUser]);

  const handleSyncAction = useCallback(async (action: SyncAction) => {
    switch (action.type) {
      case 'user_join': {
        dispatch({ type: 'ADD_USER', payload: action.payload });
        await storage.putUser(action.payload);
        break;
      }
      case 'user_leave': {
        dispatch({ type: 'REMOVE_USER', payload: action.payload });
        break;
      }
      case 'add_highlight': {
        dispatch({ type: 'ADD_HIGHLIGHT', payload: action.payload });
        await storage.putHighlight(action.payload);
        break;
      }
      case 'update_highlight': {
        dispatch({ type: 'UPDATE_HIGHLIGHT', payload: action.payload });
        await storage.putHighlight(action.payload);
        break;
      }
      case 'send_message': {
        dispatch({ type: 'ADD_MESSAGE', payload: action.payload });
        if (action.payload.paragraphIndex != null) {
          dispatch({ type: 'SET_BLINK', payload: action.payload.paragraphIndex });
          setTimeout(() => {
            dispatch({ type: 'SET_BLINK', payload: null });
          }, 300);
        }
        await storage.putMessage(action.payload);

        const user = currentUserRef.current;
        if (user && action.payload.userId !== user.id && action.payload.roomId === user.roomId) {
          // 立即发送已送达确认
          syncManager.broadcast({
            type: 'message_received',
            payload: {
              messageId: action.payload.id,
              userId: user.id,
              roomId: action.payload.roomId,
              userName: user.name,
            },
            timestamp: Date.now(),
          });
          // 5 秒后发送已读确认
          setTimeout(() => {
            const u = currentUserRef.current;
            if (!u) return;
            syncManager.broadcast({
              type: 'message_read',
              payload: {
                messageId: action.payload.id,
                userId: u.id,
                roomId: action.payload.roomId,
                userName: u.name,
              },
              timestamp: Date.now(),
            });
          }, 5000);
        }
        break;
      }
      case 'message_received': {
        dispatch({
          type: 'MARK_MESSAGE_RECEIVED',
          payload: {
            messageId: action.payload.messageId,
            userId: action.payload.userId,
            userName: action.payload.userName,
          },
        });
        break;
      }
      case 'message_read': {
        dispatch({
          type: 'MARK_MESSAGE_READ',
          payload: {
            messageId: action.payload.messageId,
            userId: action.payload.userId,
            userName: action.payload.userName,
          },
        });
        break;
      }
      case 'ping': {
        break;
      }
    }
  }, []);

  useEffect(() => {
    syncManager.init();

    const initData = async () => {
      try {
        const rooms = await storage.getRooms();
        dispatch({ type: 'SET_ROOMS', payload: rooms });

        for (const room of rooms) {
          const roomUsers = await storage.getUsersByRoom(room.id);
          dispatch({ type: 'SET_USERS', payload: { roomId: room.id, users: roomUsers } });
        }
      } catch (e) {
        console.error('Failed to init data', e);
      }
      setInitialized(true);
    };
    initData();

    const unsubscribe = syncManager.subscribe(handleSyncAction);

    return () => {
      unsubscribe();
      syncManager.close();
    };
  }, [handleSyncAction]);

  const handleSetUserName = useCallback(async (name: string) => {
    localStorage.setItem('bookCoReading_userName', name);
    dispatch({ type: 'SET_USER_NAME', payload: name });
  }, []);

  useEffect(() => {
    const savedName = localStorage.getItem('bookCoReading_userName');
    if (savedName) {
      dispatch({ type: 'SET_USER_NAME', payload: savedName });
    }
  }, []);

  const handleCreateRoom = useCallback(async (name: string, bookName: string) => {
    const now = Date.now();
    const room: Room = {
      id: uuidv4(),
      name,
      bookName,
      createdAt: now,
      lastActive: now,
      createdBy: state.userName,
    };
    await storage.putRoom(room);
    dispatch({ type: 'ADD_ROOM', payload: room });
  }, [state.userName]);

  const handleJoinRoom = useCallback(async (roomId: string) => {
    const rooms = await storage.getRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;

    dispatch({ type: 'SET_CURRENT_ROOM', payload: room });

    const now = Date.now();
    const user: User = {
      id: uuidv4(),
      name: state.userName,
      color: getRandomColor(),
      roomId,
      joinedAt: now,
      lastActive: now,
    };

    dispatch({ type: 'SET_CURRENT_USER', payload: user });
    await storage.putUser(user);
    syncManager.broadcast({ type: 'user_join', payload: user, timestamp: now });

    const highlights = await storage.getHighlightsByRoom(roomId);
    dispatch({ type: 'SET_HIGHLIGHTS', payload: highlights });

    const messages = await storage.getMessagesByRoom(roomId);
    dispatch({ type: 'SET_MESSAGES', payload: messages });

    // 对所有历史消息发送已送达和已读确认（排除自己发的）
    messages.forEach((msg) => {
      if (msg.userId !== user.id) {
        syncManager.broadcast({
          type: 'message_received',
          payload: {
            messageId: msg.id,
            userId: user.id,
            roomId,
            userName: user.name,
          },
          timestamp: Date.now(),
        });
        setTimeout(() => {
          syncManager.broadcast({
            type: 'message_read',
            payload: {
              messageId: msg.id,
              userId: user.id,
              roomId,
              userName: user.name,
            },
            timestamp: Date.now() + 5000,
          });
        }, 5000);
      }
    });

    const users = await storage.getUsersByRoom(roomId);
    dispatch({ type: 'SET_USERS', payload: { roomId, users } });

    room.lastActive = now;
    await storage.putRoom(room);
  }, [state.userName]);

  const handleLeaveRoom = useCallback(async () => {
    if (state.currentUser && state.currentRoom) {
      syncManager.broadcast({
        type: 'user_leave',
        payload: { userId: state.currentUser.id, roomId: state.currentRoom.id },
        timestamp: Date.now(),
      });
      await storage.deleteUser(state.currentUser.id);
    }
    dispatch({ type: 'SET_CURRENT_ROOM', payload: null });
    dispatch({ type: 'SET_CURRENT_USER', payload: null });
  }, [state.currentUser, state.currentRoom]);

  const handleAddHighlight = useCallback(async (highlightData: Omit<Highlight, 'id' | 'createdAt' | 'userId' | 'color'>) => {
    if (!state.currentRoom || !state.currentUser) return;

    const now = Date.now();
    const highlight: Highlight = {
      ...highlightData,
      id: uuidv4(),
      roomId: state.currentRoom.id,
      userId: state.currentUser.id,
      color: state.currentUser.color,
      createdAt: now,
    };

    dispatch({ type: 'ADD_HIGHLIGHT', payload: highlight });
    await storage.putHighlight(highlight);
    syncManager.broadcast({ type: 'add_highlight', payload: highlight, timestamp: now });
  }, [state.currentRoom, state.currentUser]);

  const handleUpdateAnnotation = useCallback(async (highlightId: string, annotation: string) => {
    const highlight = state.highlights.find((h) => h.id === highlightId);
    if (!highlight) return;

    const updated = { ...highlight, annotation };
    dispatch({ type: 'UPDATE_HIGHLIGHT', payload: updated });
    await storage.putHighlight(updated);
    syncManager.broadcast({ type: 'update_highlight', payload: updated, timestamp: Date.now() });
  }, [state.highlights]);

  const handleSendMessage = useCallback(async (content: string, highlightId?: string, paragraphIndex?: number) => {
    if (!state.currentRoom || !state.currentUser) return;

    const now = Date.now();
    const message: Message = {
      id: uuidv4(),
      roomId: state.currentRoom.id,
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userColor: state.currentUser.color,
      content,
      highlightId,
      paragraphIndex,
      createdAt: now,
    };

    dispatch({ type: 'ADD_MESSAGE', payload: message });
    await storage.putMessage(message);
    syncManager.broadcast({ type: 'send_message', payload: message, timestamp: now });
  }, [state.currentRoom, state.currentUser]);

  if (!initialized) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="app">
      {!state.currentRoom ? (
        <RoomManager
          rooms={state.rooms}
          usersMap={state.allUsers}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onSetUserName={handleSetUserName}
          userName={state.userName}
        />
      ) : (
        <BookViewer
          room={state.currentRoom}
          users={state.users}
          highlights={state.highlights}
          messages={state.messages}
          currentUser={state.currentUser}
          selectedHighlightId={state.selectedHighlightId}
          blinkParagraphIndex={state.blinkParagraphIndex}
          onAddHighlight={handleAddHighlight}
          onSelectHighlight={(id) => dispatch({ type: 'SELECT_HIGHLIGHT', payload: id })}
          onUpdateAnnotation={handleUpdateAnnotation}
          onSendMessage={handleSendMessage}
          onLeaveRoom={handleLeaveRoom}
        />
      )}
    </div>
  );
};

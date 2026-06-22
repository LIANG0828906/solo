import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useYjsStore } from '@/hooks/useYjsStore';
import type { IUserInfo } from '@/shared/types';

const WS_URL = 'ws://localhost:1234';

export interface YjsConnection {
  doc: Y.Doc;
  provider: WebsocketProvider;
  awareness: WebsocketProvider['awareness'];
}

export function useYjsConnection(roomId: string): YjsConnection | null {
  const [connection, setConnection] = useState<YjsConnection | null>(null);
  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const setConnected = useYjsStore((s) => s.setConnected);
  const setUsers = useYjsStore((s) => s.setUsers);
  const getUserInfo = useYjsStore((s) => s.getUserInfo);

  useEffect(() => {
    if (!roomId) return;

    const doc = new Y.Doc();
    docRef.current = doc;

    const provider = new WebsocketProvider(WS_URL, roomId, doc, {
      connect: true,
    });
    providerRef.current = provider;

    const { awareness } = provider;

    const userInfo = getUserInfo();
    awareness.setLocalStateField('user', userInfo);

    const handleStatus = ({ status }: { status: string }) => {
      setConnected(status === 'connected');
    };

    const handleAwarenessChange = () => {
      const states = awareness.getStates();
      const users: IUserInfo[] = [];
      states.forEach((state) => {
        if (state.user) {
          users.push(state.user as IUserInfo);
        }
      });
      setUsers(users);
    };

    provider.on('status', handleStatus);
    awareness.on('change', handleAwarenessChange);

    setConnection({ doc, provider, awareness });

    return () => {
      awareness.off('change', handleAwarenessChange);
      provider.off('status', handleStatus);
      awareness.setLocalState(null);
      provider.destroy();
      doc.destroy();
      setConnected(false);
      setUsers([]);
      docRef.current = null;
      providerRef.current = null;
      setConnection(null);
    };
  }, [roomId, setConnected, setUsers, getUserInfo]);

  return connection;
}

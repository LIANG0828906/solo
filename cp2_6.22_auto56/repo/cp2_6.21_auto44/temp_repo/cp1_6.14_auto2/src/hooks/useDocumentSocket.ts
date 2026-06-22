import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface Version {
  id: string;
  versionNumber: number;
  content: string;
  timestamp: number;
  summary: string;
}

export interface DocumentState {
  docId: string;
  content: string;
  versions: Version[];
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export function useDocumentSocket(initialDocId?: string) {
  const socketRef = useRef<Socket | null>(null);
  const [docId, setDocId] = useState<string>(initialDocId || 'default');
  const [content, setContent] = useState<string>('');
  const [versions, setVersions] = useState<Version[]>([]);
  const [connected, setConnected] = useState<boolean>(false);
  const [userCount, setUserCount] = useState<number>(0);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);

  const localContentRef = useRef<string>('');

  useEffect(() => {
    localContentRef.current = content;
  }, [content]);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-document', docId);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('document-state', (data: DocumentState) => {
      setContent(data.content);
      setVersions(data.versions);
    });

    socket.on('document-updated', (data: { docId: string; content: string; senderId: string }) => {
      setContent(data.content);
    });

    socket.on('version-list', (versionList: Version[]) => {
      setVersions(versionList);
    });

    socket.on('version-created', (_version: Version) => {
    });

    socket.on('restore-version', (data: { docId: string; content: string; versionId: string; restoredVersion: Version }) => {
      setIsRestoring(true);
      setContent(data.content);
      setTimeout(() => setIsRestoring(false), 300);
    });

    socket.on('user-count', (count: number) => {
      setUserCount(count);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (socketRef.current && connected) {
      socketRef.current.emit('join-document', docId);
    }
  }, [docId, connected]);

  const sendEdits = useCallback((edits: string) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('edit-document', { docId, edits });
    }
  }, [docId, connected]);

  const sendContentUpdate = useCallback((newContent: string) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('update-content', { docId, content: newContent });
    }
  }, [docId, connected]);

  const saveVersion = useCallback((): Promise<Version | null> => {
    return new Promise((resolve) => {
      if (socketRef.current && connected) {
        socketRef.current.emit('save-version', docId, (version: Version | null) => {
          resolve(version);
        });
      } else {
        resolve(null);
      }
    });
  }, [docId, connected]);

  const getVersions = useCallback((): Promise<Version[]> => {
    return new Promise((resolve) => {
      if (socketRef.current && connected) {
        socketRef.current.emit('get-versions', docId, (versionList: Version[]) => {
          setVersions(versionList);
          resolve(versionList);
        });
      } else {
        resolve([]);
      }
    });
  }, [docId, connected]);

  const restoreVersion = useCallback((versionId: string) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('restore-version', { docId, versionId });
    }
  }, [docId, connected]);

  return {
    docId,
    setDocId,
    content,
    setContent,
    versions,
    connected,
    userCount,
    isRestoring,
    sendEdits,
    sendContentUpdate,
    saveVersion,
    getVersions,
    restoreVersion,
  };
}

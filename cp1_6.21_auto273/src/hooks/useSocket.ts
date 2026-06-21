import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface VoteOption {
  id: string;
  text: string;
  count: number;
}

export interface Poll {
  id: string;
  question: string;
  type: 'single' | 'multiple';
  options: VoteOption[];
  status: 'pending' | 'active' | 'ended';
  totalVoters: number;
  createdAt: number;
  endedAt?: number;
}

export interface VoteUpdatePayload {
  pollId: string;
  options: VoteOption[];
  totalVoters: number;
}

export interface VoteSubmission {
  pollId: string;
  optionIds: string[];
  voterId?: string;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io('/', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const joinPoll = useCallback((pollId: string, role: 'host' | 'voter') => {
    socketRef.current?.emit('joinPoll', { pollId, role });
  }, []);

  const submitVote = useCallback((data: VoteSubmission) => {
    socketRef.current?.emit('submitVote', data);
  }, []);

  const startVote = useCallback((pollId: string) => {
    socketRef.current?.emit('startVote', pollId);
  }, []);

  const endVote = useCallback((pollId: string) => {
    socketRef.current?.emit('endVote', pollId);
  }, []);

  const onVoteUpdate = useCallback((callback: (payload: VoteUpdatePayload) => void) => {
    socketRef.current?.on('voteUpdate', callback);
    return () => {
      socketRef.current?.off('voteUpdate', callback);
    };
  }, []);

  const onVoteStarted = useCallback((callback: (poll: Poll) => void) => {
    socketRef.current?.on('voteStarted', callback);
    return () => {
      socketRef.current?.off('voteStarted', callback);
    };
  }, []);

  const onVoteEnded = useCallback((callback: (payload: { pollId: string; endedAt: number }) => void) => {
    socketRef.current?.on('voteEnded', callback);
    return () => {
      socketRef.current?.off('voteEnded', callback);
    };
  }, []);

  const onVoteCreated = useCallback((callback: (poll: Poll) => void) => {
    socketRef.current?.on('voteCreated', callback);
    return () => {
      socketRef.current?.off('voteCreated', callback);
    };
  }, []);

  return {
    isConnected,
    joinPoll,
    submitVote,
    startVote,
    endVote,
    onVoteUpdate,
    onVoteStarted,
    onVoteEnded,
    onVoteCreated,
  };
}

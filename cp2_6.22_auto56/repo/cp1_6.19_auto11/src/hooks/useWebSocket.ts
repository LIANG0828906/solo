import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { VoteData, ToastType } from '@/types';

interface UseWebSocketReturn {
  socket: Socket | null;
  connected: boolean;
  votes: VoteData[];
  currentVote: VoteData | null;
  voted: boolean;
  sendCreateVote: (data: { title: string; options: string[]; duration: number }) => void;
  sendJoinVote: (roomId: string) => void;
  sendSubmitVote: (roomId: string, optionIndex: number) => void;
  sendEndVote: (roomId: string) => void;
  sendGetVoteList: () => void;
  toasts: { id: number; message: string; type: ToastType }[];
  dismissToast: (id: number) => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [votes, setVotes] = useState<VoteData[]>([]);
  const [currentVote, setCurrentVote] = useState<VoteData | null>(null);
  const [voted, setVoted] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: ToastType }[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('get_vote_list');
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('vote_created', (data: { roomId: string; vote: VoteData }) => {
      setVotes((prev) => {
        const exists = prev.some((v) => v.roomId === data.vote.roomId);
        if (exists) {
          return prev.map((v) => (v.roomId === data.vote.roomId ? data.vote : v)).sort(
            (a, b) => b.createdAt - a.createdAt
          );
        }
        return [data.vote, ...prev].sort((a, b) => b.createdAt - a.createdAt);
      });
    });

    socket.on('vote_joined', (data: { vote: VoteData; voted: boolean }) => {
      setCurrentVote(data.vote);
      setVoted(data.voted);
      const votedKey = `voted_${data.vote.roomId}`;
      if (!data.voted && sessionStorage.getItem(votedKey)) {
        setVoted(true);
      }
    });

    socket.on('vote_update', (data: { vote: VoteData }) => {
      setCurrentVote((prev) =>
        prev && prev.roomId === data.vote.roomId ? data.vote : prev
      );
      setVotes((prev) => {
        const exists = prev.some((v) => v.roomId === data.vote.roomId);
        if (exists) {
          return prev
            .map((v) => (v.roomId === data.vote.roomId ? data.vote : v))
            .sort((a, b) => b.createdAt - a.createdAt);
        }
        return [data.vote, ...prev].sort((a, b) => b.createdAt - a.createdAt);
      });
    });

    socket.on('vote_ended', (data: { vote: VoteData }) => {
      setCurrentVote((prev) =>
        prev && prev.roomId === data.vote.roomId ? data.vote : prev
      );
      setVotes((prev) =>
        prev
          .map((v) => (v.roomId === data.vote.roomId ? data.vote : v))
          .sort((a, b) => b.createdAt - a.createdAt)
      );
    });

    socket.on('vote_list', (data: { votes: VoteData[] }) => {
      setVotes(data.votes);
    });

    socket.on('toast', (data: { message: string; type: ToastType }) => {
      showToast(data.message, data.type);
    });

    socket.on('error', (data: { message: string }) => {
      showToast(data.message, 'error');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [showToast]);

  const sendCreateVote = useCallback((data: { title: string; options: string[]; duration: number }) => {
    socketRef.current?.emit('create_vote', data);
  }, []);

  const sendJoinVote = useCallback((roomId: string) => {
    socketRef.current?.emit('join_vote', { roomId });
  }, []);

  const sendSubmitVote = useCallback((roomId: string, optionIndex: number) => {
    const votedKey = `voted_${roomId}`;
    if (sessionStorage.getItem(votedKey)) {
      showToast('您已经投过票了', 'error');
      return;
    }
    sessionStorage.setItem(votedKey, String(optionIndex));
    setVoted(true);
    socketRef.current?.emit('submit_vote', { roomId, optionIndex });
  }, [showToast]);

  const sendEndVote = useCallback((roomId: string) => {
    socketRef.current?.emit('end_vote', { roomId });
  }, []);

  const sendGetVoteList = useCallback(() => {
    socketRef.current?.emit('get_vote_list');
  }, []);

  return {
    socket: socketRef.current,
    connected,
    votes,
    currentVote,
    voted,
    sendCreateVote,
    sendJoinVote,
    sendSubmitVote,
    sendEndVote,
    sendGetVoteList,
    toasts,
    dismissToast,
  };
}

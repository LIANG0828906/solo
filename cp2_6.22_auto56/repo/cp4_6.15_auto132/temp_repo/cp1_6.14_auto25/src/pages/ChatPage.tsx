import React from 'react';
import Chat from '../components/Chat';
import { useStore } from '../store/useStore';
import { Navigate } from 'react-router-dom';

const ChatPage: React.FC = () => {
  const { currentUser } = useStore();

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  return <Chat />;
};

export default ChatPage;

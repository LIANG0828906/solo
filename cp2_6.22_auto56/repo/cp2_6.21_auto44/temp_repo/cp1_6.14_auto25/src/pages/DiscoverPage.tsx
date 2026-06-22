import React from 'react';
import CardList from '../components/CardList';
import { useStore } from '../store/useStore';
import { Navigate } from 'react-router-dom';

const DiscoverPage: React.FC = () => {
  const { currentUser } = useStore();

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  return <CardList />;
};

export default DiscoverPage;

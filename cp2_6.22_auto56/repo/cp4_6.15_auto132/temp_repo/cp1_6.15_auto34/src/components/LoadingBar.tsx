import React from 'react';

interface LoadingBarProps {
  isLoading: boolean;
}

export const LoadingBar: React.FC<LoadingBarProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="w-full h-1 bg-sand-100 rounded-full overflow-hidden">
      <div className="h-full bg-gradient-to-r from-sand-400 to-earth-500 animate-progress rounded-full" />
    </div>
  );
};

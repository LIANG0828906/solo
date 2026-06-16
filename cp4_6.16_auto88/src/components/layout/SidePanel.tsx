import React from 'react';

interface SidePanelProps {
  children: React.ReactNode;
  className?: string;
}

export const SidePanel: React.FC<SidePanelProps> = ({ children, className = '' }) => {
  return (
    <div className={`side-panel ${className}`}>
      <div className="side-panel-content">
        {children}
      </div>
    </div>
  );
};

import React from 'react';
import '../styles/Spinner.css';

interface SpinnerProps {
  size?: number;
  color?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 20, color = 'var(--color-primary)' }) => {
  return (
    <div
      className="spinner"
      style={{
        width: size,
        height: size,
        borderWidth: Math.max(2, size / 10),
        borderColor: `${color}33`,
        borderTopColor: color,
      }}
    />
  );
};

export default Spinner;

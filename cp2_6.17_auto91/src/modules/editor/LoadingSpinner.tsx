import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: number;
}

export function LoadingSpinner({ size = 44 }: LoadingSpinnerProps) {
  return (
    <div className="loading-spinner-container">
      <div
        className="loading-spinner"
        style={{
          width: size,
          height: size,
          borderWidth: 4,
        }}
      />
    </div>
  );
}

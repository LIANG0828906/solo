interface CircularProgressProps {
  progress: number;
  size?: number;
  label?: string;
}

function CircularProgress({ progress, size = 120, label }: CircularProgressProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div
      className="circular-progress"
      style={{ width: size, height: size }}
    >
      <div
        className="circular-progress-ring"
        style={{ ['--progress' as string]: `${clampedProgress}%` }}
      >
        <div className="circular-progress-inner">
          <div className="circular-progress-value">{clampedProgress}%</div>
          {label && <div className="circular-progress-label">{label}</div>}
        </div>
      </div>
    </div>
  );
}

export default CircularProgress;

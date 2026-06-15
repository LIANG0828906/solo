import './BrushAnimation.css';

export default function BrushAnimation() {
  return (
    <div className="brush-animation">
      <svg viewBox="0 0 300 300" width="220" height="220">
        <defs>
          <radialGradient id="inkGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1a1a1a" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#2a2a2a" stopOpacity="0.6" />
            <stop offset="70%" stopColor="#3a3a3a" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#5a5a5a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="inkRipple1" cx="50%" cy="50%" r="50%">
            <stop offset="80%" stopColor="transparent" />
            <stop offset="90%" stopColor="#2a2a2a" stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="brushHandle" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#A0522D" />
            <stop offset="50%" stopColor="#8B4513" />
            <stop offset="100%" stopColor="#6B4423" />
          </linearGradient>
        </defs>

        <g className="ink-ripple-group">
          <circle
            cx="150"
            cy="280"
            r="0"
            fill="url(#inkRipple1)"
            className="ink-ripple ink-ripple-1"
          />
          <circle
            cx="150"
            cy="280"
            r="0"
            fill="url(#inkRipple1)"
            className="ink-ripple ink-ripple-2"
          />
        </g>

        <g className="brush-group">
          <path
            d="M150 10 Q146 50 148 90 Q150 130 152 170 Q154 200 150 230"
            stroke="url(#brushHandle)"
            strokeWidth="14"
            fill="none"
            strokeLinecap="round"
          />
          <ellipse
            cx="150"
            cy="228"
            rx="10"
            ry="6"
            fill="#D2691E"
            className="brush-ferrule"
          />
          <path
            d="M138 232 Q142 250 150 255 Q158 250 162 232 Q165 250 150 275 Q135 250 138 232"
            fill="#1a1a1a"
            className="brush-bristles"
          />
          <ellipse
            cx="150"
            cy="272"
            rx="5"
            ry="3"
            fill="#0a0a0a"
            className="brush-tip-drop"
          />
        </g>

        <circle
          cx="150"
          cy="280"
          r="0"
          fill="url(#inkGrad)"
          className="ink-drop"
        />
      </svg>
    </div>
  );
}

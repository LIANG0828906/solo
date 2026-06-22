import { useStore } from '@/store/useStore';
import { getStabilityColor, getRollZone } from '@/utils/physics';
import './Dashboard.css';

const Dashboard = () => {
  const roll = useStore((state) => state.roll);
  const floodRate = useStore((state) => state.floodRate);
  const stabilityScore = useStore((state) => state.stabilityScore);

  const rollAngle = Math.max(-30, Math.min(30, roll));
  const rollRotation = (rollAngle / 30) * 90;

  const floodRotation = (floodRate / 100) * 180 - 90;

  const stabilityRotation = (stabilityScore / 100) * 180 - 90;
  const stabilityColor = getStabilityColor(stabilityScore);
  const rollZone = getRollZone(roll);

  return (
    <div className="dashboard-container">
      <div className="dashboard-title">驾驶台仪表盘</div>
      <div className="dashboard-dial">
        <svg width="200" height="130" viewBox="0 0 200 130">
          <defs>
            <linearGradient id="rollGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#cc0000" />
              <stop offset="25%" stopColor="#ffaa00" />
              <stop offset="50%" stopColor="#00cc00" />
              <stop offset="75%" stopColor="#ffaa00" />
              <stop offset="100%" stopColor="#cc0000" />
            </linearGradient>
          </defs>

          <g transform="translate(55, 70)">
            <circle cx="0" cy="0" r="50" fill="#f5f0e0" stroke="#5d3a1a" strokeWidth="2" />
            
            <path
              d="M-40,0 A40,40 0 0,1 -17.32,-34.64"
              fill="none"
              stroke="#cc0000"
              strokeWidth="6"
              opacity="0.3"
            />
            <path
              d="M-17.32,-34.64 A40,40 0 0,1 -10.35,-38.64"
              fill="none"
              stroke="#ffaa00"
              strokeWidth="6"
              opacity="0.3"
            />
            <path
              d="M-10.35,-38.64 A40,40 0 0,1 10.35,-38.64"
              fill="none"
              stroke="#00cc00"
              strokeWidth="6"
              opacity="0.3"
            />
            <path
              d="M10.35,-38.64 A40,40 0 0,1 17.32,-34.64"
              fill="none"
              stroke="#ffaa00"
              strokeWidth="6"
              opacity="0.3"
            />
            <path
              d="M17.32,-34.64 A40,40 0 0,1 40,0"
              fill="none"
              stroke="#cc0000"
              strokeWidth="6"
              opacity="0.3"
            />

            <line
              x1="0"
              y1="0"
              x2="0"
              y2="-40"
              stroke="#333"
              strokeWidth="3"
              strokeLinecap="round"
              style={{
                transform: `rotate(${rollRotation}deg)`,
                transformOrigin: 'center',
                transition: 'transform 0.3s ease-in-out',
              }}
            />
            <circle cx="0" cy="0" r="5" fill="#5d3a1a" />
            
            <text x="0" y="20" textAnchor="middle" fontSize="10" fill="#5d3a1a">横摇</text>
            <text x="0" y="35" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#333">
              {roll.toFixed(1)}°
            </text>
          </g>

          <g transform="translate(100, 70)">
            <circle cx="0" cy="0" r="50" fill="#f5f0e0" stroke="#5d3a1a" strokeWidth="2" />
            
            <path
              d="M-40,0 A40,40 0 0,1 40,0"
              fill="none"
              stroke="#0066cc"
              strokeWidth="6"
              opacity="0.3"
            />

            <line
              x1="0"
              y1="0"
              x2="0"
              y2="-40"
              stroke="#333"
              strokeWidth="3"
              strokeLinecap="round"
              style={{
                transform: `rotate(${floodRotation}deg)`,
                transformOrigin: 'center',
                transition: 'transform 0.3s ease-in-out',
              }}
            />
            <circle cx="0" cy="0" r="5" fill="#5d3a1a" />
            
            <text x="0" y="20" textAnchor="middle" fontSize="10" fill="#5d3a1a">进水速率</text>
            <text x="0" y="35" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#333">
              {floodRate.toFixed(1)}
            </text>
            <text x="0" y="48" textAnchor="middle" fontSize="8" fill="#666">升/秒</text>
          </g>

          <g transform="translate(145, 70)">
            <circle cx="0" cy="0" r="50" fill="#f5f0e0" stroke="#5d3a1a" strokeWidth="2" />
            
            <path
              d="M-40,0 A40,40 0 0,1 40,0"
              fill="none"
              stroke={stabilityColor}
              strokeWidth="6"
              opacity="0.3"
            />

            <line
              x1="0"
              y1="0"
              x2="0"
              y2="-40"
              stroke={stabilityColor}
              strokeWidth="3"
              strokeLinecap="round"
              style={{
                transform: `rotate(${stabilityRotation}deg)`,
                transformOrigin: 'center',
                transition: 'transform 0.3s ease-in-out',
              }}
            />
            <circle cx="0" cy="0" r="5" fill="#5d3a1a" />
            
            <text x="0" y="20" textAnchor="middle" fontSize="10" fill="#5d3a1a">稳定性</text>
            <text 
              x="0" 
              y="35" 
              textAnchor="middle" 
              fontSize="12" 
              fontWeight="bold" 
              fill={stabilityColor}
            >
              {stabilityScore.toFixed(0)}
            </text>
            <text x="0" y="48" textAnchor="middle" fontSize="8" fill="#666">分</text>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default Dashboard;

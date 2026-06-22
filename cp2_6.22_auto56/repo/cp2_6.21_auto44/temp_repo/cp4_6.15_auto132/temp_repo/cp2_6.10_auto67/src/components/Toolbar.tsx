import React from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';

type ToolType = 'ink' | 'marker' | 'cut';

interface ToolButtonProps {
  tool: ToolType;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const ToolButton: React.FC<ToolButtonProps> = ({ icon, label, isActive, onClick }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        padding: '10px 14px',
        border: `2px solid ${isActive ? '#b87333' : '#555'}`,
        borderRadius: '8px',
        background: isActive ? '#fff' : 'transparent',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        boxShadow: isActive ? '0 4px 12px rgba(184, 115, 51, 0.3), inset 0 1px 0 rgba(255,255,255,0.8)' : '0 2px 4px rgba(0,0,0,0.2)',
        transition: 'all 0.2s ease',
        minWidth: '60px'
      }}
      title={label}
    >
      {icon}
      <span style={{ fontSize: '11px', color: isActive ? '#1a1a1a' : '#ccc', fontWeight: 500 }}>{label}</span>
    </motion.button>
  );
};

const InkChiselIcon: React.FC = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3a3a3a" />
        <stop offset="50%" stopColor="#1a1a1a" />
        <stop offset="100%" stopColor="#0d0d0d" />
      </linearGradient>
      <linearGradient id="copperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#d4a574" />
        <stop offset="50%" stopColor="#b87333" />
        <stop offset="100%" stopColor="#8b5a2b" />
      </linearGradient>
      <linearGradient id="ropeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#e8dcc8" />
        <stop offset="50%" stopColor="#c4b896" />
        <stop offset="100%" stopColor="#a89878" />
      </linearGradient>
    </defs>
    
    <path d="M10 12 L38 12 L34 36 L14 36 Z" fill="url(#bodyGrad)" stroke="#000" strokeWidth="1.5" />
    <path d="M10 12 L38 12 L36 16 L12 16 Z" fill="#2a2a2a" stroke="#000" strokeWidth="0.5" />
    <path d="M13 17 L35 17 L33 34 L15 34 Z" fill="url(#bodyGrad)" opacity="0.9" />
    
    <ellipse cx="24" cy="26" rx="9" ry="8" fill="url(#copperGrad)" stroke="#5a3a1a" strokeWidth="1.5" />
    <ellipse cx="24" cy="26" rx="6" ry="5" fill="#3a2a1a" stroke="#5a3a1a" strokeWidth="0.5" />
    <ellipse cx="24" cy="26" rx="3" ry="2.5" fill="#1a0f08" />
    
    <circle cx="24" cy="26" r="1" fill="#666" />
    
    <path
      d="M15 26 Q20 22 24 26 Q28 30 33 26"
      stroke="url(#ropeGrad)"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M15 28 Q20 24 24 28 Q28 32 33 28"
      stroke="url(#ropeGrad)"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M15 24 Q20 20 24 24 Q28 28 33 24"
      stroke="url(#ropeGrad)"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    
    <path d="M12 16 L12 34" stroke="url(#ropeGrad)" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M36 16 L36 34" stroke="url(#ropeGrad)" strokeWidth="1.5" strokeLinecap="round" />
    
    <path d="M10 12 L10 14 L38 14 L38 12" fill="#4a4a4a" />
    
    <ellipse cx="15" cy="13" rx="1.5" ry="1" fill="#5a5a5a" />
    <ellipse cx="33" cy="13" rx="1.5" ry="1" fill="#5a5a5a" />
    
    <path d="M22 36 L22 42 L26 42 L26 36" fill="#2a2a2a" stroke="#000" strokeWidth="0.5" />
    <circle cx="24" cy="43" r="2" fill="#1a1a1a" stroke="#000" strokeWidth="0.5" />
  </svg>
);

const MarkerIcon: React.FC = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="markerGrad" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#e8e8e8" />
        <stop offset="100%" stopColor="#b0b0b0" />
      </radialGradient>
      <radialGradient id="centerGrad" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#d4d4d4" />
      </radialGradient>
      <linearGradient id="crossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2a2a2a" />
        <stop offset="100%" stopColor="#1a1a1a" />
      </linearGradient>
      <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="1" dy="1" stdDeviation="1" floodOpacity="0.3" />
      </filter>
    </defs>
    
    <circle cx="24" cy="24" r="16" fill="url(#markerGrad)" stroke="#1a1a1a" strokeWidth="2" filter="url(#shadow)" />
    <circle cx="24" cy="24" r="14" fill="url(#centerGrad)" stroke="#555" strokeWidth="0.5" />
    
    <circle cx="24" cy="24" r="11" fill="none" stroke="#888" strokeWidth="0.5" strokeDasharray="2,2" />
    <circle cx="24" cy="24" r="7" fill="none" stroke="#aaa" strokeWidth="0.5" />
    
    <line x1="24" y1="6" x2="24" y2="18" stroke="url(#crossGrad)" strokeWidth="3" strokeLinecap="round" />
    <line x1="24" y1="30" x2="24" y2="42" stroke="url(#crossGrad)" strokeWidth="3" strokeLinecap="round" />
    <line x1="6" y1="24" x2="18" y2="24" stroke="url(#crossGrad)" strokeWidth="3" strokeLinecap="round" />
    <line x1="30" y1="24" x2="42" y2="24" stroke="url(#crossGrad)" strokeWidth="3" strokeLinecap="round" />
    
    <circle cx="24" cy="24" r="4" fill="#1a1a1a" />
    <circle cx="24" cy="24" r="2.5" fill="#3a3a3a" />
    <circle cx="23" cy="23" r="0.8" fill="#666" />
    
    <ellipse cx="18" cy="18" rx="2" ry="1.5" fill="rgba(255,255,255,0.4)" transform="rotate(-45 18 18)" />
    
    <circle cx="24" cy="24" r="16" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4,8" />
  </svg>
);

const CuttingIcon: React.FC = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bladeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f0f0f0" />
        <stop offset="30%" stopColor="#c0c0c0" />
        <stop offset="70%" stopColor="#909090" />
        <stop offset="100%" stopColor="#606060" />
      </linearGradient>
      <linearGradient id="handleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8b4513" />
        <stop offset="50%" stopColor="#654321" />
        <stop offset="100%" stopColor="#3d2914" />
      </linearGradient>
      <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#e8e8e8" />
        <stop offset="100%" stopColor="#a0a0a0" />
      </linearGradient>
      <filter id="bladeShadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="2" dy="2" stdDeviation="1.5" floodOpacity="0.4" />
      </filter>
    </defs>
    
    <path
      d="M8 28 L12 28 L12 20 L8 20 Z"
      fill="url(#handleGrad)"
      stroke="#2a1a0a"
      strokeWidth="1"
    />
    <line x1="9" y1="21" x2="9" y2="27" stroke="#3d2914" strokeWidth="0.5" />
    <line x1="10" y1="21" x2="10" y2="27" stroke="#3d2914" strokeWidth="0.5" />
    <line x1="11" y1="21" x2="11" y2="27" stroke="#3d2914" strokeWidth="0.5" />
    
    <ellipse cx="10" cy="19" rx="2.5" ry="1" fill="#3d2914" stroke="#2a1a0a" strokeWidth="0.5" />
    <ellipse cx="10" cy="29" rx="2.5" ry="1" fill="#3d2914" stroke="#2a1a0a" strokeWidth="0.5" />
    
    <path
      d="M12 20 L40 8 L40 12 L38 12 L38 16 L36 16 L36 20 L34 20 L34 24 L36 24 L36 28 L38 28 L38 32 L40 32 L40 40 L12 28 Z"
      fill="url(#bladeGrad)"
      stroke="#404040"
      strokeWidth="1.5"
      filter="url(#bladeShadow)"
    />
    
    <path
      d="M12 20 L40 8 L40 12 L12 24 Z"
      fill="url(#edgeGrad)"
      opacity="0.8"
    />
    
    <path d="M40 8 L38 12 L40 12 Z" fill="#d0d0d0" stroke="#505050" strokeWidth="0.5" />
    <path d="M38 12 L36 16 L38 16 Z" fill="#d0d0d0" stroke="#505050" strokeWidth="0.5" />
    <path d="M36 16 L34 20 L36 20 Z" fill="#d0d0d0" stroke="#505050" strokeWidth="0.5" />
    <path d="M34 20 L36 24 L34 24 Z" fill="#d0d0d0" stroke="#505050" strokeWidth="0.5" />
    <path d="M36 24 L38 28 L36 28 Z" fill="#d0d0d0" stroke="#505050" strokeWidth="0.5" />
    <path d="M38 28 L40 32 L38 32 Z" fill="#d0d0d0" stroke="#505050" strokeWidth="0.5" />
    <path d="M40 32 L40 40 L42 36 Z" fill="#d0d0d0" stroke="#505050" strokeWidth="0.5" />
    
    <line x1="14" y1="21" x2="38" y2="13" stroke="#fff" strokeWidth="0.5" opacity="0.5" />
    <line x1="14" y1="23" x2="38" y2="29" stroke="#fff" strokeWidth="0.5" opacity="0.3" />
    
    <path
      d="M40 12 L38 12 L38 16 L36 16 L36 20 L34 20 L34 24 L36 24 L36 28 L38 28 L38 32 L40 32"
      fill="none"
      stroke="#202020"
      strokeWidth="0.8"
    />
    
    <circle cx="14" cy="24" r="1.5" fill="#303030" stroke="#505050" strokeWidth="0.5" />
    <circle cx="14" cy="24" r="0.5" fill="#606060" />
    
    <ellipse cx="16" cy="18" rx="3" ry="1.5" fill="rgba(255,255,255,0.3)" transform="rotate(-20 16 18)" />
  </svg>
);

const Toolbar: React.FC = () => {
  const { tool, setTool, reset } = useStore();

  const tools: { id: ToolType; icon: React.ReactNode; label: string }[] = [
    { id: 'ink', icon: <InkChiselIcon />, label: '墨斗' },
    { id: 'marker', icon: <MarkerIcon />, label: '标记' },
    { id: 'cut', icon: <CuttingIcon />, label: '切割' }
  ];

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex',
        gap: '12px',
        padding: '12px 16px',
        background: 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        border: '1px solid #333',
        alignItems: 'center'
      }}
    >
      {tools.map((t) => (
        <ToolButton
          key={t.id}
          tool={t.id}
          icon={t.icon}
          label={t.label}
          isActive={tool === t.id}
          onClick={() => setTool(t.id)}
        />
      ))}
      
      <div style={{ width: '1px', height: '40px', background: '#444', margin: '0 4px' }} />
      
      <motion.button
        whileHover={{ scale: 1.05, backgroundColor: '#a52a2a' }}
        whileTap={{ scale: 0.95 }}
        onClick={reset}
        style={{
          padding: '10px 16px',
          border: '2px solid #8b0000',
          borderRadius: '8px',
          background: '#8b0000',
          color: '#fff',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '13px',
          boxShadow: '0 2px 8px rgba(139, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        重置
      </motion.button>
    </motion.div>
  );
};

export default Toolbar;

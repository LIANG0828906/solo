import React, { useState } from 'react'

interface ForgeButtonProps {
  onClick: () => void
  disabled: boolean
  isForging: boolean
}

const ForgeButton: React.FC<ForgeButtonProps> = ({ onClick, disabled, isForging }) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const [showPulse, setShowPulse] = useState(false)

  const handleClick = () => {
    if (disabled || isForging) return
    setShowPulse(true)
    setTimeout(() => setShowPulse(false), 100)
    onClick()
  }

  const getTransform = () => {
    if (isPressed) return 'scale(0.95)'
    if (isHovered && !disabled) return 'scale(1.05)'
    return 'scale(1)'
  }

  const getBgColor = () => {
    if (isForging) return '#4CAF50'
    if (disabled) return '#555'
    if (isHovered) return '#C62828'
    return '#D32F2F'
  }

  return (
    <button
      className="forge-button"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setIsPressed(false)
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      disabled={disabled && !isForging}
      style={{
        position: 'absolute',
        right: '30px',
        bottom: '30px',
        width: '120px',
        height: '50px',
        borderRadius: '8px',
        border: 'none',
        background: getBgColor(),
        color: '#fff',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: disabled && !isForging ? 'not-allowed' : 'pointer',
        transform: getTransform(),
        transition: 'all 0.15s ease',
        boxShadow: isPressed
          ? '0 1px 3px rgba(0,0,0,0.3)'
          : '0 4px 15px rgba(211, 47, 47, 0.4)',
        zIndex: 15,
        letterSpacing: '2px'
      }}
    >
      {isForging ? '锻造中...' : '锻造'}
      {showPulse && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.5)',
            animation: 'pulse 0.1s ease-out'
          }}
        />
      )}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.8; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.2); }
        }
      `}</style>
    </button>
  )
}

export default ForgeButton

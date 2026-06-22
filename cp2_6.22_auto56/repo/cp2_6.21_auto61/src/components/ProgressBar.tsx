import React from 'react'

interface ProgressBarProps {
  progress: number
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="progress-container">
      <span className="progress-label">修复进度</span>
      <div className="progress-bar-wrapper">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="progress-percent">{progress}%</span>
    </div>
  )
}

import React from 'react'
import type { ElementType } from '../types'
import { elementColors } from '../utils/gemUtils'

interface ElementIconProps {
  element: ElementType
  size?: number
}

export const ElementIcon: React.FC<ElementIconProps> = ({ element, size = 32 }) => {
  const color = elementColors[element]

  const renderIcon = () => {
    switch (element) {
      case 'fire':
        return (
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
            <path
              d="M16 2C16 2 8 10 8 18C8 23.523 11.477 28 16 28C20.523 28 24 23.523 24 18C24 10 16 2 16 2Z"
              fill={color}
              filter="url(#fireGlow)"
            />
            <path
              d="M16 8C16 8 12 13 12 18C12 21.314 13.791 24 16 24C18.209 24 20 21.314 20 18C20 13 16 8 16 8Z"
              fill="#fff"
              fillOpacity="0.6"
            />
            <defs>
              <filter id="fireGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
          </svg>
        )
      case 'water':
        return (
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
            <path
              d="M16 2C16 2 6 14 6 20C6 25.523 10.477 30 16 30C21.523 30 26 25.523 26 20C26 14 16 2 16 2Z"
              fill={color}
              filter="url(#waterGlow)"
            />
            <ellipse cx="13" cy="18" rx="3" ry="4" fill="#fff" fillOpacity="0.5" />
            <defs>
              <filter id="waterGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
          </svg>
        )
      case 'thunder':
        return (
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
            <path
              d="M18 2L8 20H14L12 30L24 12H18L20 2H18Z"
              fill={color}
              filter="url(#thunderGlow)"
            />
            <defs>
              <filter id="thunderGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
          </svg>
        )
      case 'wind':
        return (
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
            <path
              d="M4 10H20C22.209 10 24 8.209 24 6C24 3.791 22.209 2 20 2C17.791 2 16 3.791 16 6"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M2 16H26C28.209 16 30 14.209 30 12C30 9.791 28.209 8 26 8C23.791 8 22 9.791 22 12"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M6 22H22C24.209 22 26 20.209 26 18C26 15.791 24.209 14 22 14C19.791 14 18 15.791 18 18"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        )
      case 'dark':
        return (
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
            <g filter="url(#darkGlow)">
              <circle cx="16" cy="16" r="12" fill={color} />
              <path
                d="M16 6C16 6 10 10 10 16C10 22 16 26 16 26C16 26 22 22 22 16C22 10 16 6 16 6Z"
                fill="#1a0a2e"
              />
            </g>
            <defs>
              <filter id="darkGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
          </svg>
        )
      default:
        return null
    }
  }

  return renderIcon()
}

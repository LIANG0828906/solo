import React from 'react';
import type { BrewMethod } from '@/types';

interface Props {
  method: BrewMethod;
  size?: number;
  className?: string;
}

const icons: Record<BrewMethod, (color: string) => React.ReactNode> = {
  pourover: (c) => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 12h24l-3 36H23L20 12z" stroke={c} strokeWidth="2.5" fill="none" />
      <path d="M28 48v6M36 48v6M26 54h12" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M24 22c4-4 12-4 16 0" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <path d="M16 12h32" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M44 16c6 0 10 4 8 10s-8 4-8 4" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  ),
  espresso: (c) => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="52" rx="16" ry="4" stroke={c} strokeWidth="2" fill="none" />
      <path d="M16 20h32l-4 28H20L16 20z" stroke={c} strokeWidth="2.5" fill="none" />
      <path d="M48 24h4c2 0 4 2 4 4s-2 4-4 4h-4" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M26 16c0-4 2-8 6-8s6 4 6 8" stroke={c} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
    </svg>
  ),
  frenchPress: (c) => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="16" width="28" height="36" rx="3" stroke={c} strokeWidth="2.5" fill="none" />
      <path d="M18 28h28" stroke={c} strokeWidth="1.5" opacity="0.4" />
      <path d="M32 8v8M28 8h8" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <rect x="24" y="30" width="16" height="2" rx="1" fill={c} opacity="0.6" />
      <path d="M30 32v16M34 32v16" stroke={c} strokeWidth="1" opacity="0.4" />
    </svg>
  ),
  aeropress: (c) => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="22" y="8" width="20" height="40" rx="4" stroke={c} strokeWidth="2.5" fill="none" />
      <path d="M22 18h20" stroke={c} strokeWidth="1.5" opacity="0.4" />
      <path d="M26 8V4h12v4" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M22 48l6 8h8l6-8" stroke={c} strokeWidth="2" strokeLinejoin="round" fill="none" />
      <rect x="28" y="22" width="8" height="12" rx="2" stroke={c} strokeWidth="1.5" fill="none" opacity="0.5" />
    </svg>
  ),
};

export default function BrewMethodIcon({ method, size = 32, className = '' }: Props) {
  const color = '#8D6E63';
  return (
    <span className={`inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {icons[method](color)}
    </span>
  );
}

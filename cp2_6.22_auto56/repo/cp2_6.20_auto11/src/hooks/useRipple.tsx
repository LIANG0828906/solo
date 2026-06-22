import React, { useState, useCallback, useRef, useEffect } from 'react';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

let rippleIdCounter = 0;

export interface UseRippleResult {
  onClick: (e: React.MouseEvent<HTMLElement>) => void;
  rippleElements: React.ReactNode;
}

export function useRipple<T extends HTMLElement = HTMLElement>(
  _elementId: string
): UseRippleResult {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const timeoutsRef = useRef<number[]>([]);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearAllTimeouts();
  }, [clearAllTimeouts]);

  const handleClick = useCallback(
    (e: React.MouseEvent<T>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = rippleIdCounter++;

      setRipples((prev) => [...prev, { id, x, y }]);

      const timeoutId = window.setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
      timeoutsRef.current.push(timeoutId);
    },
    []
  );

  const rippleElements: React.ReactNode = ripples.map((ripple) =>
    React.createElement('span', {
      key: ripple.id,
      className: 'ripple-effect',
      style: {
        left: ripple.x,
        top: ripple.y,
      },
    })
  );

  return {
    onClick: handleClick as (e: React.MouseEvent<HTMLElement>) => void,
    rippleElements,
  };
}

export interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function RippleButton({ children, onClick, className, ...rest }: RippleButtonProps) {
  const buttonId = `btn-${Math.random().toString(36).slice(2, 9)}`;
  const { onClick: rippleOnClick, rippleElements } = useRipple(buttonId);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    rippleOnClick(e);
    onClick?.(e);
  };

  return (
    <button
      className={`ripple-container ${className || ''}`}
      onClick={handleClick}
      {...rest}
    >
      {children}
      {rippleElements}
    </button>
  );
}

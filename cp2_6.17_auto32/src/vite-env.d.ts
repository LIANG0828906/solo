/// <reference types="vite/client" />

import type * as React from 'react';

declare module 'lucide-react' {
  export type LucideIconProps = {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
    className?: string;
    style?: React.CSSProperties;
    absoluteStrokeWidth?: boolean;
    defaultChecked?: boolean;
  };

  export type LucideIcon = React.ComponentType<LucideIconProps>;

  export const Heart: LucideIcon;
  export const Crosshair: LucideIcon;
  export const Zap: LucideIcon;
  export const Trophy: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const Users: LucideIcon;
  export const Play: LucideIcon;
  export const Copy: LucideIcon;
  export const Check: LucideIcon;
  export const User: LucideIcon;
  export const Clock: LucideIcon;
  export const Target: LucideIcon;
  export const Shield: LucideIcon;
  export const DoorOpen: LucideIcon;
  export const Loader2: LucideIcon;
  export const Frown: LucideIcon;
  export const Scale: LucideIcon;
  export const RotateCcw: LucideIcon;
}

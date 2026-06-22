declare module 'lucide-react' {
  import * as React from 'react';

  export interface LucideProps extends React.SVGAttributes<SVGElement> {
    size?: number | string;
    strokeWidth?: number;
    absoluteStrokeWidth?: boolean;
  }

  export const User: React.FC<LucideProps>;
  export const Clock: React.FC<LucideProps>;
  export const Target: React.FC<LucideProps>;
  export const Shield: React.FC<LucideProps>;
  export const Copy: React.FC<LucideProps>;
  export const Check: React.FC<LucideProps>;
  export const Users: React.FC<LucideProps>;
  export const DoorOpen: React.FC<LucideProps>;
  export const Loader2: React.FC<LucideProps>;
  export const Trophy: React.FC<LucideProps>;
  export const Frown: React.FC<LucideProps>;
  export const Scale: React.FC<LucideProps>;
  export const RotateCcw: React.FC<LucideProps>;
  export const Heart: React.FC<LucideProps>;
  export const Crosshair: React.FC<LucideProps>;
  export const Zap: React.FC<LucideProps>;
  export const RefreshCw: React.FC<LucideProps>;
  export const Play: React.FC<LucideProps>;
}

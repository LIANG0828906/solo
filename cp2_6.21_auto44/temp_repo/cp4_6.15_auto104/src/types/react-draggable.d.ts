declare module 'react-draggable' {
  import { ComponentType, ReactNode, RefObject } from 'react';

  interface DraggableProps {
    children: ReactNode;
    handle?: string;
    cancel?: string;
    disabled?: boolean;
    axis?: 'both' | 'x' | 'y' | 'none';
    bounds?: string | { left?: number; top?: number; right?: number; bottom?: number };
    grid?: [number, number];
    defaultPosition?: { x: number; y: number };
    position?: { x: number; y: number };
    scale?: number;
    nodeRef?: RefObject<HTMLElement>;
    onStart?: (e: any, data: any) => void;
    onDrag?: (e: any, data: any) => void;
    onStop?: (e: any, data: any) => void;
    onMouseDown?: (e: any) => void;
    offsetParent?: RefObject<HTMLElement>;
    allowAnyClick?: boolean;
    enableUserSelectHack?: boolean;
    positionOffset?: { x: string | number; y: string | number };
  }

  const Draggable: ComponentType<DraggableProps>;
  export default Draggable;
}

import { PuzzlePiece } from './puzzleCutter';

export interface DragState {
  isDragging: boolean;
  activePieceId: number | null;
  offsetX: number;
  offsetY: number;
  startX: number;
  startY: number;
  hasMoved: boolean;
}

export interface SnapResult {
  snapped: boolean;
  x: number;
  y: number;
}

const SNAP_THRESHOLD = 0.15;

export function createInitialDragState(): DragState {
  return {
    isDragging: false,
    activePieceId: null,
    offsetX: 0,
    offsetY: 0,
    startX: 0,
    startY: 0,
    hasMoved: false,
  };
}

export function checkSnap(
  piece: PuzzlePiece,
  currentX: number,
  currentY: number,
  pieceWidth: number,
  pieceHeight: number
): SnapResult {
  const threshold = Math.min(pieceWidth, pieceHeight) * SNAP_THRESHOLD;
  
  const dx = currentX - piece.correctX;
  const dy = currentY - piece.correctY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance < threshold) {
    return {
      snapped: true,
      x: piece.correctX,
      y: piece.correctY,
    };
  }
  
  return {
    snapped: false,
    x: currentX,
    y: currentY,
  };
}

export function rotatePiece(piece: PuzzlePiece, degrees: number = 90): PuzzlePiece {
  return {
    ...piece,
    rotation: piece.rotation + degrees,
  };
}

export function isPieceAtCorrectPosition(
  piece: PuzzlePiece,
  tolerance: number = 2
): boolean {
  const dx = Math.abs(piece.currentX - piece.correctX);
  const dy = Math.abs(piece.currentY - piece.correctY);
  const rotationOk = Math.abs(piece.rotation % 360) < tolerance || 
                     Math.abs(Math.abs(piece.rotation % 360) - 360) < tolerance;
  return dx < tolerance && dy < tolerance && rotationOk;
}

export function getEventCoordinates(
  e: MouseEvent | TouchEvent,
  container: HTMLElement
): { x: number; y: number } {
  const rect = container.getBoundingClientRect();
  
  if ('touches' in e) {
    const touch = e.touches[0] || e.changedTouches[0];
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  }
  
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

export function isClick(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  threshold: number = 5
): boolean {
  const dx = Math.abs(endX - startX);
  const dy = Math.abs(endY - startY);
  return dx < threshold && dy < threshold;
}

export function getPieceCenter(
  x: number,
  y: number,
  width: number,
  height: number
): { x: number; y: number } {
  return {
    x: x + width / 2,
    y: y + height / 2,
  };
}

let audioContext: AudioContext | null = null;

export function playSnapSound(): void {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (e) {
    // Audio not supported, silently fail
  }
}

export function playCompleteSound(): void {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const notes = [523.25, 659.25, 783.99, 1046.50];
    
    notes.forEach((freq, i) => {
      const oscillator = audioContext!.createOscillator();
      const gainNode = audioContext!.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext!.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      const startTime = audioContext!.currentTime + i * 0.15;
      gainNode.gain.setValueAtTime(0.2, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    });
  } catch (e) {
    // Audio not supported, silently fail
  }
}

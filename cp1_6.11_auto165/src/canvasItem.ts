export interface BoardElement {
  id: string;
  type: 'image' | 'color' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  style: {
    rotation: number;
    opacity: number;
    filter: string;
    zIndex: number;
  };
}

export function validateElement(el: BoardElement): boolean {
  if (typeof el.id !== 'string' || el.id === '') return false;
  if (el.type !== 'image' && el.type !== 'color' && el.type !== 'text') return false;
  if (typeof el.x !== 'number') return false;
  if (typeof el.y !== 'number') return false;
  if (typeof el.width !== 'number' || el.width <= 0) return false;
  if (typeof el.height !== 'number' || el.height <= 0) return false;
  if (typeof el.content !== 'string') return false;
  if (typeof el.style.rotation !== 'number') return false;
  if (typeof el.style.opacity !== 'number' || el.style.opacity < 0 || el.style.opacity > 1) return false;
  if (typeof el.style.filter !== 'string') return false;
  if (typeof el.style.zIndex !== 'number' || el.style.zIndex < 0) return false;
  return true;
}

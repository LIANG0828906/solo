export interface ControlState {
  showConstellations: boolean;
  rotationSpeed: number;
  resetView: () => void;
  onChange: (callback: () => void) => void;
}

export function createControls(): ControlState {
  const state: ControlState = {
    showConstellations: true,
    rotationSpeed: 1.0,
    resetView: () => {},
    onChange: () => {}

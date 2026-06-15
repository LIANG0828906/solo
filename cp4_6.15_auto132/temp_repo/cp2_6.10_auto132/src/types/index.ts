export interface ScreenData {
  id: number;
  title: string;
  author: string;
  dynasty: string;
  theme: string;
  colors: string[];
  pattern: string;
}

export interface LampState {
  screens: ScreenData[];
  screenOrder: number[];
  selectedIndex: number;
  speed: number;
  brightness: number;
  currentRotation: number;
  setSelectedIndex: (index: number) => void;
  setSpeed: (speed: number) => void;
  setBrightness: (brightness: number) => void;
  setScreenOrder: (order: number[]) => void;
  updateRotation: (delta: number) => void;
}

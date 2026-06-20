export interface HistoryEntry {
  id: string;
  timestamp: number;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  color: string;
  text: string;
}

export interface SliderTooltipState {
  visible: boolean;
  value: number;
  x: number;
}

export interface ClipTitle {
  text: string;
  fontSize: number;
  color: string;
  align: 'left' | 'center' | 'right';
}

export interface VideoClip {
  id: string;
  name: string;
  color: string;
  duration: number;
  startTime: number;
  trimIn: number;
  trimOut: number;
  title?: ClipTitle;
}

export type StickerType = 'star' | 'heart' | 'arrow' | 'explosion' | 'cloud';

export interface Sticker {
  id: string;
  type: StickerType;
  startTime: number;
  duration: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface EditorState {
  clips: VideoClip[];
  stickers: Sticker[];
  currentTime: number;
  selectedClipId: string | null;
  selectedStickerId: string | null;
  showTitleEditor: string | null;
}

export type EditorAction =
  | { type: 'ADD_CLIP'; payload: VideoClip }
  | { type: 'REMOVE_CLIP'; payload: string }
  | { type: 'REORDER_CLIPS'; payload: VideoClip[] }
  | { type: 'UPDATE_CLIP'; payload: VideoClip }
  | { type: 'SELECT_CLIP'; payload: string | null }
  | { type: 'SET_TITLE_EDITOR'; payload: string | null }
  | { type: 'UPDATE_CLIP_TITLE'; payload: { clipId: string; title: ClipTitle | undefined } }
  | { type: 'ADD_STICKER'; payload: Sticker }
  | { type: 'REMOVE_STICKER'; payload: string }
  | { type: 'UPDATE_STICKER'; payload: Sticker }
  | { type: 'SELECT_STICKER'; payload: string | null }
  | { type: 'SET_CURRENT_TIME'; payload: number }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'LOAD_STATE'; payload: EditorState };

export interface HistoryState {
  past: EditorState[];
  present: EditorState;
  future: EditorState[];
}

export type IconType = 'app' | 'folder' | 'document' | 'link' | 'note';

export interface DesktopIcon {
  id: string;
  type: IconType;
  name: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  parentId: string | null;
  color?: string;
  metadata?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface Folder {
  id: string;
  name: string;
  iconIds: string[];
  viewMode: 'grid' | 'list';
  expanded: boolean;
}

export type NoteColor = 'yellow' | 'blue' | 'pink' | 'green';

export interface StickyNote {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  x: number;
  y: number;
  zIndex: number;
  createdAt: number;
  updatedAt: number;
}

export interface OrganizeSuggestion {
  folderName: string;
  iconIds: string[];
  reason: string;
}

export interface DesktopLayout {
  icons: DesktopIcon[];
  folders: Folder[];
  notes: StickyNote[];
  gridSize: { cols: number; rows: number };
  locked: boolean;
  lastSyncedAt?: number;
}

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  iconId: string | null;
}

export interface SearchResult {
  id: string;
  type: 'icon' | 'note';
  label: string;
  icon?: React.ReactNode;
}

export const ICON_COLORS: Record<IconType, string> = {
  app: '#6b9ac4',
  folder: '#8fb98f',
  document: '#e6b87d',
  link: '#c48fb1',
  note: '#f5e68c',
};

export const NOTE_COLORS: Record<NoteColor, string> = {
  yellow: '#f5e68c',
  blue: '#8fb9d6',
  pink: '#e6a5b8',
  green: '#a5d6a5',
};

export const CATEGORIZE_RULES = [
  {
    name: '图片',
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp'],
    keywords: ['image', '图片', 'photo', 'screenshot', '截图'],
  },
  {
    name: '文档',
    extensions: ['.doc', '.docx', '.pdf', '.txt', '.md', '.xlsx', '.xls', '.ppt', '.pptx'],
    keywords: ['document', '文档', 'report', '报告', 'note', '笔记'],
  },
  {
    name: '应用',
    extensions: ['.exe', '.app', '.dmg', '.apk'],
    keywords: ['app', '应用', 'program', '程序', 'software', '软件'],
  },
  {
    name: '链接',
    extensions: ['.url', '.webloc'],
    keywords: ['link', '链接', 'url', 'website', '网站'],
  },
];

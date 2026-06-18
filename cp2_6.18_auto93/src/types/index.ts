export type ComponentType = 'rectangle' | 'circle' | 'text' | 'image' | 'button';

export type MemberRole = 'owner' | 'editor' | 'commenter' | 'viewer';

export interface ComponentInteraction {
  type: 'navigate' | 'modal' | 'animation';
  targetScreenId?: string;
  modalContent?: string;
  animationType?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  thumbnail?: string;
  updatedAt: string;
}

export interface Screen {
  id: string;
  projectId: string;
  name: string;
  order: number;
}

export interface Component {
  id: string;
  screenId: string;
  type: ComponentType;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor: string;
  borderRadius: number;
  borderColor: string;
  boxShadow?: string;
  locked?: boolean;
  text?: string;
  fontSize?: number;
  fontWeight?: string;
  imageUrl?: string;
  interaction?: ComponentInteraction;
}

export interface StylePreset {
  id: string;
  name: string;
  backgroundColor: string;
  borderColor: string;
  borderRadius: number;
  boxShadow: string;
}

export interface Connection {
  id: string;
  projectId: string;
  fromComponentId: string;
  toScreenId: string;
}

export interface Member {
  id: string;
  projectId: string;
  email: string;
  role: MemberRole;
  userId?: string;
}

export interface Comment {
  id: string;
  componentId: string;
  userId: string;
  text: string;
  timestamp: string;
}

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  componentId: string | null;
}

export type ToolType = ComponentType | 'connection' | null;

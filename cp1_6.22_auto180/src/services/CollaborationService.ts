import type {
  WSMessage,
  WSMessageType,
  Presentation,
  Collaborator,
  SlideElement,
  Slide,
} from '../types';
import { useEditorStore } from '../store';
import { COLLABORATOR_COLORS } from '../types';

type MessageHandler = (message: WSMessage) => void;

class CollaborationService {
  private ws: WebSocket | null = null;
  private handlers: Map<WSMessageType, MessageHandler> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private presentationId: string = 'default-room';
  private userName: string = '';

  constructor() {
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.handlers.set('join-ack', this.handleJoinAck.bind(this));
    this.handlers.set('collaborator-join', this.handleCollaboratorJoin.bind(this));
    this.handlers.set('collaborator-leave', this.handleCollaboratorLeave.bind(this));
    this.handlers.set('addElement', this.handleAddElement.bind(this));
    this.handlers.set('updateElement', this.handleUpdateElement.bind(this));
    this.handlers.set('deleteElement', this.handleDeleteElement.bind(this));
    this.handlers.set('selectElement', this.handleSelectElement.bind(this));
    this.handlers.set('addSlide', this.handleAddSlide.bind(this));
  }

  connect(presentationId: string, userName: string): void {
    this.presentationId = presentationId;
    this.userName = userName;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);
      this.ws.onopen = this.onOpen.bind(this);
      this.ws.onmessage = this.onMessage.bind(this);
      this.ws.onclose = this.onClose.bind(this);
      this.ws.onerror = this.onError.bind(this);
    } catch (e) {
      console.error('WebSocket connection error:', e);
    }
  }

  private onOpen(): void {
    console.log('[Collab] WebSocket connected');
    this.reconnectAttempts = 0;
    this.sendMessage('join', {
      presentationId: this.presentationId,
      userName: this.userName,
    });
  }

  private onMessage(event: MessageEvent): void {
    try {
      const message: WSMessage = JSON.parse(event.data);
      const handler = this.handlers.get(message.type);
      if (handler) {
        handler(message);
      }
    } catch (e) {
      console.error('Failed to parse WS message:', e);
    }
  }

  private onClose(): void {
    console.log('[Collab] WebSocket disconnected');
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * this.reconnectAttempts, 5000);
      setTimeout(() => {
        this.connect(this.presentationId, this.userName);
      }, delay);
    }
  }

  private onError(error: Event): void {
    console.error('[Collab] WebSocket error:', error);
  }

  private handleJoinAck(message: WSMessage): void {
    const { collaboratorId, presentation, collaborators } = message.payload;
    useEditorStore.getState().setLocalCollaboratorId(collaboratorId);
    if (presentation) {
      useEditorStore.getState().setPresentation(presentation);
    }
    if (collaborators) {
      useEditorStore.getState().setCollaborators(collaborators);
    }
  }

  private handleCollaboratorJoin(message: WSMessage): void {
    const { collaborator } = message.payload;
    if (collaborator.id !== useEditorStore.getState().localCollaboratorId) {
      useEditorStore.getState().addCollaborator(collaborator);
    }
  }

  private handleCollaboratorLeave(message: WSMessage): void {
    const { collaboratorId } = message.payload;
    useEditorStore.getState().removeCollaborator(collaboratorId);
  }

  private handleAddElement(message: WSMessage): void {
    if (this.isLocalMessage(message)) return;
    const { slideId, element } = message.payload;
    const state = useEditorStore.getState();
    const slide = state.presentation.slides.find((s) => s.id === slideId);
    if (slide && !slide.elements.find((e) => e.id === element.id)) {
      useEditorStore.getState().updateElement(slideId, '', {});
      state.presentation.slides = state.presentation.slides.map((s) =>
        s.id === slideId ? { ...s, elements: [...s.elements, element] } : s
      );
      useEditorStore.setState({ presentation: { ...state.presentation } });
    }
  }

  private handleUpdateElement(message: WSMessage): void {
    if (this.isLocalMessage(message)) return;
    const { slideId, elementId, updates } = message.payload;
    useEditorStore.getState().updateElement(slideId, elementId, updates);
  }

  private handleDeleteElement(message: WSMessage): void {
    if (this.isLocalMessage(message)) return;
    const { slideId, elementId } = message.payload;
    useEditorStore.getState().deleteElement(slideId, elementId);
  }

  private handleSelectElement(message: WSMessage): void {
    if (this.isLocalMessage(message)) return;
    const { elementId } = message.payload;
    useEditorStore.getState().updateCollaboratorSelection(message.senderId, elementId);
  }

  private handleAddSlide(message: WSMessage): void {
    if (this.isLocalMessage(message)) return;
    const { slide } = message.payload;
    const state = useEditorStore.getState();
    if (!state.presentation.slides.find((s) => s.id === slide.id)) {
      state.presentation.slides.push(slide);
      useEditorStore.setState({ presentation: { ...state.presentation } });
    }
  }

  private isLocalMessage(message: WSMessage): boolean {
    return message.senderId === useEditorStore.getState().localCollaboratorId;
  }

  sendMessage(type: WSMessageType, payload: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[Collab] WebSocket not ready, message queued');
      return;
    }

    const message: WSMessage = {
      type,
      payload,
      senderId: useEditorStore.getState().localCollaboratorId || 'local',
      timestamp: Date.now(),
    };

    this.ws.send(JSON.stringify(message));
  }

  broadcastAddElement(slideId: string, element: SlideElement): void {
    this.sendMessage('addElement', { slideId, element });
  }

  broadcastUpdateElement(slideId: string, elementId: string, updates: Partial<SlideElement>): void {
    this.sendMessage('updateElement', { slideId, elementId, updates });
  }

  broadcastDeleteElement(slideId: string, elementId: string): void {
    this.sendMessage('deleteElement', { slideId, elementId });
  }

  broadcastSelectElement(elementId: string | null): void {
    this.sendMessage('selectElement', { elementId });
  }

  broadcastAddSlide(slide: Slide): void {
    this.sendMessage('addSlide', { slide });
  }

  getAssignedColor(collaboratorIndex: number): string {
    return COLLABORATOR_COLORS[collaboratorIndex % COLLABORATOR_COLORS.length];
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const collaborationService = new CollaborationService();

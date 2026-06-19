import { useStore } from '../../store/useStore';
import type { Message, Conversation } from '../../types';

export const ChatService = {
  sendMessage(conversationId: string, content: string): void {
    useStore.getState().sendMessage(conversationId, content);
  },

  getConversation(itemId: string): Conversation | undefined {
    return useStore.getState().getConversation(itemId);
  },

  startConversation(itemId: string): string {
    return useStore.getState().startConversation(itemId);
  },

  getMessages(conversationId: string): Message[] {
    const state = useStore.getState();
    return state.messages[conversationId] || [];
  },

  getRecentMessages(conversationId: string, limit: number = 50): Message[] {
    const allMessages = this.getMessages(conversationId);
    return allMessages.slice(-limit);
  },

  confirmExchange(itemId: string): void {
    useStore.getState().confirmExchange(itemId);
  },
};

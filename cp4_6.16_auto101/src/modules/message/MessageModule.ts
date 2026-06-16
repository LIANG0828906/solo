import { v4 as uuidv4 } from 'uuid';
import type {
  Message,
  Conversation,
  ChannelMessage,
  ChannelMessageType,
} from '../../types';
import {
  getAllMessages,
  saveMessages,
} from '../../utils/storage';

const CHANNEL_NAME = 'skillswap-hub-channel';
let broadcastChannel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel {
  if (!broadcastChannel) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
  return broadcastChannel;
}

export const MessageModule = {
  initChannel(callback: (message: ChannelMessage) => void): void {
    const channel = getChannel();
    channel.onmessage = (event) => {
      callback(event.data);
    };
  },

  closeChannel(): void {
    if (broadcastChannel) {
      broadcastChannel.close();
      broadcastChannel = null;
    }
  },

  broadcast(type: ChannelMessageType, payload: any): void {
    const channel = getChannel();
    const message: ChannelMessage = {
      type,
      payload,
      timestamp: Date.now(),
    };
    channel.postMessage(message);
  },

  async sendMessage(
    exchangeRequestId: string,
    senderId: string,
    content: string
  ): Promise<Message> {
    const messages = await getAllMessages();
    const newMessage: Message = {
      id: uuidv4(),
      exchangeRequestId,
      senderId,
      content,
      timestamp: Date.now(),
      status: 'sent',
    };
    messages.push(newMessage);
    await saveMessages(messages);

    this.broadcast('new_message', { message: newMessage });

    return newMessage;
  },

  async getMessages(exchangeRequestId: string): Promise<Message[]> {
    const messages = await getAllMessages();
    return messages
      .filter((m) => m.exchangeRequestId === exchangeRequestId)
      .sort((a, b) => a.timestamp - b.timestamp);
  },

  async getConversations(
    userId: string,
    exchangeRequests: Array<{
      id: string;
      requesterId: string;
      recipientId: string;
      status: string;
      createdAt?: number;
    }>,
    users: Array<{ id: string; username: string }>
  ): Promise<Conversation[]> {
    const messages = await getAllMessages();

    const userRequests = exchangeRequests.filter(
      (r) =>
        r.requesterId === userId ||
        (r.recipientId === userId && r.status !== 'rejected')
    );

    const conversations: Conversation[] = [];

    for (const request of userRequests) {
      const otherUserId =
        request.requesterId === userId
          ? request.recipientId
          : request.requesterId;
      const otherUser = users.find((u) => u.id === otherUserId);
      if (!otherUser) continue;

      const requestMessages = messages
        .filter((m) => m.exchangeRequestId === request.id)
        .sort((a, b) => b.timestamp - a.timestamp);

      const lastMessage = requestMessages[0];
      const unreadCount = requestMessages.filter(
        (m) => m.senderId !== userId && m.status === 'sent'
      ).length;

      conversations.push({
        exchangeRequestId: request.id,
        otherUserId,
        otherUserName: otherUser.username,
        lastMessage: lastMessage ? lastMessage.content : '开始聊天吧',
        lastMessageTime: lastMessage
          ? lastMessage.timestamp
          : request.createdAt || Date.now(),
        unreadCount,
      });
    }

    return conversations.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
  },

  async markAsRead(exchangeRequestId: string, userId: string): Promise<void> {
    const messages = await getAllMessages();
    let updated = false;
    for (const msg of messages) {
      if (
        msg.exchangeRequestId === exchangeRequestId &&
        msg.senderId !== userId &&
        msg.status === 'sent'
      ) {
        msg.status = 'delivered';
        updated = true;
      }
    }
    if (updated) {
      await saveMessages(messages);
    }
  },
};

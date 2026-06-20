export type DrawPoint = {
  x: number;
  y: number;
  color: string;
  size: number;
  timestamp: number;
};

export type DrawStrokeMessage = {
  type: 'draw';
  userId: string;
  strokeId: string;
  points: DrawPoint[];
};

export type OnlineUser = {
  id: string;
  name: string;
  avatarColor: string;
  avatarPattern: number[];
};

export type UserJoinMessage = {
  type: 'user-join';
  user: OnlineUser;
};

export type UserLeaveMessage = {
  type: 'user-leave';
  userId: string;
};

export type ChannelMessage = DrawStrokeMessage | UserJoinMessage | UserLeaveMessage;

const CHANNEL_NAME = 'drawing-board-channel';

export function createDrawingChannel(): BroadcastChannel {
  return new BroadcastChannel(CHANNEL_NAME);
}

export function sendMessage(channel: BroadcastChannel, msg: ChannelMessage): void {
  channel.postMessage(JSON.stringify(msg));
}

export function onMessage(
  channel: BroadcastChannel,
  callback: (msg: ChannelMessage) => void
): void {
  const handler = (event: MessageEvent) => {
    try {
      const msg: ChannelMessage = JSON.parse(event.data);
      callback(msg);
    } catch {
    }
  };
  channel.addEventListener('message', handler);
}

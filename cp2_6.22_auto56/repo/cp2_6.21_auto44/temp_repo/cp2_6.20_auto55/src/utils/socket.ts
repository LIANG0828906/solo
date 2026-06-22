// 事件回调类型
type EventCallback = (data: any) => void;

// WebSocket 管理类
class SocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000;
  private isManualClose: boolean = false;
  private eventListeners: Map<string, EventCallback[]> = new Map();

  constructor() {
    this.url = `ws://${window.location.host}/ws`;
  }

  // 建立连接
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isManualClose = false;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { event: eventName, data } = message;
        this.emit(eventName, data);
      } catch (e) {
        console.error('WebSocket 消息解析失败:', e);
      }
    };

    this.ws.onclose = () => {
      if (!this.isManualClose) {
        this.reconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket 连接错误:', error);
    };
  }

  // 断开连接
  disconnect(): void {
    this.isManualClose = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // 自动重连
  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('WebSocket 重连次数已达上限');
      return;
    }

    this.reconnectAttempts++;
    setTimeout(() => {
      if (!this.isManualClose) {
        this.connect();
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  // 发送消息
  send(event: string, data?: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, data }));
    } else {
      console.warn('WebSocket 未连接，消息发送失败');
    }
  }

  // 监听事件
  on(event: string, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  // 取消监听事件
  off(event: string, callback: EventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // 触发事件
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (e) {
          console.error(`WebSocket 事件 ${event} 回调执行失败:`, e);
        }
      });
    }
  }

  // 获取连接状态
  getStatus(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}

// 导出单例
const socket = new SocketManager();
export default socket;

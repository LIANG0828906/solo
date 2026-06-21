/**
 * 数据接收模块
 * 职责：建立WebSocket连接，接收并解析后端推送的JSON数据
 * 按房间ID分类存储，导出给渲染模块调用
 * 数据流向：后端WebSocket → dataReceiver → sceneRenderer
 */

export type SensorType = 'temperature' | 'humidity' | 'light' | 'airQuality';

export interface RoomData {
  roomId: number;
  roomName: string;
  temperature: number;
  humidity: number;
  light: number;
  airQuality: number;
  timestamp: number;
}

export interface SensorUpdate {
  roomId: number;
  roomName: string;
  type: SensorType;
  value: number;
  timestamp: number;
}

type DataCallback = (rooms: Map<number, RoomData>, updates?: SensorUpdate[]) => void;

const WS_URL = 'ws://localhost:3000/ws';
const RECONNECT_INTERVAL = 3000;

class DataReceiver {
  private ws: WebSocket | null = null;
  private rooms: Map<number, RoomData> = new Map();
  private listeners: Set<DataCallback> = new Set();
  private reconnectAttempts: number = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private manualClose: boolean = false;
  private lastUpdateTime: number = 0;
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';

  constructor() {
    this.initializeRooms();
  }

  private initializeRooms(): void {
    const defaultRooms: { id: number; name: string }[] = [
      { id: 1, name: '客厅' },
      { id: 2, name: '厨房' },
      { id: 3, name: '卧室' },
      { id: 4, name: '书房' }
    ];

    for (const room of defaultRooms) {
      this.rooms.set(room.id, {
        roomId: room.id,
        roomName: room.name,
        temperature: 25,
        humidity: 55,
        light: 400,
        airQuality: 60,
        timestamp: Date.now()
      });
    }
  }

  public connect(): void {
    if (this.connectionStatus !== 'disconnected') return;
    this.manualClose = false;
    this.establishConnection();
  }

  private establishConnection(): void {
    this.connectionStatus = 'connecting';
    console.log(`[DataReceiver] 正在连接 ${WS_URL} (尝试 ${this.reconnectAttempts + 1})`);

    try {
      this.ws = new WebSocket(WS_URL);
    } catch (err) {
      console.error('[DataReceiver] WebSocket 创建失败:', err);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.connectionStatus = 'connected';
      this.reconnectAttempts = 0;
      console.log('[DataReceiver] WebSocket 已连接');
    };

    this.ws.onmessage = (event: MessageEvent) => {
      this.handleMessage(event.data);
    };

    this.ws.onerror = (error: Event) => {
      console.error('[DataReceiver] WebSocket 错误:', error);
    };

    this.ws.onclose = (event: CloseEvent) => {
      this.connectionStatus = 'disconnected';
      console.log(`[DataReceiver] WebSocket 已关闭 (code: ${event.code})`);
      if (!this.manualClose) {
        this.scheduleReconnect();
      }
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      if (!this.manualClose) {
        this.establishConnection();
      }
    }, RECONNECT_INTERVAL);
  }

  private handleMessage(data: string): void {
    try {
      const msg = JSON.parse(data);

      switch (msg.type) {
        case 'welcome':
          console.log('[DataReceiver] 收到欢迎消息，客户端ID:', msg.clientId);
          break;

        case 'snapshot':
          this.handleSnapshot(msg);
          break;

        case 'updates':
          this.handleUpdates(msg);
          break;

        case 'ping':
          this.sendPong();
          break;

        case 'pong':
          break;

        default:
          console.log('[DataReceiver] 未知消息类型:', msg.type);
      }
    } catch (err) {
      console.error('[DataReceiver] 消息解析失败:', err);
    }
  }

  private handleSnapshot(snap: any): void {
    if (!snap.rooms || !Array.isArray(snap.rooms)) return;

    for (const room of snap.rooms) {
      this.rooms.set(room.roomId, {
        roomId: room.roomId,
        roomName: room.roomName,
        temperature: room.temperature,
        humidity: room.humidity,
        light: room.light,
        airQuality: room.airQuality,
        timestamp: snap.timestamp || Date.now()
      });
    }

    this.lastUpdateTime = snap.timestamp || Date.now();
    this.notifyListeners();
  }

  private handleUpdates(msg: any): void {
    const updates: SensorUpdate[] = msg.updates || [];
    if (updates.length === 0) return;

    for (const update of updates) {
      const room = this.rooms.get(update.roomId);
      if (room) {
        (room as any)[update.type] = update.value;
        room.timestamp = update.timestamp;
      }
    }

    this.lastUpdateTime = msg.timestamp || Date.now();
    this.notifyListeners(updates);
  }

  private sendPong(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping' }));
    }
  }

  private notifyListeners(updates?: SensorUpdate[]): void {
    this.listeners.forEach(fn => {
      try {
        fn(new Map(this.rooms), updates);
      } catch (e) {
        console.error('[DataReceiver] 监听器执行错误:', e);
      }
    });
  }

  public onData(callback: DataCallback): () => void {
    this.listeners.add(callback);
    callback(new Map(this.rooms));
    return () => this.listeners.delete(callback);
  }

  public getRoomData(roomId: number): RoomData | undefined {
    return this.rooms.get(roomId);
  }

  public getAllRooms(): Map<number, RoomData> {
    return new Map(this.rooms);
  }

  public getLastUpdateTime(): number {
    return this.lastUpdateTime;
  }

  public getConnectionStatus(): 'disconnected' | 'connecting' | 'connected' {
    return this.connectionStatus;
  }

  public requestSnapshot(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'requestSnapshot' }));
    }
  }

  public disconnect(): void {
    this.manualClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionStatus = 'disconnected';
  }

  public computeHeatValue(roomData: RoomData): number {
    const normTemp = this.normalize(roomData.temperature, 18, 32);
    const normHum = this.normalize(roomData.humidity, 30, 85);
    const normLight = this.normalize(roomData.light, 50, 900);
    const normAir = this.normalize(roomData.airQuality, 20, 180);

    return (normTemp * 0.35 + normHum * 0.2 + normLight * 0.2 + normAir * 0.25);
  }

  private normalize(value: number, min: number, max: number): number {
    return Math.min(Math.max((value - min) / (max - min), 0), 1);
  }
}

export const dataReceiver = new DataReceiver();
export default dataReceiver;

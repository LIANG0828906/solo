import { Direction, Snake, Food, DeathParticle } from './types';

type OnStateChange = (snakes: Map<string, Snake>, foods: Map<string, Food>, deathParticles: DeathParticle[]) => void;
type OnWelcome = (playerId: string) => void;
type OnPlayerJoined = (playerId: string) => void;
type OnPlayerLeft = (playerId: string) => void;
type OnConnected = () => void;
type OnDisconnected = () => void;

export class NetworkManager {
  private ws: WebSocket | null = null;
  private url: string;
  private playerId: string = '';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 1000;
  private shouldReconnect: boolean = true;

  private onStateChange?: OnStateChange;
  private onWelcome?: OnWelcome;
  private onPlayerJoined?: OnPlayerJoined;
  private onPlayerLeft?: OnPlayerLeft;
  private onConnected?: OnConnected;
  private onDisconnected?: OnDisconnected;

  private serverTimeOffset: number = 0;
  private lastServerState: any = null;
  private stateBuffer: { state: any; timestamp: number }[] = [];
  private interpolationDelay: number = 100;

  constructor(url: string = 'ws://localhost:3001') {
    this.url = url;
  }

  setOnStateChange(cb: OnStateChange) { this.onStateChange = cb; }
  setOnWelcome(cb: OnWelcome) { this.onWelcome = cb; }
  setOnPlayerJoined(cb: OnPlayerJoined) { this.onPlayerJoined = cb; }
  setOnPlayerLeft(cb: OnPlayerLeft) { this.onPlayerLeft = cb; }
  setOnConnected(cb: OnConnected) { this.onConnected = cb; }
  setOnDisconnected(cb: OnDisconnected) { this.onDisconnected = cb; }

  connect() {
    try {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
    } catch (e) {
      console.error('Failed to connect:', e);
      this.scheduleReconnect();
    }
  }

  private handleOpen() {
    console.log('Connected to server');
    this.reconnectAttempts = 0;
    this.onConnected?.();
    this.sendJoin();
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message = JSON.parse(event.data);

      if (message.type === 'welcome') {
        this.playerId = message.data.playerId;
        this.serverTimeOffset = Date.now() - message.data.serverTime;
        this.onWelcome?.(this.playerId);
      } else if (message.type === 'state') {
        const now = Date.now();
        this.lastServerState = message.data;
        this.stateBuffer.push({ state: message.data, timestamp: now });

        while (this.stateBuffer.length > 10) {
          this.stateBuffer.shift();
        }

        this.processInterpolatedState();
      } else if (message.type === 'player-joined') {
        this.onPlayerJoined?.(message.data.playerId);
      } else if (message.type === 'player-left') {
        this.onPlayerLeft?.(message.data.playerId);
      }
    } catch (e) {
      console.error('Failed to parse message:', e);
    }
  }

  private processInterpolatedState() {
    const now = Date.now();
    const renderTime = now - this.serverTimeOffset - this.interpolationDelay;

    if (this.stateBuffer.length < 2) {
      if (this.lastServerState) {
        this.applyState(this.lastServerState);
      }
      return;
    }

    let prevState = this.stateBuffer[0];
    let nextState = this.stateBuffer[1];

    for (let i = 0; i < this.stateBuffer.length - 1; i++) {
      if (this.stateBuffer[i].timestamp <= renderTime && this.stateBuffer[i + 1].timestamp >= renderTime) {
        prevState = this.stateBuffer[i];
        nextState = this.stateBuffer[i + 1];
        break;
      }
    }

    const timeRange = nextState.timestamp - prevState.timestamp;
    const t = timeRange > 0 ? (renderTime - prevState.timestamp) / timeRange : 0;
    const clampedT = Math.max(0, Math.min(1, t));

    const interpolatedState = this.interpolateStates(prevState.state, nextState.state, clampedT);
    this.applyState(interpolatedState);
  }

  private interpolateStates(prev: any, next: any, t: number): any {
    const interpolated = JSON.parse(JSON.stringify(next));

    const prevSnakes = new Map(prev.snakes.map((s: Snake) => [s.id, s]));
    const nextSnakes = new Map(next.snakes.map((s: Snake) => [s.id, s]));

    interpolated.snakes = next.snakes.map((nextSnake: Snake) => {
      const prevSnake = prevSnakes.get(nextSnake.id);
      if (!prevSnake) return nextSnake;

      const interpolatedSegments = nextSnake.segments.map((seg, i) => {
        const prevSeg = prevSnake.segments[i];
        if (!prevSeg) return seg;
        return {
          x: prevSeg.x + (seg.x - prevSeg.x) * t,
          y: prevSeg.y + (seg.y - prevSeg.y) * t,
        };
      });

      return {
        ...nextSnake,
        segments: interpolatedSegments,
      };
    });

    const prevParticles = new Map((prev.deathParticles || []).map((p: DeathParticle) => [p.id, p]));
    interpolated.deathParticles = (next.deathParticles || []).map((nextP: DeathParticle) => {
      const prevP = prevParticles.get(nextP.id);
      if (!prevP) return nextP;
      return {
        ...nextP,
        x: prevP.x + (nextP.x - prevP.x) * t,
        y: prevP.y + (nextP.y - prevP.y) * t,
      };
    });

    return interpolated;
  }

  private applyState(data: any) {
    const snakes = new Map<string, Snake>(data.snakes.map((s: Snake) => [s.id, s]));
    const foods = new Map<string, Food>(data.foods.map((f: Food) => [f.id, f]));
    const deathParticles = data.deathParticles || [];
    this.onStateChange?.(snakes, foods, deathParticles);
  }

  private handleClose() {
    console.log('Disconnected from server');
    this.onDisconnected?.();
    if (this.shouldReconnect) {
      this.scheduleReconnect();
    }
  }

  private handleError(error: Event) {
    console.error('WebSocket error:', error);
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect();
      }
    }, delay);
  }

  sendDirection(direction: Direction) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'direction',
        data: { playerId: this.playerId, direction },
      }));
    }
  }

  private sendJoin() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'join',
        data: { playerId: this.playerId || undefined },
      }));
    }
  }

  getPlayerId(): string {
    return this.playerId;
  }

  getLatency(): number {
    return this.interpolationDelay;
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

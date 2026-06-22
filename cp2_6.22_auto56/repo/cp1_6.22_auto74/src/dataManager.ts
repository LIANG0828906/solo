import type {
  MatchData,
  PlayerPosition,
  KillEvent,
  PlayerInfo,
  TeamStats,
  KillMarker,
} from './types';
import matchData from './data/matchData.json';

type EventCallback = (event: PlayerPosition | KillEvent) => void;
type StatsCallback = (stats: { red: TeamStats; blue: TeamStats }) => void;
type TimeCallback = (time: number) => void;

class MockWebSocket {
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  constructor(_url: string) {
    setTimeout(() => {
      this.onopen?.({ type: 'open' } as Event);
    }, 100);
  }

  send(data: string): void {
    setTimeout(() => {
      this.onmessage?.({ data } as MessageEvent);
    }, 0);
  }

  close(): void {
    setTimeout(() => {
      this.onclose?.({ type: 'close', code: 1000, reason: '', wasClean: true } as CloseEvent);
    }, 100);
  }
}

export class DataManager {
  private data: MatchData = matchData as MatchData;
  private ws: MockWebSocket | null = null;
  private currentTime: number = 0;
  private isPlaying: boolean = false;
  private playbackInterval: number | null = null;
  private eventIndex: number = 0;
  private eventCallbacks: EventCallback[] = [];
  private statsCallbacks: StatsCallback[] = [];
  private timeCallbacks: TimeCallback[] = [];
  private redStats: TeamStats = { kills: 0, deaths: 0 };
  private blueStats: TeamStats = { kills: 0, deaths: 0 };
  private filterRed: boolean = true;
  private filterBlue: boolean = true;
  private killMarkers: KillMarker[] = [];

  constructor() {
    this.extractKillMarkers();
  }

  private extractKillMarkers(): void {
    this.killMarkers = this.data.events
      .filter((e): e is KillEvent => e.eventType === 'kill')
      .map((e) => ({
        id: `${e.timestamp}-${e.playerId}-${e.victimId}`,
        timestamp: e.timestamp,
        x: e.x,
        y: e.y,
        killerId: e.playerId,
        victimId: e.victimId,
        killerTeam: e.teamId,
      }));
  }

  public init(): Promise<void> {
    return new Promise((resolve) => {
      this.ws = new MockWebSocket('ws://localhost:8080/match');
      this.ws.onopen = () => {
        this.ws?.send(JSON.stringify({ type: 'subscribe', matchId: this.data.matchId }));
        resolve();
      };
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'event') {
            this.processEvent(data.payload);
          }
        } catch {
          // Ignore parse errors
        }
      };
    });
  }

  private processEvent(event: PlayerPosition | KillEvent): void {
    const shouldProcess =
      (event.teamId === 'red' && this.filterRed) ||
      (event.teamId === 'blue' && this.filterBlue);

    if (!shouldProcess) return;

    this.eventCallbacks.forEach((cb) => cb(event));

    if (event.eventType === 'kill') {
      this.updateStats(event as KillEvent);
    }
  }

  private updateStats(event: KillEvent): void {
    if (event.teamId === 'red') {
      this.redStats.kills++;
      this.blueStats.deaths++;
    } else {
      this.blueStats.kills++;
      this.redStats.deaths++;
    }
    this.statsCallbacks.forEach((cb) =>
      cb({ red: { ...this.redStats }, blue: { ...this.blueStats } })
    );
  }

  public start(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.startPlayback();
  }

  public pause(): void {
    this.isPlaying = false;
    if (this.playbackInterval !== null) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
  }

  private startPlayback(): void {
    const playbackSpeed = 1;
    const intervalMs = 50;

    this.playbackInterval = window.setInterval(() => {
      if (!this.isPlaying) return;

      this.currentTime += (intervalMs / 1000) * playbackSpeed;

      if (this.currentTime >= this.data.duration) {
        this.currentTime = this.data.duration;
        this.pause();
        this.timeCallbacks.forEach((cb) => cb(this.currentTime));
        return;
      }

      this.pushEventsUpTo(this.currentTime);
      this.timeCallbacks.forEach((cb) => cb(this.currentTime));
    }, intervalMs);
  }

  private pushEventsUpTo(time: number): void {
    while (
      this.eventIndex < this.data.events.length &&
      this.data.events[this.eventIndex].timestamp <= time
    ) {
      const event = this.data.events[this.eventIndex];
      this.ws?.send(JSON.stringify({ type: 'event', payload: event }));
      this.eventIndex++;
    }
  }

  public seekToTime(time: number): void {
    const wasPlaying = this.isPlaying;
    this.pause();

    this.currentTime = Math.max(0, Math.min(time, this.data.duration));
    this.eventIndex = 0;
    this.redStats = { kills: 0, deaths: 0 };
    this.blueStats = { kills: 0, deaths: 0 };

    this.statsCallbacks.forEach((cb) =>
      cb({ red: { ...this.redStats }, blue: { ...this.blueStats } })
    );

    while (
      this.eventIndex < this.data.events.length &&
      this.data.events[this.eventIndex].timestamp <= this.currentTime
    ) {
      const event = this.data.events[this.eventIndex];
      if (event.eventType === 'kill') {
        this.updateStats(event as KillEvent);
      }
      this.eventIndex++;
    }

    this.timeCallbacks.forEach((cb) => cb(this.currentTime));

    if (wasPlaying) {
      this.start();
    }
  }

  public setTeamFilter(showRed: boolean, showBlue: boolean): void {
    this.filterRed = showRed;
    this.filterBlue = showBlue;
  }

  public onEvent(callback: EventCallback): () => void {
    this.eventCallbacks.push(callback);
    return () => {
      this.eventCallbacks = this.eventCallbacks.filter((cb) => cb !== callback);
    };
  }

  public onStatsUpdate(callback: StatsCallback): () => void {
    this.statsCallbacks.push(callback);
    return () => {
      this.statsCallbacks = this.statsCallbacks.filter((cb) => cb !== callback);
    };
  }

  public onTimeUpdate(callback: TimeCallback): () => void {
    this.timeCallbacks.push(callback);
    return () => {
      this.timeCallbacks = this.timeCallbacks.filter((cb) => cb !== callback);
    };
  }

  public getDuration(): number {
    return this.data.duration;
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public getPlayers(): PlayerInfo[] {
    return this.data.players;
  }

  public getKillMarkers(): KillMarker[] {
    return this.killMarkers;
  }

  public getStats(): { red: TeamStats; blue: TeamStats } {
    return {
      red: { ...this.redStats },
      blue: { ...this.blueStats },
    };
  }

  public getEventsAtTime(time: number): (PlayerPosition | KillEvent)[] {
    return this.data.events.filter((e) => Math.abs(e.timestamp - time) < 0.1);
  }

  public isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  public dispose(): void {
    this.pause();
    this.ws?.close();
    this.eventCallbacks = [];
    this.statsCallbacks = [];
    this.timeCallbacks = [];
  }
}

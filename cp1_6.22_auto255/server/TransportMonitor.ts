import { Server as SocketIOServer } from 'socket.io';
import { TransportStatus, Exhibition, TransportUpdate, TransportTimelineNode } from './types';

const STATUS_FLOW: TransportStatus[] = [
  TransportStatus.OUT_FOR_DELIVERY,
  TransportStatus.IN_TRANSIT,
  TransportStatus.ARRIVED
];

const STATUS_DESCRIPTIONS: Record<TransportStatus, string> = {
  [TransportStatus.PENDING]: '待出库',
  [TransportStatus.OUT_FOR_DELIVERY]: '已出库',
  [TransportStatus.IN_TRANSIT]: '运输中',
  [TransportStatus.ARRIVED]: '已抵达'
};

export class TransportMonitor {
  private io: SocketIOServer;
  private exhibitions: Map<string, Exhibition>;
  private timer: NodeJS.Timeout | null = null;
  private minInterval: number = 8000;
  private maxInterval: number = 15000;

  constructor(io: SocketIOServer, exhibitions: Map<string, Exhibition>) {
    this.io = io;
    this.exhibitions = exhibitions;
  }

  start() {
    this.scheduleNextUpdate();
    console.log('[TransportMonitor] 运输监控已启动');
  }

  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    console.log('[TransportMonitor] 运输监控已停止');
  }

  private scheduleNextUpdate() {
    const interval = this.minInterval + Math.random() * (this.maxInterval - this.minInterval);
    this.timer = setTimeout(() => {
      this.simulateUpdate();
      this.scheduleNextUpdate();
    }, interval);
  }

  private simulateUpdate() {
    const candidates: { exhibitionId: string; artworkIndex: number; currentStatus: TransportStatus }[] = [];

    for (const [exhibitionId, exhibition] of this.exhibitions) {
      exhibition.artworks.forEach((artwork, index) => {
        if (artwork.transportStatus !== TransportStatus.ARRIVED) {
          candidates.push({
            exhibitionId,
            artworkIndex: index,
            currentStatus: artwork.transportStatus
          });
        }
      });
    }

    if (candidates.length === 0) {
      return;
    }

    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    const exhibition = this.exhibitions.get(selected.exhibitionId);
    if (!exhibition) return;

    const artwork = exhibition.artworks[selected.artworkIndex];
    const currentIndex = STATUS_FLOW.indexOf(artwork.transportStatus);
    const nextStatus = currentIndex === -1 ? STATUS_FLOW[0] : STATUS_FLOW[currentIndex + 1];

    if (!nextStatus) return;

    const newTimelineNode: TransportTimelineNode = {
      status: nextStatus,
      timestamp: Date.now(),
      description: STATUS_DESCRIPTIONS[nextStatus]
    };

    artwork.transportStatus = nextStatus;
    artwork.transportTimeline.push(newTimelineNode);

    const update: TransportUpdate = {
      exhibitionId: selected.exhibitionId,
      artworkId: artwork.id,
      newStatus: nextStatus,
      artworkName: artwork.name,
      timeline: [...artwork.transportTimeline],
      timestamp: Date.now()
    };

    this.io.emit('transport-update', update);
    console.log(`[TransportMonitor] 展品「${artwork.name}」状态更新: ${nextStatus}`);
  }

  setExhibitions(exhibitions: Map<string, Exhibition>) {
    this.exhibitions = exhibitions;
  }
}

/**
 * 应用主入口模块
 * 职责：导入并协调dataReceiver和sceneRenderer，启动应用
 * 数据流向：main.ts → 协调dataReceiver和sceneRenderer
 */

import { dataReceiver, RoomData } from './dataReceiver';
import { SceneRenderer } from './sceneRenderer';

const ROOM_NAMES: Record<number, string> = {
  1: '客厅',
  2: '厨房',
  3: '卧室',
  4: '书房'
};

class App {
  private renderer!: SceneRenderer;
  private timeLabel: HTMLElement;
  private infoPanel: HTMLElement;
  private closeBtn: HTMLElement;

  constructor() {
    this.timeLabel = document.getElementById('time-label')!;
    this.infoPanel = document.getElementById('info-panel')!;
    this.closeBtn = document.getElementById('close-panel')!;

    this.init();
  }

  private init(): void {
    try {
      this.renderer = new SceneRenderer('canvas-container');
    } catch (e) {
      console.error('初始化渲染器失败:', e);
      return;
    }

    this.renderer.onRoomClick(this.handleRoomClick.bind(this));
    this.closeBtn.addEventListener('click', () => this.hidePanel());

    dataReceiver.onData((rooms) => {
      this.renderer.updateAllRooms(rooms);
      this.updateTimeLabel();
    });

    dataReceiver.connect();
    this.renderer.start();

    this.startTimeTicker();

    console.log('[App] 智能家居3D热力图应用已启动');
    console.log(`[App] 当前FPS: ${this.renderer.getFPS()}`);
  }

  private handleRoomClick(roomId: number, roomData: RoomData): void {
    this.showPanel(roomId, roomData);
  }

  private showPanel(roomId: number, data: RoomData): void {
    const nameEl = document.getElementById('room-name')!;
    const tempEl = document.getElementById('temp-value')!;
    const humEl = document.getElementById('hum-value')!;
    const lightEl = document.getElementById('light-value')!;
    const airEl = document.getElementById('air-value')!;

    nameEl.textContent = ROOM_NAMES[roomId] || data.roomName;
    tempEl.textContent = `${data.temperature.toFixed(1)} ℃`;
    humEl.textContent = `${data.humidity.toFixed(1)} %`;
    lightEl.textContent = `${data.light.toFixed(0)} lux`;
    airEl.textContent = `${data.airQuality.toFixed(0)} AQI`;

    this.infoPanel.classList.add('visible');
  }

  private hidePanel(): void {
    this.infoPanel.classList.remove('visible');
  }

  private updateTimeLabel(): void {
    const ts = dataReceiver.getLastUpdateTime() || Date.now();
    const time = new Date(ts);
    const hh = String(time.getHours()).padStart(2, '0');
    const mm = String(time.getMinutes()).padStart(2, '0');
    const ss = String(time.getSeconds()).padStart(2, '0');
    this.timeLabel.textContent = `最后更新 ${hh}:${mm}:${ss}`;
  }

  private startTimeTicker(): void {
    this.updateTimeLabel();
    setInterval(() => {
      this.updateTimeLabel();
    }, 1000);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});

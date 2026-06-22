import { CONFIG, RaceRanking, eventEmitter } from './types';

interface HUDState {
  speed: number;
  energy: number;
  lap: number;
  totalLaps: number;
  time: number;
  ranking: RaceRanking[];
}

export class GameUI {
  private timerDisplay: HTMLElement;
  private lapCurrent: HTMLElement;
  private lapTotal: HTMLElement;
  private energyFill: HTMLElement;
  private speedNeedle: HTMLElement;
  private speedValue: HTMLElement;
  private rankingList: HTMLElement;
  private countdown: HTMLElement;
  private rippleEffect: HTMLElement;
  private resultPanel: HTMLElement;
  private resultTitle: HTMLElement;
  private resultRanking: HTMLElement;
  private restartBtn: HTMLElement;

  constructor() {
    this.timerDisplay = document.getElementById('timer-display')!;
    this.lapCurrent = document.getElementById('lap-current')!;
    this.lapTotal = document.getElementById('lap-total')!;
    this.energyFill = document.getElementById('energy-fill')!;
    this.speedNeedle = document.getElementById('speed-needle')!;
    this.speedValue = document.getElementById('speed-value')!;
    this.rankingList = document.getElementById('ranking-list')!;
    this.countdown = document.getElementById('countdown')!;
    this.rippleEffect = document.getElementById('ripple-effect')!;
    this.resultPanel = document.getElementById('result-panel')!;
    this.resultTitle = document.getElementById('result-title')!;
    this.resultRanking = document.getElementById('result-ranking')!;
    this.restartBtn = document.getElementById('restart-btn')!;
    
    this.lapTotal.textContent = CONFIG.TOTAL_LAPS.toString();
    
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.restartBtn.addEventListener('click', () => {
      eventEmitter.emit('restart');
    });

    eventEmitter.on('lapComplete', () => {
      this.showRipple();
    });

    eventEmitter.on('countdownTick', (data: any) => {
      this.showCountdown(data.count);
    });

    eventEmitter.on('raceComplete', (data: any) => {
      this.showResult(data.ranking, data.playerWon);
    });
  }

  updateHUD(state: HUDState): void {
    this.updateTimer(state.time);
    this.updateLap(state.lap);
    this.updateEnergy(state.energy);
    this.updateSpeed(state.speed);
    this.updateRanking(state.ranking);
  }

  private updateTimer(time: number): void {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 1000);
    this.timerDisplay.textContent = 
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }

  private updateLap(lap: number): void {
    this.lapCurrent.textContent = lap.toString();
  }

  private updateEnergy(energy: number): void {
    const percentage = Math.max(0, Math.min(100, energy));
    this.energyFill.style.width = `${percentage}%`;
  }

  private updateSpeed(speed: number): void {
    const clampedSpeed = Math.max(0, Math.min(200, speed));
    const angle = -120 + (clampedSpeed / 200) * 240;
    this.speedNeedle.style.transform = `rotate(${angle}deg)`;
    this.speedValue.textContent = Math.round(clampedSpeed).toString();
  }

  private updateRanking(ranking: RaceRanking[]): void {
    this.rankingList.innerHTML = '';
    
    ranking.forEach((racer, index) => {
      const rankItem = document.createElement('div');
      rankItem.className = `rank-item rank-${index + 1}`;
      
      const nameSpan = document.createElement('span');
      nameSpan.textContent = `${index + 1}. ${racer.name}`;
      
      const lapSpan = document.createElement('span');
      lapSpan.textContent = `第${racer.lap}圈`;
      
      rankItem.appendChild(nameSpan);
      rankItem.appendChild(lapSpan);
      this.rankingList.appendChild(rankItem);
    });
  }

  showCountdown(count: number): void {
    this.countdown.textContent = count > 0 ? count.toString() : 'GO!';
    this.countdown.classList.remove('show');
    void this.countdown.offsetWidth;
    this.countdown.classList.add('show');
  }

  showRipple(): void {
    this.rippleEffect.classList.remove('active');
    void this.rippleEffect.offsetWidth;
    this.rippleEffect.classList.add('active');
  }

  showResult(ranking: RaceRanking[], playerWon: boolean): void {
    this.resultTitle.textContent = playerWon ? '🏆 胜利！' : '💨 比赛结束';
    this.resultTitle.style.color = playerWon ? '#FFD700' : '#CD7F32';
    
    this.resultRanking.innerHTML = '';
    
    ranking.forEach((racer, index) => {
      const rankItem = document.createElement('div');
      rankItem.className = `result-rank-item`;
      rankItem.style.color = index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#fff';
      
      const timeText = this.formatTime(racer.totalTime);
      rankItem.innerHTML = `
        <span>${index + 1}. ${racer.name}${racer.isPlayer ? ' (你)' : ''}</span>
        <span>${timeText}</span>
      `;
      
      this.resultRanking.appendChild(rankItem);
    });
    
    this.resultPanel.classList.add('show');
  }

  hideResult(): void {
    this.resultPanel.classList.remove('show');
  }

  private formatTime(time: number): string {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }

  reset(): void {
    this.updateHUD({
      speed: 0,
      energy: 100,
      lap: 0,
      totalLaps: CONFIG.TOTAL_LAPS,
      time: 0,
      ranking: [],
    });
    this.hideResult();
  }

  dispose(): void {
    eventEmitter.off('restart', () => {});
    eventEmitter.off('lapComplete', () => {});
    eventEmitter.off('countdownTick', () => {});
    eventEmitter.off('raceComplete', () => {});
  }
}

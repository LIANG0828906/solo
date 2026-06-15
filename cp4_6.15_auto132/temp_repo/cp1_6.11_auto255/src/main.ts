import { AudioController, Instrument, BIANZHONG_KEY_MAP, BIANQING_KEY_MAP } from './audio';
import { Renderer } from './renderer';
import { SCORES, ScorePlayer, ScoreEvaluator, Score, EvaluationResult, HitRecord } from './composer';

type GameMode = 'idle' | 'selected' | 'playing' | 'review';

class Game {
  private audio: AudioController;
  private renderer: Renderer;
  private mode: GameMode = 'idle';
  private currentScore: Score | null = null;
  private scorePlayer: ScorePlayer | null = null;
  private scoreEvaluator: ScoreEvaluator | null = null;
  private lastTime: number = 0;
  private animFrameId: number = 0;

  private scoreSelect: HTMLSelectElement;
  private playBtn: HTMLButtonElement;
  private scoreScroll: HTMLDivElement;
  private resultPanel: HTMLDivElement;
  private pitchBar: HTMLDivElement;

  private mouseDown: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private lastXiaoHover: number = -1;

  private pitchValue: number = 0.5;

  constructor() {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.audio = new AudioController();
    this.renderer = new Renderer(canvas);

    this.scoreSelect = document.getElementById('scoreSelect') as HTMLSelectElement;
    this.playBtn = document.getElementById('playBtn') as HTMLButtonElement;
    this.scoreScroll = document.getElementById('scoreScroll') as HTMLDivElement;
    this.resultPanel = document.getElementById('resultPanel') as HTMLDivElement;
    this.pitchBar = document.getElementById('pitchBar') as HTMLDivElement;

    this.setupUI();
    this.setupInput(canvas);
    this.setupVolumeControls();
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());

    this.lastTime = performance.now();
    this.loop();
  }

  private setupUI(): void {
    this.scoreSelect.addEventListener('change', () => {
      const val = this.scoreSelect.value;
      if (val) {
        this.currentScore = SCORES.find(s => s.id === val) || null;
        this.mode = 'selected';
        this.playBtn.disabled = false;
        this.showScoreScroll();
      } else {
        this.currentScore = null;
        this.mode = 'idle';
        this.playBtn.disabled = true;
        this.scoreScroll.style.display = 'none';
      }
    });

    this.playBtn.addEventListener('click', async () => {
      await this.audio.resume();
      if (this.mode === 'selected' && this.currentScore) {
        this.startPlaying();
      } else if (this.mode === 'playing') {
        this.stopPlaying();
      }
    });
  }

  private showScoreScroll(): void {
    if (!this.currentScore) return;
    const score = this.currentScore;
    const gongcheNames: Record<number, string> = {
      0: '合', 1: '四', 2: '一', 3: '上', 4: '勾',
      5: '尺', 6: '工', 7: '凡'
    };

    const parts = [
      { inst: Instrument.BIANZHONG, label: '编钟', midiArr: [48,50,52,53,55,57,59,60,62,64,65,67,69,71,72,74,76,77,79,81,83,84,86,88,36,38,40,43,45,49,51,54] },
      { inst: Instrument.BIANQING, label: '编磬', midiArr: [60,62,64,67,69,72,74,76,48,50,52,55,57,67,69,72] },
      { inst: Instrument.GUQIN, label: '古琴', midiArr: [55,57,59,60,62,64,67] },
      { inst: Instrument.XIAO, label: '箫', midiArr: [60,62,64,67,69,72] }
    ];

    let html = `<div style="text-align:center;font-size:16px;margin-bottom:6px;">《${score.name}》 工尺谱</div>`;
    html += `<div style="display:flex;gap:12px;flex-wrap:wrap;">`;

    for (const part of parts) {
      const notes = score.notes.filter(n => n.instrument === part.inst);
      html += `<div style="min-width:100px;"><div style="color:#8B6914;font-weight:bold;">${part.label}</div>`;
      html += `<div style="writing-mode:vertical-rl;display:flex;gap:2px;">`;
      for (const note of notes) {
        const midi = part.midiArr[note.noteIndex] || 60;
        const simplePitch = ((midi % 12) + 12) % 12;
        const gongche = gongcheNames[simplePitch % 8] || '工';
        const jianpu = (simplePitch % 7) + 1;
        html += `<div style="display:flex;flex-direction:column;align-items:center;font-size:11px;padding:1px 2px;">`;
        html += `<span style="color:#8B6914;">${jianpu}</span>`;
        html += `<span>${gongche}</span>`;
        html += `</div>`;
      }
      html += `</div></div>`;
    }
    html += `</div>`;

    this.scoreScroll.innerHTML = html;
    this.scoreScroll.style.display = 'block';
  }

  private startPlaying(): void {
    if (!this.currentScore) return;
    this.scorePlayer = new ScorePlayer(this.currentScore);
    this.scoreEvaluator = new ScoreEvaluator(this.currentScore);
    this.scorePlayer.start(this.audio.getCurrentTime());
    this.mode = 'playing';
    this.playBtn.textContent = '停止';
  }

  private stopPlaying(): void {
    if (this.scorePlayer) {
      this.scorePlayer.stop();
    }
    this.mode = this.currentScore ? 'selected' : 'idle';
    this.playBtn.textContent = '奏乐';
    this.renderer.setHighlights([]);
  }

  private finishPlaying(): void {
    this.mode = 'review';
    this.playBtn.textContent = '奏乐';
    this.playBtn.disabled = true;

    const levels = new Map<Instrument, number>();
    for (const inst of [Instrument.BIANZHONG, Instrument.BIANQING, Instrument.GUQIN, Instrument.XIAO]) {
      levels.set(inst, this.audio.getInstrumentLevel(inst));
    }

    if (this.scoreEvaluator) {
      const result = this.scoreEvaluator.evaluate(levels);
      this.showResult(result);
    }
  }

  private showResult(result: EvaluationResult): void {
    let html = `<h2>${result.rank}</h2>`;
    html += `<div class="review-text">「${result.review}」</div>`;
    html += `<div class="score-line">音准正确率：${(result.accuracy * 100).toFixed(1)}%</div>`;
    html += `<div class="score-line">节奏准确度：${(result.rhythmScore * 100).toFixed(1)}%</div>`;
    html += `<div class="score-line">音色融合度：${(result.fusionScore * 100).toFixed(1)}%</div>`;
    html += `<div class="score-line">综合评分：${(result.totalScore * 100).toFixed(1)}%</div>`;
    html += `<div class="score-line">节拍变异系数：${result.beatCV.toFixed(2)}</div>`;

    html += `<hr style="border-color:#8B6914;margin:10px 0;">`;
    html += `<div style="font-size:13px;">演奏记录：</div>`;
    html += `<div style="max-height:200px;overflow-y:auto;font-size:12px;">`;

    for (const rec of result.hitRecords) {
      const absDev = Math.abs(rec.deviation);
      let color: string;
      if (absDev < 50) color = '#00CC44';
      else if (absDev < 100) color = '#FFCC00';
      else color = '#CC0000';

      const instName = rec.instrument === Instrument.BIANZHONG ? '钟' :
                        rec.instrument === Instrument.BIANQING ? '磬' :
                        rec.instrument === Instrument.GUQIN ? '琴' : '箫';
      const mark = rec.correct ? '✓' : '✗';
      html += `<div style="color:${color};">${instName}[${rec.noteIndex}] ${mark} 偏差:${rec.deviation.toFixed(0)}ms</div>`;
    }
    html += `</div>`;

    html += `<button class="close-btn" onclick="document.getElementById('resultPanel').style.display='none'">关闭</button>`;

    this.resultPanel.innerHTML = html;
    this.resultPanel.style.display = 'block';
  }

  private setupInput(canvas: HTMLCanvasElement): void {
    document.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();

      if (key in BIANZHONG_KEY_MAP) {
        const idx = BIANZHONG_KEY_MAP[key];
        this.playBianzhong(idx);
      } else if (key in BIANQING_KEY_MAP) {
        const idx = BIANQING_KEY_MAP[key];
        this.playBianqing(idx);
      }
    });

    canvas.addEventListener('mousedown', (e) => {
      this.mouseDown = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.handleMouseClick(e.clientX, e.clientY);
    });

    canvas.addEventListener('mousemove', (e) => {
      if (this.mouseDown) {
        this.handleMouseDrag(e.clientX, e.clientY);
      }
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    canvas.addEventListener('mouseup', () => {
      this.mouseDown = false;
      this.lastXiaoHover = -1;
    });

    canvas.addEventListener('mouseleave', () => {
      this.mouseDown = false;
      this.lastXiaoHover = -1;
    });
  }

  private handleMouseClick(mx: number, my: number): void {
    const bellIdx = this.renderer.hitTestBianzhong(mx, my);
    if (bellIdx >= 0) {
      this.playBianzhong(bellIdx);
      return;
    }

    const chimeIdx = this.renderer.hitTestBianqing(mx, my);
    if (chimeIdx >= 0) {
      this.playBianqing(chimeIdx);
      return;
    }

    const stringIdx = this.renderer.hitTestGuqin(mx, my);
    if (stringIdx >= 0) {
      this.playGuqin(stringIdx);
      return;
    }

    const holeIdx = this.renderer.hitTestXiao(mx, my);
    if (holeIdx >= 0) {
      this.playXiao(holeIdx);
      return;
    }
  }

  private handleMouseDrag(mx: number, my: number): void {
    const stringIdx = this.renderer.hitTestGuqin(mx, my);
    if (stringIdx >= 0) {
      this.playGuqin(stringIdx);
      return;
    }

    const holeIdx = this.renderer.hitTestXiao(mx, my);
    if (holeIdx >= 0 && holeIdx !== this.lastXiaoHover) {
      this.lastXiaoHover = holeIdx;
      this.playXiao(holeIdx);
    }
  }

  private playBianzhong(idx: number): void {
    const correct = this.checkNote(Instrument.BIANZHONG, idx);
    this.audio.playBianzhong(idx);
    this.renderer.triggerBell(idx, correct);

    const positions = this.renderer.getBellPositions();
    if (idx < positions.length) {
      const p = positions[idx];
      if (correct) {
        this.renderer.addParticle(p.x, p.y - p.h / 2);
      }
    }

    if (!correct) {
      this.audio.playNoise();
      this.setPitchError();
    } else {
      this.setPitchCorrect();
    }
  }

  private playBianqing(idx: number): void {
    const correct = this.checkNote(Instrument.BIANQING, idx);
    this.audio.playBianqing(idx);
    this.renderer.triggerChime(idx, correct);

    if (!correct) {
      this.audio.playNoise();
      this.setPitchError();
    } else {
      this.setPitchCorrect();
    }
  }

  private playGuqin(idx: number): void {
    const correct = this.checkNote(Instrument.GUQIN, idx);
    this.audio.playGuqin(idx);
    this.renderer.triggerGuqinString(idx, correct);

    if (!correct) {
      this.audio.playNoise();
      this.setPitchError();
    } else {
      this.setPitchCorrect();
    }
  }

  private playXiao(idx: number): void {
    const correct = this.checkNote(Instrument.XIAO, idx);
    this.audio.playXiao(idx);
    this.renderer.triggerXiaoHole(idx, correct);

    if (!correct) {
      this.audio.playNoise();
      this.setPitchError();
    } else {
      this.setPitchCorrect();
    }
  }

  private checkNote(instrument: Instrument, noteIndex: number): boolean {
    if (this.mode !== 'playing' || !this.scorePlayer || !this.scoreEvaluator) {
      return true;
    }

    const activeNotes = this.scorePlayer.getActiveNotes();
    const match = activeNotes.find(n => n.instrument === instrument && n.noteIndex === noteIndex);

    if (match) {
      this.scoreEvaluator.recordHit(
        instrument,
        noteIndex,
        this.scorePlayer.getCurrentBeat(),
        this.scorePlayer.getBeatDuration()
      );
      return true;
    }

    return false;
  }

  private setPitchCorrect(): void {
    this.pitchValue = Math.max(0, this.pitchValue - 0.15);
    this.updatePitchBar();
  }

  private setPitchError(): void {
    this.pitchValue = Math.min(1, this.pitchValue + 0.3);
    this.updatePitchBar();
  }

  private updatePitchBar(): void {
    const pct = (1 - this.pitchValue) * 100;
    this.pitchBar.style.height = `${pct}%`;
    if (this.pitchValue < 0.3) {
      this.pitchBar.style.background = 'linear-gradient(to top, #00CC44, #66DD66)';
    } else if (this.pitchValue < 0.6) {
      this.pitchBar.style.background = 'linear-gradient(to top, #FFCC00, #FFD700)';
    } else {
      this.pitchBar.style.background = 'linear-gradient(to top, #CC0000, #FF4444)';
    }
  }

  private setupVolumeControls(): void {
    const controls: { id: string; inst: Instrument }[] = [
      { id: 'volBianzhong', inst: Instrument.BIANZHONG },
      { id: 'volBianqing', inst: Instrument.BIANQING },
      { id: 'volGuqin', inst: Instrument.GUQIN },
      { id: 'volXiao', inst: Instrument.XIAO }
    ];

    for (const ctrl of controls) {
      const el = document.getElementById(ctrl.id) as HTMLInputElement;
      if (el) {
        el.addEventListener('input', () => {
          this.audio.setVolume(ctrl.inst, parseInt(el.value) / 100);
        });
      }
    }
  }

  private handleResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.resize(w, h);
  }

  private loop(): void {
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (this.mode === 'playing' && this.scorePlayer) {
      this.scorePlayer.update(this.audio.getCurrentTime());
      const activeNotes = this.scorePlayer.getActiveNotes();
      this.renderer.setHighlights(activeNotes);

      if (this.scorePlayer.isFinished()) {
        this.finishPlaying();
      }
    }

    this.pitchValue = Math.max(0, this.pitchValue - dt * 0.1);
    this.updatePitchBar();

    this.renderer.update(dt, this.audio);
    this.renderer.draw(this.currentScore, this.scorePlayer?.getCurrentBeat() || 0, this.mode === 'playing');

    this.animFrameId = requestAnimationFrame(() => this.loop());
  }
}

new Game();

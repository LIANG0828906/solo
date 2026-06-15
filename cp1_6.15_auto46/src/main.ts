import Phaser from 'phaser';
import { AssemblyScene } from './scenes/AssemblyScene';
import { BattleScene } from './scenes/BattleScene';
import { BattleResult, BattleHistoryCard } from './types';

class GameBoot {
  private game: Phaser.Game;
  private battleHistory: BattleHistoryCard[] = [];

  constructor() {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: 'game-container',
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#1a1d24',
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      scene: [AssemblyScene, BattleScene],
      render: {
        antialias: true,
        pixelArt: false,
        roundPixels: false
      },
      physics: {
        default: 'arcade',
        arcade: {
          debug: false
        }
      }
    };

    this.game = new Phaser.Game(config);

    this.game.events.once('ready', () => {
      this.game.scene.start('AssemblyScene', {
        onStartBattle: this.handleStartBattle.bind(this),
        onBattleResult: this.handleBattleResult.bind(this),
        getHistory: () => this.battleHistory
      });
    });

    window.addEventListener('resize', () => {
      this.game.scale.resize(window.innerWidth, window.innerHeight);
    });
  }

  private handleStartBattle(playerData: any) {
    this.game.scene.stop('AssemblyScene');
    this.game.scene.start('BattleScene', {
      playerData,
      onComplete: (result: BattleResult) => this.handleBattleComplete(result)
    });
  }

  private handleBattleComplete(result: BattleResult) {
    const card: BattleHistoryCard = {
      id: 'battle-' + result.timestamp,
      enemyConfig: result.enemyMech.stats,
      rounds: result.rounds,
      winner: result.winner,
      timestamp: result.timestamp,
      logs: result.logs
    };
    this.battleHistory.unshift(card);
    if (this.battleHistory.length > 20) {
      this.battleHistory.pop();
    }

    this.game.scene.stop('BattleScene');
    this.game.scene.start('AssemblyScene', {
      lastResult: result,
      onStartBattle: this.handleStartBattle.bind(this),
      onBattleResult: this.handleBattleResult.bind(this),
      getHistory: () => this.battleHistory
    });
  }

  private handleBattleResult(result: BattleResult) {
    console.log('Battle result:', result);
  }
}

new GameBoot();

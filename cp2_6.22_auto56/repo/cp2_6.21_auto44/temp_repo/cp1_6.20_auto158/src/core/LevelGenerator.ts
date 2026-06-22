import { LevelData, Position, Platform, Enemy, Coin } from './PathFinder';

export interface StartNodeConfig {
  type: 'start';
  startX: number;
  startY: number;
  jumpPower: number;
}

export interface DistributionNodeConfig {
  type: 'distribution';
  minGap: number;
  maxGap: number;
  minHeightChange: number;
  maxHeightChange: number;
  enemyProbability: number;
}

export interface RewardNodeConfig {
  type: 'reward';
  coinCount: number;
  placementMode: 'uniform' | 'random';
}

export type NodeConfig = StartNodeConfig | DistributionNodeConfig | RewardNodeConfig;

export interface RuleConfig {
  startNode?: StartNodeConfig;
  distributionNode?: DistributionNodeConfig;
  rewardNode?: RewardNodeConfig;
}

export class LevelGenerator {
  private config: RuleConfig;
  private levelWidth: number = 2000;
  private levelHeight: number = 600;

  constructor(config: RuleConfig) {
    this.config = config;
  }

  generate(): LevelData {
    const startConfig = this.config.startNode || {
      type: 'start',
      startX: 50,
      startY: 400,
      jumpPower: 12,
    };

    const distConfig = this.config.distributionNode || {
      type: 'distribution',
      minGap: 80,
      maxGap: 200,
      minHeightChange: -50,
      maxHeightChange: 50,
      enemyProbability: 30,
    };

    const rewardConfig = this.config.rewardNode || {
      type: 'reward',
      coinCount: 10,
      placementMode: 'uniform',
    };

    const platforms = this.generatePlatforms(startConfig, distConfig);
    const enemies = this.generateEnemies(platforms, distConfig);
    const coins = this.generateCoins(platforms, rewardConfig);

    const endPlatform = platforms[platforms.length - 1];
    const endPos: Position = {
      x: endPlatform.x + endPlatform.width / 2,
      y: endPlatform.y - 30,
    };

    return {
      startPos: { x: startConfig.startX, y: startConfig.startY - 30 },
      endPos,
      platforms,
      enemies,
      coins,
      width: this.levelWidth,
      height: this.levelHeight,
    };
  }

  private generatePlatforms(
    startConfig: StartNodeConfig,
    distConfig: DistributionNodeConfig
  ): Platform[] {
    const platforms: Platform[] = [];
    
    const startPlatform: Platform = {
      x: startConfig.startX - 40,
      y: startConfig.startY,
      width: 120,
      height: 20,
    };
    platforms.push(startPlatform);

    let currentX = startPlatform.x + startPlatform.width;
    let currentY = startPlatform.y;

    while (currentX < this.levelWidth - 200) {
      const gap = this.random(distConfig.minGap, distConfig.maxGap);
      const heightChange = this.random(distConfig.minHeightChange, distConfig.maxHeightChange);
      
      currentX += gap;
      currentY += heightChange;

      currentY = Math.max(100, Math.min(this.levelHeight - 80, currentY));

      const width = this.random(60, 150);
      
      const platform: Platform = {
        x: currentX,
        y: currentY,
        width,
        height: 20,
      };
      platforms.push(platform);

      currentX += width;
    }

    const endPlatform: Platform = {
      x: this.levelWidth - 150,
      y: this.levelHeight / 2,
      width: 120,
      height: 20,
    };
    platforms.push(endPlatform);

    return platforms;
  }

  private generateEnemies(
    platforms: Platform[],
    distConfig: DistributionNodeConfig
  ): Enemy[] {
    const enemies: Enemy[] = [];

    for (let i = 1; i < platforms.length - 1; i++) {
      if (Math.random() * 100 < distConfig.enemyProbability) {
        const platform = platforms[i];
        const enemy: Enemy = {
          x: platform.x + platform.width / 2,
          y: platform.y - 15,
          radius: 12,
        };
        enemies.push(enemy);
      }
    }

    return enemies;
  }

  private generateCoins(
    platforms: Platform[],
    rewardConfig: RewardNodeConfig
  ): Coin[] {
    const coins: Coin[] = [];
    const coinCount = rewardConfig.coinCount;

    if (rewardConfig.placementMode === 'uniform') {
      const validPlatforms = platforms.slice(1, -1);
      const coinsPerPlatform = Math.ceil(coinCount / validPlatforms.length);
      
      for (const platform of validPlatforms) {
        for (let i = 0; i < coinsPerPlatform && coins.length < coinCount; i++) {
          const coin: Coin = {
            x: platform.x + (platform.width / (coinsPerPlatform + 1)) * (i + 1),
            y: platform.y - 40,
          };
          coins.push(coin);
        }
      }
    } else {
      for (let i = 0; i < coinCount; i++) {
        const platformIndex = Math.floor(Math.random() * (platforms.length - 2)) + 1;
        const platform = platforms[platformIndex];
        const coin: Coin = {
          x: platform.x + Math.random() * platform.width,
          y: platform.y - 30 - Math.random() * 50,
        };
        coins.push(coin);
      }
    }

    return coins;
  }

  private random(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }
}

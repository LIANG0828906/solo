import { useGameStore, TILE_SIZE, GRAVITY, MOVE_SPEED, JUMP_FORCE, PLAYER_WIDTH, PLAYER_HEIGHT, INVINCIBLE_DURATION } from '../store/gameStore';
import { LevelEngine } from './LevelEngine';

export class PlayerController {
  keys: Set<string>;
  levelEngine: LevelEngine;
  private canInteract: boolean;

  private handleKeyDownBound: (e: KeyboardEvent) => void;
  private handleKeyUpBound: (e: KeyboardEvent) => void;

  constructor(levelEngine: LevelEngine) {
    this.keys = new Set<string>();
    this.levelEngine = levelEngine;
    this.canInteract = true;

    this.handleKeyDownBound = this.handleKeyDown.bind(this);
    this.handleKeyUpBound = this.handleKeyUp.bind(this);

    window.addEventListener('keydown', this.handleKeyDownBound);
    window.addEventListener('keyup', this.handleKeyUpBound);
  }

  handleKeyDown(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();

    if (['w', 'a', 's', 'd', ' ', 'e'].includes(key)) {
      e.preventDefault();
    }

    if (key === 'w' || key === 'a' || key === 's' || key === 'd' || key === ' ') {
      this.keys.add(key);
    }

    if (key === 'e') {
      this.keys.add(key);
      if (this.canInteract) {
        this.tryInteract();
      }
    }

    if (key === ' ') {
      this.jump();
    }
  }

  handleKeyUp(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    this.keys.delete(key);

    if (key === 'e') {
      this.canInteract = true;
    }
  }

  isOnGround(): boolean {
    const store = useGameStore.getState();
    const { playerX, playerY } = store;
    return this.levelEngine.checkWallCollision(
      playerX,
      playerY + 1,
      PLAYER_WIDTH,
      PLAYER_HEIGHT
    );
  }

  jump(): void {
    if (this.isOnGround()) {
      const store = useGameStore.getState();
      store.updatePlayer(
        store.playerX,
        store.playerY,
        store.playerVX,
        JUMP_FORCE,
        store.facing,
        true
      );
    }
  }

  tryInteract(): void {
    const store = useGameStore.getState();
    const { playerX, playerY } = store;
    const leverId = this.levelEngine.checkLeverInteraction(
      playerX,
      playerY,
      PLAYER_WIDTH,
      PLAYER_HEIGHT
    );
    if (leverId) {
      store.activateLever(leverId);
      this.levelEngine.spawnSteamParticles();
      this.canInteract = false;
    }
  }

  update(dt: number): void {
    const store = useGameStore.getState();
    let { playerX, playerY, playerVX, playerVY, facing, invincible } = store;

    let vx = 0;
    if (this.keys.has('d')) vx = MOVE_SPEED;
    if (this.keys.has('a')) vx = -MOVE_SPEED;

    playerVY += GRAVITY;

    const newX = playerX + vx;
    const xCollision = this.levelEngine.checkWallCollision(
      newX,
      playerY,
      PLAYER_WIDTH,
      PLAYER_HEIGHT
    );
    if (!xCollision) {
      playerX = newX;
    } else {
      if (vx > 0) {
        playerX = Math.floor((playerX + PLAYER_WIDTH) / TILE_SIZE) * TILE_SIZE - PLAYER_WIDTH - 0.01;
      } else if (vx < 0) {
        playerX = Math.ceil(playerX / TILE_SIZE) * TILE_SIZE + 0.01;
      }
    }

    const newY = playerY + playerVY;
    const yCollision = this.levelEngine.checkWallCollision(
      playerX,
      newY,
      PLAYER_WIDTH,
      PLAYER_HEIGHT
    );
    if (!yCollision) {
      playerY = newY;
    } else {
      if (playerVY > 0) {
        playerY = Math.floor((playerY + PLAYER_HEIGHT) / TILE_SIZE) * TILE_SIZE - PLAYER_HEIGHT - 0.01;
        playerVY = 0;
      } else if (playerVY < 0) {
        playerY = Math.ceil(playerY / TILE_SIZE) * TILE_SIZE + 0.01;
        playerVY = 0;
      }
    }

    if (this.keys.has('a')) facing = 'left';
    if (this.keys.has('d')) facing = 'right';

    const isJumping = !this.isOnGround();

    store.updatePlayer(playerX, playerY, vx, playerVY, facing, isJumping);

    const trapHit = this.levelEngine.checkTrapCollision(
      playerX,
      playerY,
      PLAYER_WIDTH,
      PLAYER_HEIGHT
    );
    if (trapHit && invincible <= 0) {
      if (trapHit.type === 'gear' || trapHit.type === 'arm') {
        store.takeDamage();
        store.setInvincible(INVINCIBLE_DURATION);
        store.setScreenFlash(1);

        const knockbackDir = facing === 'right' ? -1 : 1;
        let knockbackX = playerX + knockbackDir * 80;

        if (trapHit.type === 'arm') {
          const armDir = trapHit.direction || 1;
          knockbackX = playerX + armDir * 80;
        }

        const adjustedCollision = this.levelEngine.checkWallCollision(
          knockbackX,
          playerY,
          PLAYER_WIDTH,
          PLAYER_HEIGHT
        );
        if (!adjustedCollision) {
          playerX = knockbackX;
          store.updatePlayer(playerX, playerY, 0, playerVY, facing, isJumping);
        }
      }
    }

    const batteryId = this.levelEngine.checkBatteryCollection(
      playerX,
      playerY,
      PLAYER_WIDTH,
      PLAYER_HEIGHT
    );
    if (batteryId) {
      store.collectBattery(batteryId);
      this.levelEngine.spawnGoldBurst();
    }

    if (this.levelEngine.checkElevatorEntry(
      playerX,
      playerY,
      PLAYER_WIDTH,
      PLAYER_HEIGHT
    )) {
      store.nextLevel();
    }

    const tileX = Math.floor((playerX + PLAYER_WIDTH / 2) / TILE_SIZE);
    const tileY = Math.floor((playerY + PLAYER_HEIGHT / 2) / TILE_SIZE);
    store.markTileExplored(tileX, tileY);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDownBound);
    window.removeEventListener('keyup', this.handleKeyUpBound);
  }
}

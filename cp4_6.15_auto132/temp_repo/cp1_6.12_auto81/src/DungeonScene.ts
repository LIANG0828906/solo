import Phaser from 'phaser';
import { DungeonData, Room, EnemyData, ChestData } from './DungeonGenerator';
import { Player } from './Player';

interface Slime {
  sprite: Phaser.Physics.Arcade.Sprite;
  health: number;
  hitFlash: number;
  knockback: { x: number; y: number; timer: number };
  moveDir: { x: number; y: number };
  moveTimer: number;
  roomBounds: { minX: number; minY: number; maxX: number; maxY: number };
}

interface Chest {
  sprite: Phaser.Physics.Arcade.Sprite;
  opened: boolean;
  baseY: number;
  bobTimer: number;
}

interface HeartPickup {
  sprite: Phaser.Physics.Arcade.Sprite;
  bobTimer: number;
}

export class DungeonScene extends Phaser.Scene {
  private dungeonData!: DungeonData;
  private player!: Player;
  private slimes: Slime[] = [];
  private chests: Chest[] = [];
  private heartPickups: HeartPickup[] = [];
  private tileSprites: Phaser.GameObjects.Sprite[][] = [];
  private exitSprite!: Phaser.GameObjects.Sprite;

  private hudHeart!: Phaser.GameObjects.Sprite;
  private hudHeartText!: Phaser.GameObjects.Text;
  private hudKey!: Phaser.GameObjects.Sprite;
  private hudKeyText!: Phaser.GameObjects.Text;
  private hudRoomText!: Phaser.GameObjects.Text;
  private hudInventoryKeys: Phaser.GameObjects.Sprite[] = [];

  private roomTransitionMask!: Phaser.GameObjects.Graphics;
  private roomFadeMask!: Phaser.GameObjects.Graphics;
  private transitionActive: boolean = false;
  private transitionTimer: number = 0;
  private currentRoomGridX: number = -1;
  private currentRoomGridY: number = -1;

  private gameStartTime: number = 0;
  private gameActive: boolean = false;
  private exitUnlocked: boolean = false;

  constructor() {
    super({ key: 'DungeonScene' });
  }

  init(): void {
    this.dungeonData = this.registry.get('dungeonData') as DungeonData;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#2A2A2A');
    this.physics.world.setBounds(0, 0, this.dungeonData.width, this.dungeonData.height);

    this.renderTilemap();
    this.createPlayer();
    this.createEnemies();
    this.createChests();
    this.createExit();
    this.createHUD();
    this.createTransitionEffects();

    this.gameStartTime = this.time.now / 1000;
    this.gameActive = true;
    this.exitUnlocked = false;

    this.updateCurrentRoom();
    this.fadeInRoom();
  }

  private renderTilemap(): void {
    const ts = this.dungeonData.tileSize;
    const rows = this.dungeonData.tiles.length;
    const cols = this.dungeonData.tiles[0].length;

    this.tileSprites = [];
    for (let y = 0; y < rows; y++) {
      this.tileSprites[y] = [];
      for (let x = 0; x < cols; x++) {
        const tileIdx = this.dungeonData.tiles[y][x];
        let texture: string;
        if (tileIdx >= 0 && tileIdx <= 3) {
          texture = `wall_${tileIdx}`;
        } else if (tileIdx >= 4 && tileIdx <= 7) {
          texture = `floor_${tileIdx - 4}`;
        } else if (tileIdx === 8) {
          texture = `floor_0`;
        } else {
          texture = `wall_0`;
        }
        const sprite = this.add.sprite(x * ts + ts / 2, y * ts + ts / 2, texture);
        sprite.setDisplaySize(ts, ts);
        sprite.setAlpha(0);
        this.tileSprites[y][x] = sprite;
      }
    }
  }

  private createPlayer(): void {
    const spawn = this.dungeonData.spawnRoom;
    this.player = new Player(this, spawn.x + 8, spawn.y + 8);

    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setZoom(2);

    this.physics.world.on('worldbounds', () => {
      const wallTiles = this.getAdjacentWallTiles();
      for (const wt of wallTiles) {
        const dist = Phaser.Math.Distance.Between(
          this.player.sprite.x, this.player.sprite.y,
          wt.x, wt.y
        );
        if (dist < 12) {
          this.resolveWallCollision(wt);
        }
      }
    });
  }

  private getAdjacentWallTiles(): { x: number; y: number }[] {
    const result: { x: number; y: number }[] = [];
    const ts = this.dungeonData.tileSize;
    const px = Math.floor(this.player.sprite.x / ts);
    const py = Math.floor(this.player.sprite.y / ts);

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tx = px + dx;
        const ty = py + dy;
        if (ty >= 0 && ty < this.dungeonData.tiles.length &&
            tx >= 0 && tx < this.dungeonData.tiles[0].length) {
          if (this.dungeonData.tiles[ty][tx] <= 3) {
            result.push({ x: tx * ts + ts / 2, y: ty * ts + ts / 2 });
          }
        }
      }
    }
    return result;
  }

  private resolveWallCollision(wall: { x: number; y: number }): void {
    const ts = this.dungeonData.tileSize;
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;
    const dx = px - wall.x;
    const dy = py - wall.y;
    const overlapX = (ts / 2 + 6) - Math.abs(dx);
    const overlapY = (ts / 2 + 6) - Math.abs(dy);

    if (overlapX > 0 && overlapY > 0) {
      if (overlapX < overlapY) {
        this.player.sprite.x += dx > 0 ? overlapX : -overlapX;
      } else {
        this.player.sprite.y += dy > 0 ? overlapY : -overlapY;
      }
    }
  }

  private createEnemies(): void {
    this.slimes = [];
    for (const ed of this.dungeonData.enemies) {
      const room = this.dungeonData.rooms.find(
        r => r.gridX === ed.roomGridX && r.gridY === ed.roomGridY
      );
      if (!room) continue;

      const sprite = this.physics.add.sprite(ed.x + 8, ed.y + 8, 'slime');
      sprite.setDisplaySize(16, 16);
      sprite.setCollideWorldBounds(true);

      this.slimes.push({
        sprite,
        health: 2,
        hitFlash: 0,
        knockback: { x: 0, y: 0, timer: 0 },
        moveDir: { x: Phaser.Math.Between(-1, 1), y: Phaser.Math.Between(-1, 1) },
        moveTimer: Phaser.Math.Between(1000, 3000),
        roomBounds: {
          minX: room.x + 8,
          minY: room.y + 8,
          maxX: room.x + room.width - 8,
          maxY: room.y + room.height - 8
        }
      });
    }
  }

  private createChests(): void {
    this.chests = [];
    for (const cd of this.dungeonData.chests) {
      const sprite = this.physics.add.sprite(cd.x + 8, cd.y + 8, 'chest');
      sprite.setDisplaySize(16, 16);
      this.chests.push({
        sprite,
        opened: false,
        baseY: cd.y + 8,
        bobTimer: 0
      });
    }
  }

  private createExit(): void {
    const exit = this.dungeonData.exitRoom;
    this.exitSprite = this.add.sprite(exit.x + 8, exit.y + 8, 'exit');
    this.exitSprite.setDisplaySize(16, 16);
    this.exitSprite.setAlpha(0);
  }

  private createHUD(): void {
    const cam = this.cameras.main;

    this.hudHeart = this.add.sprite(20, 20, 'heart');
    this.hudHeart.setDisplaySize(16, 16);
    this.hudHeart.setScrollFactor(0);
    this.hudHeart.setDepth(100);

    this.hudHeartText = this.add.text(42, 13, `${this.player.health}/${this.player.maxHealth}`, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff'
    });
    this.hudHeartText.setScrollFactor(0);
    this.hudHeartText.setDepth(100);

    this.hudKey = this.add.sprite(110, 20, 'key');
    this.hudKey.setDisplaySize(16, 16);
    this.hudKey.setScrollFactor(0);
    this.hudKey.setDepth(100);

    this.hudKeyText = this.add.text(132, 13, `${this.player.keys}/${this.player.maxKeys}`, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#C0C0C0'
    });
    this.hudKeyText.setScrollFactor(0);
    this.hudKeyText.setDepth(100);

    this.hudRoomText = this.add.text(cam.width - 20, 13, 'Room 0,0', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff'
    });
    this.hudRoomText.setOrigin(1, 0);
    this.hudRoomText.setScrollFactor(0);
    this.hudRoomText.setDepth(100);

    for (let i = 0; i < 3; i++) {
      const key = this.add.sprite(20 + i * 22, 50, 'key');
      key.setDisplaySize(16, 16);
      key.setScrollFactor(0);
      key.setDepth(100);
      key.setAlpha(0.2);
      this.hudInventoryKeys.push(key);
    }
  }

  private createTransitionEffects(): void {
    const cam = this.cameras.main;

    this.roomTransitionMask = this.add.graphics();
    this.roomTransitionMask.fillStyle(0x000000, 0.6);
    this.roomTransitionMask.fillRect(0, 0, cam.width, cam.height);
    this.roomTransitionMask.setScrollFactor(0);
    this.roomTransitionMask.setDepth(90);
    this.roomTransitionMask.setAlpha(0);

    this.roomFadeMask = this.add.graphics();
    this.roomFadeMask.fillStyle(0x000000, 1);
    this.roomFadeMask.fillRect(0, 0, cam.width, cam.height);
    this.roomFadeMask.setScrollFactor(0);
    this.roomFadeMask.setDepth(95);
    this.roomFadeMask.setAlpha(1);
  }

  private fadeInRoom(): void {
    this.tweens.add({
      targets: this.roomFadeMask,
      alpha: 0,
      duration: 300,
      ease: 'Linear'
    });

    const visibleTiles = this.getVisibleRoomTiles();
    for (const t of visibleTiles) {
      if (this.tileSprites[t.y] && this.tileSprites[t.y][t.x]) {
        this.tileSprites[t.y][t.x].setAlpha(1);
      }
    }
  }

  private getVisibleRoomTiles(): { x: number; y: number }[] {
    const result: { x: number; y: number }[] = [];
    const ts = this.dungeonData.tileSize;
    const padding = 2;
    const cam = this.cameras.main;
    const startX = Math.max(0, Math.floor((cam.scrollX - padding * ts) / ts));
    const endX = Math.min(
      this.dungeonData.tiles[0].length - 1,
      Math.floor((cam.scrollX + cam.width / cam.zoom + padding * ts) / ts)
    );
    const startY = Math.max(0, Math.floor((cam.scrollY - padding * ts) / ts));
    const endY = Math.min(
      this.dungeonData.tiles.length - 1,
      Math.floor((cam.scrollY + cam.height / cam.zoom + padding * ts) / ts)
    );

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        result.push({ x, y });
      }
    }
    return result;
  }

  private updateCurrentRoom(): void {
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;
    let foundRoom: Room | null = null;

    for (const room of this.dungeonData.rooms) {
      if (px >= room.x && px <= room.x + room.width &&
          py >= room.y && py <= room.y + room.height) {
        foundRoom = room;
        break;
      }
    }

    if (foundRoom && (foundRoom.gridX !== this.currentRoomGridX || foundRoom.gridY !== this.currentRoomGridY)) {
      this.currentRoomGridX = foundRoom.gridX;
      this.currentRoomGridY = foundRoom.gridY;
      this.hudRoomText.setText(`Room ${foundRoom.gridX},${foundRoom.gridY}`);
      this.triggerRoomTransition();
    }
  }

  private triggerRoomTransition(): void {
    if (this.transitionActive) return;
    this.transitionActive = true;
    this.transitionTimer = 500;

    this.tweens.add({
      targets: this.roomTransitionMask,
      alpha: 0.6,
      duration: 150,
      yoyo: true,
      ease: 'Linear'
    });
  }

  update(time: number, delta: number): void {
    if (!this.gameActive) return;

    this.player.update(delta);

    this.resolveWallCollisions();
    this.updateSlimes(delta);
    this.updateChests(delta);
    this.updateHeartPickups(delta);
    this.checkPlayerEnemyCollision();
    this.checkAttackHits();
    this.checkChestInteraction();
    this.checkHeartPickup();
    this.checkExit();
    this.updateCurrentRoom();

    if (this.transitionActive) {
      this.transitionTimer -= delta;
      if (this.transitionTimer <= 0) {
        this.transitionActive = false;
      }
    }

    this.updateHUD();
    this.updateVisibleTiles();

    if (this.player.health <= 0) {
      this.gameOver();
    }
  }

  private resolveWallCollisions(): void {
    const walls = this.getAdjacentWallTiles();
    for (const w of walls) {
      this.resolveWallCollision(w);
    }
  }

  private updateSlimes(delta: number): void {
    for (let i = this.slimes.length - 1; i >= 0; i--) {
      const slime = this.slimes[i];

      if (slime.hitFlash > 0) {
        slime.hitFlash -= delta;
        slime.sprite.setTint(slime.hitFlash > 0 ? 0xff0000 : 0xffffff);
      }

      if (slime.knockback.timer > 0) {
        slime.knockback.timer -= delta;
        slime.sprite.x += slime.knockback.x;
        slime.sprite.y += slime.knockback.y;
        slime.knockback.x *= 0.9;
        slime.knockback.y *= 0.9;
      } else {
        const speed = 8 * (delta / 1000);
        slime.moveTimer -= delta;

        if (slime.moveTimer <= 0) {
          slime.moveDir = {
            x: Phaser.Math.Between(-1, 1),
            y: Phaser.Math.Between(-1, 1)
          };
          if (slime.moveDir.x === 0 && slime.moveDir.y === 0) {
            slime.moveDir.x = 1;
          }
          slime.moveTimer = Phaser.Math.Between(1000, 3000);
        }

        slime.sprite.x += slime.moveDir.x * speed;
        slime.sprite.y += slime.moveDir.y * speed;

        if (slime.sprite.x < slime.roomBounds.minX) {
          slime.sprite.x = slime.roomBounds.minX;
          slime.moveDir.x *= -1;
        }
        if (slime.sprite.x > slime.roomBounds.maxX) {
          slime.sprite.x = slime.roomBounds.maxX;
          slime.moveDir.x *= -1;
        }
        if (slime.sprite.y < slime.roomBounds.minY) {
          slime.sprite.y = slime.roomBounds.minY;
          slime.moveDir.y *= -1;
        }
        if (slime.sprite.y > slime.roomBounds.maxY) {
          slime.sprite.y = slime.roomBounds.maxY;
          slime.moveDir.y *= -1;
        }
      }
    }
  }

  private updateChests(delta: number): void {
    for (const chest of this.chests) {
      if (!chest.opened) {
        chest.bobTimer += delta;
        const dist = Phaser.Math.Distance.Between(
          this.player.sprite.x, this.player.sprite.y,
          chest.sprite.x, chest.sprite.y
        );
        if (dist < 40) {
          const bob = Math.sin(chest.bobTimer / 500) * 2;
          chest.sprite.y = chest.baseY + bob;
        } else {
          chest.sprite.y = chest.baseY;
        }
      }
    }
  }

  private updateHeartPickups(delta: number): void {
    for (let i = this.heartPickups.length - 1; i >= 0; i--) {
      const heart = this.heartPickups[i];
      heart.bobTimer += delta;
      heart.sprite.y += Math.sin(heart.bobTimer / 200) * 0.3;
    }
  }

  private checkPlayerEnemyCollision(): void {
    for (const slime of this.slimes) {
      const dist = Phaser.Math.Distance.Between(
        this.player.sprite.x, this.player.sprite.y,
        slime.sprite.x, slime.sprite.y
      );
      if (dist < 14) {
        this.player.takeDamage();
      }
    }
  }

  private checkAttackHits(): void {
    const hitbox = this.player.getAttackHitbox();
    if (!hitbox) return;

    for (let i = this.slimes.length - 1; i >= 0; i--) {
      const slime = this.slimes[i];
      const dist = Phaser.Math.Distance.Between(
        hitbox.x, hitbox.y,
        slime.sprite.x, slime.sprite.y
      );

      let inArc = false;
      const dx = slime.sprite.x - hitbox.x;
      const dy = slime.sprite.y - hitbox.y;
      const angle = Math.atan2(dy, dx);

      if (dist < hitbox.radius + 8) {
        switch (this.player.facing) {
          case 'up':
            inArc = angle >= -Math.PI * 0.75 && angle <= -Math.PI * 0.25;
            break;
          case 'down':
            inArc = angle >= Math.PI * 0.25 && angle <= Math.PI * 0.75;
            break;
          case 'left':
            inArc = (angle >= Math.PI * 0.75 && angle <= Math.PI) ||
                    (angle >= -Math.PI && angle <= -Math.PI * 0.75);
            break;
          case 'right':
            inArc = (angle >= -Math.PI * 0.25 && angle <= Math.PI * 0.25);
            break;
        }
      }

      if (inArc && slime.hitFlash <= 0) {
        slime.health--;
        slime.hitFlash = 200;

        const kdx = dx !== 0 ? (dx / Math.abs(dx)) * 2 : 0;
        const kdy = dy !== 0 ? (dy / Math.abs(dy)) * 2 : 0;
        slime.knockback = { x: kdx, y: kdy, timer: 150 };

        if (slime.health <= 0) {
          this.spawnHeartPickup(slime.sprite.x, slime.sprite.y);
          this.cameras.main.shake(100, 0.005);
          slime.sprite.destroy();
          this.slimes.splice(i, 1);
          this.player.addKill();
        }
      }
    }
  }

  private spawnHeartPickup(x: number, y: number): void {
    const sprite = this.physics.add.sprite(x, y, 'heart');
    sprite.setDisplaySize(12, 12);
    this.heartPickups.push({
      sprite,
      bobTimer: 0
    });
  }

  private checkChestInteraction(): void {
    if (!this.player.isEKeyPressed()) return;

    for (const chest of this.chests) {
      if (chest.opened) continue;

      const dist = Phaser.Math.Distance.Between(
        this.player.sprite.x, this.player.sprite.y,
        chest.sprite.x, chest.sprite.y
      );

      if (dist < 24) {
        chest.opened = true;
        chest.sprite.setTexture('chest_open');
        chest.sprite.y = chest.baseY;

        this.tweens.add({
          targets: chest.sprite,
          y: chest.baseY - 4,
          duration: 250,
          yoyo: true,
          ease: 'Quad.Out'
        });

        this.player.addKey();

        if (this.player.keys >= this.player.maxKeys && !this.exitUnlocked) {
          this.unlockExit();
        }

        break;
      }
    }
  }

  private unlockExit(): void {
    this.exitUnlocked = true;
    this.exitSprite.setAlpha(1);
    const ts = this.dungeonData.tileSize;
    const tx = Math.floor(this.exitSprite.x / ts);
    const ty = Math.floor(this.exitSprite.y / ts);
    if (this.tileSprites[ty] && this.tileSprites[ty][tx]) {
      this.tileSprites[ty][tx].setTexture('exit');
      this.dungeonData.tiles[ty][tx] = 9;
    }
  }

  private checkHeartPickup(): void {
    for (let i = this.heartPickups.length - 1; i >= 0; i--) {
      const heart = this.heartPickups[i];
      const dist = Phaser.Math.Distance.Between(
        this.player.sprite.x, this.player.sprite.y,
        heart.sprite.x, heart.sprite.y
      );
      if (dist < 16) {
        this.player.heal();
        heart.sprite.destroy();
        this.heartPickups.splice(i, 1);
      }
    }
  }

  private checkExit(): void {
    if (!this.exitUnlocked) return;

    const dist = Phaser.Math.Distance.Between(
      this.player.sprite.x, this.player.sprite.y,
      this.exitSprite.x, this.exitSprite.y
    );

    if (dist < 12) {
      this.victory();
    }
  }

  private updateHUD(): void {
    this.hudHeartText.setText(`${this.player.health}/${this.player.maxHealth}`);
    this.hudKeyText.setText(`${this.player.keys}/${this.player.maxKeys}`);

    for (let i = 0; i < this.hudInventoryKeys.length; i++) {
      this.hudInventoryKeys[i].setAlpha(i < this.player.keys ? 1 : 0.2);
    }
  }

  private updateVisibleTiles(): void {
    const visible = this.getVisibleRoomTiles();
    for (const t of visible) {
      if (this.tileSprites[t.y] && this.tileSprites[t.y][t.x]) {
        if (this.tileSprites[t.y][t.x].alpha < 1) {
          this.tileSprites[t.y][t.x].setAlpha(
            Math.min(1, this.tileSprites[t.y][t.x].alpha + 0.05)
          );
        }
      }
    }
  }

  private gameOver(): void {
    this.gameActive = false;
    (this.game as any).showGameOver();
  }

  private victory(): void {
    this.gameActive = false;
    const elapsed = (this.time.now / 1000) - this.gameStartTime;
    (this.game as any).showVictory(elapsed, this.player.kills);
  }
}

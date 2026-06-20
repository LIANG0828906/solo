import { Hero } from './hero';

export const BOARD_SIZE = 8;

export class Board {
  grid: (Hero | null)[][];
  blueHeroes: Hero[] = [];
  redHeroes: Hero[] = [];

  constructor() {
    this.grid = [];
    for (let y = 0; y < BOARD_SIZE; y++) {
      this.grid[y] = [];
      for (let x = 0; x < BOARD_SIZE; x++) {
        this.grid[y][x] = null;
      }
    }
  }

  placeHero(hero: Hero, x: number, y: number): boolean {
    if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) return false;
    if (this.grid[y][x] !== null) return false;

    if (hero.team === 'blue' && y > 3) return false;
    if (hero.team === 'red' && y < 4) return false;

    this.grid[y][x] = hero;
    hero.x = x;
    hero.y = y;
    if (hero.team === 'blue') {
      this.blueHeroes.push(hero);
    } else {
      this.redHeroes.push(hero);
    }
    return true;
  }

  removeHero(x: number, y: number): Hero | null {
    if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) return null;
    const hero = this.grid[y][x];
    if (!hero) return null;
    this.grid[y][x] = null;
    if (hero.team === 'blue') {
      this.blueHeroes = this.blueHeroes.filter(h => h !== hero);
    } else {
      this.redHeroes = this.redHeroes.filter(h => h !== hero);
    }
    return hero;
  }

  removeHeroById(hero: Hero): void {
    if (hero.y >= 0 && hero.y < BOARD_SIZE && hero.x >= 0 && hero.x < BOARD_SIZE) {
      this.grid[hero.y][hero.x] = null;
    }
    if (hero.team === 'blue') {
      this.blueHeroes = this.blueHeroes.filter(h => h !== hero);
    } else {
      this.redHeroes = this.redHeroes.filter(h => h !== hero);
    }
  }

  moveHero(hero: Hero, newX: number, newY: number): boolean {
    if (newX < 0 || newX >= BOARD_SIZE || newY < 0 || newY >= BOARD_SIZE) return false;
    if (this.grid[newY][newX] !== null) return false;

    if (hero.y >= 0 && hero.y < BOARD_SIZE && hero.x >= 0 && hero.x < BOARD_SIZE) {
      this.grid[hero.y][hero.x] = null;
    }
    this.grid[newY][newX] = hero;
    hero.x = newX;
    hero.y = newY;
    return true;
  }

  findNearestEnemy(hero: Hero): Hero | null {
    const enemies = hero.team === 'blue' ? this.redHeroes : this.blueHeroes;
    let nearest: Hero | null = null;
    let minDist = Infinity;

    for (const enemy of enemies) {
      if (!enemy.isAlive) continue;
      const dist = this.getDistance(hero, enemy);
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    }
    return nearest;
  }

  getDistance(h1: { x: number; y: number }, h2: { x: number; y: number }): number {
    const dx = Math.abs(h1.x - h2.x);
    const dy = Math.abs(h1.y - h2.y);
    return Math.max(dx, dy);
  }

  getChebyshevDistance(h1: { x: number; y: number }, h2: { x: number; y: number }): number {
    return this.getDistance(h1, h2);
  }

  getDirectionToward(from: Hero, to: Hero): { dx: number; dy: number } {
    let dx = 0;
    let dy = 0;
    if (to.x > from.x) dx = 1;
    else if (to.x < from.x) dx = -1;
    if (to.y > from.y) dy = 1;
    else if (to.y < from.y) dy = -1;
    return { dx, dy };
  }

  isInAttackRange(attacker: Hero, target: Hero): boolean {
    return this.getDistance(attacker, target) <= attacker.attackRange;
  }

  getAllHeroes(): Hero[] {
    return [...this.blueHeroes, ...this.redHeroes];
  }

  getAliveHeroes(team: 'blue' | 'red'): Hero[] {
    const heroes = team === 'blue' ? this.blueHeroes : this.redHeroes;
    return heroes.filter(h => h.isAlive);
  }

  clear() {
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        this.grid[y][x] = null;
      }
    }
    this.blueHeroes = [];
    this.redHeroes = [];
  }

  resetForBattle() {
    const allHeroes = this.getAllHeroes();
    this.clear();
    for (const h of allHeroes) {
      h.resetForBattle();
      this.grid[h.y][h.x] = h;
      if (h.team === 'blue') this.blueHeroes.push(h);
      else this.redHeroes.push(h);
    }
  }
}

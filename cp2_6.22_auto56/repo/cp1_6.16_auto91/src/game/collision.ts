import { Player, Obstacle, DataFragment } from '../types';

export interface AABB {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function checkAABBCollision(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function checkPlayerObstacleCollision(player: Player, obstacle: Obstacle): boolean {
  const playerBox: AABB = {
    x: player.x + 4,
    y: player.y + 4,
    width: player.width - 8,
    height: player.height - 8
  };
  
  const obstacleBox: AABB = {
    x: obstacle.x + 2,
    y: obstacle.y + 2,
    width: obstacle.width - 4,
    height: obstacle.height - 4
  };
  
  return checkAABBCollision(playerBox, obstacleBox);
}

export function checkPlayerFragmentCollision(player: Player, fragment: DataFragment): boolean {
  const playerBox: AABB = {
    x: player.x,
    y: player.y,
    width: player.width,
    height: player.height
  };
  
  const fragmentBox: AABB = {
    x: fragment.x - fragment.size / 2,
    y: fragment.y - fragment.size / 2,
    width: fragment.size,
    height: fragment.size
  };
  
  return checkAABBCollision(playerBox, fragmentBox);
}

import { Vector3 } from 'three';
import { useCityStore } from '../store';
import { cityBuilder } from '../scene/CityBuilder';
import { BuildingAttributes } from '../types';

const CLICK_THRESHOLD = 5;
let pointerDownPos: { x: number; y: number } | null = null;

export function onPointerDown(e: PointerEvent): void {
  pointerDownPos = { x: e.clientX, y: e.clientY };
}

export function onPointerUp(e: PointerEvent): boolean {
  if (!pointerDownPos) return false;
  const dx = e.clientX - pointerDownPos.x;
  const dy = e.clientY - pointerDownPos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  pointerDownPos = null;
  return dist < CLICK_THRESHOLD;
}

export function handleGroundClick(
  point: Vector3,
  currentGreenCount: number
): BuildingAttributes | null {
  if (currentGreenCount >= 5) return null;

  const gridPos = cityBuilder.worldToGrid(point.x, point.z);
  if (!gridPos) return null;

  const building = cityBuilder.placeGreenBuilding(gridPos.col, gridPos.row);
  if (building) {
    useCityStore.getState().addBuilding(building);
    return building;
  }
  return null;
}

export function handleBuildingClick(buildingId: string): void {
  const removed = cityBuilder.removeBuilding(buildingId);
  if (removed) {
    useCityStore.getState().removeBuilding(buildingId);
  }
}

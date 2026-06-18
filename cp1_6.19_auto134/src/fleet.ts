import { dataState, Ship } from './dataspace';

const HEXAGON_RADIUS = 30;
const LEAD_RESPONSE_DELAY = 0.3;
const RETURN_DURATION = 0.3;
const RETURN_THRESHOLD = 15;

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export class FleetManager {
  private leadTargetBuffer: Array<{ x: number; y: number; time: number }> = [];
  private lastMaintenanceCheck: number = 0;

  createInitialFleet(startX: number, startY: number): void {
    const ships: Ship[] = [];

    const leadShip: Ship = {
      id: 'lead-1',
      type: 'lead',
      x: startX,
      y: startY,
      targetX: startX,
      targetY: startY,
      homeX: startX,
      homeY: startY,
      homeAngleOffset: 0,
      status: 'normal',
      disturbedUntil: 0,
      disturbedDx: 0,
      disturbedDy: 0,
      returningStart: 0,
      returningDuration: 0,
      returningFromX: startX,
      returningFromY: startY
    };
    ships.push(leadShip);

    const angles = [0, 60, 120, 180, 240, 300].map(a => (a * Math.PI) / 180);
    angles.forEach((angle, idx) => {
      const escort: Ship = {
        id: `escort-${idx + 1}`,
        type: 'escort',
        x: startX + Math.cos(angle) * HEXAGON_RADIUS,
        y: startY + Math.sin(angle) * HEXAGON_RADIUS,
        targetX: startX + Math.cos(angle) * HEXAGON_RADIUS,
        targetY: startY + Math.sin(angle) * HEXAGON_RADIUS,
        homeX: startX + Math.cos(angle) * HEXAGON_RADIUS,
        homeY: startY + Math.sin(angle) * HEXAGON_RADIUS,
        homeAngleOffset: angle,
        status: 'normal',
        disturbedUntil: 0,
        disturbedDx: 0,
        disturbedDy: 0,
        returningStart: 0,
        returningDuration: 0,
        returningFromX: startX + Math.cos(angle) * HEXAGON_RADIUS,
        returningFromY: startY + Math.sin(angle) * HEXAGON_RADIUS
      };
      ships.push(escort);
    });

    dataState.setShips(ships);
    dataState.setGuidePosition(startX, startY);
  }

  update(deltaTime: number, currentTime: number): void {
    const lead = dataState.getLeadShip();
    if (!lead) return;

    const guidePos = dataState.getGuidePosition();
    this.leadTargetBuffer.push({ x: guidePos.x, y: guidePos.y, time: currentTime });
    const cutoffTime = currentTime - LEAD_RESPONSE_DELAY * 1000;
    while (this.leadTargetBuffer.length > 1 && this.leadTargetBuffer[0].time < cutoffTime) {
      this.leadTargetBuffer.shift();
    }
    const delayedTarget = this.leadTargetBuffer[0];

    const lerpFactor = Math.min(1, deltaTime / 0.2);
    lead.x += (delayedTarget.x - lead.x) * lerpFactor;
    lead.y += (delayedTarget.y - lead.y) * lerpFactor;
    lead.targetX = delayedTarget.x;
    lead.targetY = delayedTarget.y;

    this.updateEscortHomePositions(lead.x, lead.y);

    const escorts = dataState.getEscortShips();
    escorts.forEach(ship => {
      if (ship.status === 'disturbed' && ship.disturbedUntil > currentTime) {
        ship.x += ship.disturbedDx * deltaTime * 2;
        ship.y += ship.disturbedDy * deltaTime * 2;
      } else {
        if (ship.status === 'disturbed' && ship.disturbedUntil <= currentTime) {
          ship.status = 'normal';
          this.startReturning(ship, currentTime);
        }

        if (ship.returningDuration > 0) {
          const elapsed = (currentTime - ship.returningStart) / 1000;
          const t = Math.min(1, elapsed / ship.returningDuration);
          const eased = easeOut(t);
          ship.x = ship.returningFromX + (ship.homeX - ship.returningFromX) * eased;
          ship.y = ship.returningFromY + (ship.homeY - ship.returningFromY) * eased;
          if (t >= 1) {
            ship.returningDuration = 0;
            ship.x = ship.homeX;
            ship.y = ship.homeY;
          }
        } else {
          ship.x += (ship.homeX - ship.x) * lerpFactor * 0.8;
          ship.y += (ship.homeY - ship.y) * lerpFactor * 0.8;
        }
      }
    });

    if (currentTime - this.lastMaintenanceCheck >= 1000) {
      this.lastMaintenanceCheck = currentTime;
      this.performMaintenance(currentTime);
    }
  }

  private updateEscortHomePositions(leadX: number, leadY: number): void {
    const escorts = dataState.getEscortShips();
    escorts.forEach(ship => {
      ship.homeX = leadX + Math.cos(ship.homeAngleOffset) * HEXAGON_RADIUS;
      ship.homeY = leadY + Math.sin(ship.homeAngleOffset) * HEXAGON_RADIUS;
    });
  }

  private startReturning(ship: Ship, currentTime: number): void {
    ship.returningStart = currentTime;
    ship.returningDuration = RETURN_DURATION;
    ship.returningFromX = ship.x;
    ship.returningFromY = ship.y;
  }

  private performMaintenance(currentTime: number): void {
    const escorts = dataState.getEscortShips();
    escorts.forEach(ship => {
      if (ship.status !== 'disturbed' || ship.disturbedUntil <= currentTime) {
        const dx = ship.x - ship.homeX;
        const dy = ship.y - ship.homeY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > RETURN_THRESHOLD && ship.returningDuration === 0) {
          this.startReturning(ship, currentTime);
          dataState.addLog(`舰艇 ${ship.id} 执行归位修正，偏移 ${dist.toFixed(1)}px`);
        }
      }
    });
  }

  warpFleet(newX: number, newY: number, disruptFormation: boolean): void {
    const ships = dataState.getShips();
    const lead = ships.find(s => s.type === 'lead');
    if (!lead) return;

    dataState.setAllShipsStatus('warping');

    lead.x = newX;
    lead.y = newY;
    lead.targetX = newX;
    lead.targetY = newY;
    lead.homeX = newX;
    lead.homeY = newY;

    dataState.setGuidePosition(newX, newY);
    this.leadTargetBuffer = [{ x: newX, y: newY, time: performance.now() }];

    const escorts = dataState.getEscortShips();
    escorts.forEach(ship => {
      if (disruptFormation) {
        const randomOffset = (Math.random() - 0.5) * 2 * (30 * Math.PI / 180);
        ship.homeAngleOffset += randomOffset;
      }
      ship.homeX = newX + Math.cos(ship.homeAngleOffset) * HEXAGON_RADIUS;
      ship.homeY = newY + Math.sin(ship.homeAngleOffset) * HEXAGON_RADIUS;
      ship.x = ship.homeX;
      ship.y = ship.homeY;
      ship.targetX = ship.homeX;
      ship.targetY = ship.homeY;
      ship.returningDuration = 0;
      ship.status = 'normal';
    });

    lead.status = 'normal';
  }

  applyGravityDisturbance(nebulaX: number, nebulaY: number, currentTime: number): void {
    const escorts = dataState.getEscortShips();
    let affectedCount = 0;
    escorts.forEach(ship => {
      const dx = ship.x - nebulaX;
      const dy = ship.y - nebulaY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 70) {
        const pushDistance = 10 + Math.random() * 10;
        const angle = Math.atan2(dy, dx);
        ship.status = 'disturbed';
        ship.disturbedUntil = currentTime + 500;
        ship.disturbedDx = Math.cos(angle) * pushDistance;
        ship.disturbedDy = Math.sin(angle) * pushDistance;
        ship.returningDuration = 0;
        affectedCount++;
      }
    });
    if (affectedCount > 0) {
      dataState.addLog(`引力波动影响 ${affectedCount} 艘护卫舰`);
    }
  }
}

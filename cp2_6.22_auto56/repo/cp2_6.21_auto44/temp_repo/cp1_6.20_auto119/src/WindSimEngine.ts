import type { Turbine, WindParams, TurbineState, SimulationResult } from './types';

const WAKE_K = 0.075;
const CT = 0.8;
const CUT_IN_SPEED = 3;
const RATED_SPEED = 12;
const CUT_OUT_SPEED = 25;

export class WindSimEngine {
  private turbines: Turbine[] = [];
  private windParams: WindParams = { direction: 0, speed: 10 };

  setTurbines(turbines: Turbine[]): void {
    this.turbines = turbines;
  }

  setWindParams(params: WindParams): void {
    this.windParams = params;
  }

  private getWindVector(): [number, number] {
    const rad = (this.windParams.direction * Math.PI) / 180;
    return [-Math.sin(rad), -Math.cos(rad)];
  }

  private calculateWakeDeficit(
    upstreamTurbine: Turbine,
    downstreamPos: [number, number, number],
    windVector: [number, number]
  ): number {
    const dx = downstreamPos[0] - upstreamTurbine.position[0];
    const dz = downstreamPos[2] - upstreamTurbine.position[2];

    const distanceAlongWind = dx * windVector[0] + dz * windVector[1];
    if (distanceAlongWind <= 0) return 0;

    const perpendicularDist = Math.abs(dx * windVector[1] - dz * windVector[0]);
    const r0 = upstreamTurbine.rotorDiameter / 2;
    const wakeRadius = r0 + WAKE_K * distanceAlongWind;

    if (perpendicularDist > wakeRadius + r0) return 0;

    const overlapFactor = Math.max(0, 1 - perpendicularDist / (wakeRadius + r0));
    const deficitFactor = 1 - Math.sqrt(1 - CT) / Math.pow(1 + (WAKE_K * distanceAlongWind) / r0, 2);

    return deficitFactor * overlapFactor;
  }

  private calculatePowerOutput(effectiveSpeed: number, ratedPower: number): number {
    if (effectiveSpeed < CUT_IN_SPEED || effectiveSpeed > CUT_OUT_SPEED) {
      return 0;
    }

    if (effectiveSpeed >= RATED_SPEED) {
      return ratedPower;
    }

    const normalizedSpeed = (effectiveSpeed - CUT_IN_SPEED) / (RATED_SPEED - CUT_IN_SPEED);
    return ratedPower * Math.pow(normalizedSpeed, 3);
  }

  simulate(): SimulationResult {
    const windVector = this.getWindVector();
    const windSpeed = this.windParams.speed;

    const turbineStates: TurbineState[] = [];
    let totalPower = 0;

    for (let i = 0; i < this.turbines.length; i++) {
      const turbine = this.turbines[i];
      let totalDeficit = 0;

      for (let j = 0; j < this.turbines.length; j++) {
        if (i === j) continue;
        const deficit = this.calculateWakeDeficit(
          this.turbines[j],
          turbine.position,
          windVector
        );
        totalDeficit = Math.max(totalDeficit, deficit);
      }

      const effectiveWindSpeed = windSpeed * (1 - totalDeficit);
      const powerOutput = this.calculatePowerOutput(effectiveWindSpeed, turbine.ratedPower);
      const wakeInfluence = totalDeficit * 100;

      turbineStates.push({
        turbine,
        effectiveWindSpeed,
        powerOutput,
        wakeInfluence,
        powerPercentage: 0,
        index: i,
      });

      totalPower += powerOutput;
    }

    for (const state of turbineStates) {
      state.powerPercentage = totalPower > 0 ? (state.powerOutput / totalPower) * 100 : 0;
    }

    return {
      turbineStates,
      totalPower,
      timestamp: Date.now(),
    };
  }

  getWakeStreamlinePoints(
    turbine: Turbine,
    windVector: [number, number],
    speed: number,
    numPoints: number = 20
  ): Array<[number, number, number]> {
    const points: Array<[number, number, number]> = [];
    const maxDistance = 200 + speed * 15;
    const r0 = turbine.rotorDiameter / 2;
    const hubHeight = turbine.hubHeight;

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const distance = t * maxDistance;
      const wakeRadius = r0 + WAKE_K * distance;

      const x = turbine.position[0] + windVector[0] * distance;
      const z = turbine.position[2] + windVector[1] * distance;

      const offsetAngle = (i * 2 * Math.PI) / 5 + turbine.id.charCodeAt(0);
      const radiusOffset = wakeRadius * 0.5 * (1 - t * 0.5);
      const y = hubHeight + Math.sin(offsetAngle) * radiusOffset * 0.3;

      points.push([
        x + Math.cos(offsetAngle) * radiusOffset,
        y,
        z + Math.sin(offsetAngle) * radiusOffset,
      ]);
    }

    return points;
  }
}

export const windSimEngine = new WindSimEngine();

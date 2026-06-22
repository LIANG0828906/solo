export interface PendulumState {
  theta1: number;
  theta2: number;
  omega1: number;
  omega2: number;
}

export interface PendulumPosition {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export class DoublePendulum {
  public l1: number;
  public l2: number;
  public m1: number;
  public m2: number;
  public g: number;
  public state: PendulumState;
  public initialState: PendulumState;
  public speed: number;

  constructor(
    l1: number = 120,
    l2: number = 80,
    m1: number = 1,
    m2: number = 1,
    g: number = 9.81 * 100
  ) {
    this.l1 = l1;
    this.l2 = l2;
    this.m1 = m1;
    this.m2 = m2;
    this.g = g;
    this.speed = 1.0;
    this.state = {
      theta1: Math.PI / 2,
      theta2: Math.PI / 2,
      omega1: 0,
      omega2: 0
    };
    this.initialState = { ...this.state };
  }

  public setInitialAngles(theta1: number, theta2: number): void {
    this.initialState.theta1 = theta1;
    this.initialState.theta2 = theta2;
    this.reset();
  }

  public reset(): void {
    this.state = {
      theta1: this.initialState.theta1,
      theta2: this.initialState.theta2,
      omega1: 0,
      omega2: 0
    };
  }

  private derivatives(state: PendulumState): PendulumState {
    const { theta1, theta2, omega1, omega2 } = state;
    const delta = theta2 - theta1;
    const sinDelta = Math.sin(delta);
    const cosDelta = Math.cos(delta);

    const denom1 = (this.m1 + this.m2) * this.l1 - this.m2 * this.l1 * cosDelta * cosDelta;
    const denom2 = (this.l2 / this.l1) * denom1;

    const alpha1 = (
      this.m2 * this.l1 * omega1 * omega1 * sinDelta * cosDelta +
      this.m2 * this.g * Math.sin(theta2) * cosDelta +
      this.m2 * this.l2 * omega2 * omega2 * sinDelta -
      (this.m1 + this.m2) * this.g * Math.sin(theta1)
    ) / denom1;

    const alpha2 = (
      -this.m2 * this.l2 * omega2 * omega2 * sinDelta * cosDelta +
      (this.m1 + this.m2) * this.g * Math.sin(theta1) * cosDelta -
      (this.m1 + this.m2) * this.l1 * omega1 * omega1 * sinDelta -
      (this.m1 + this.m2) * this.g * Math.sin(theta2)
    ) / denom2;

    return {
      theta1: omega1,
      theta2: omega2,
      omega1: alpha1,
      omega2: alpha2
    };
  }

  public step(dt: number): void {
    const adjustedDt = dt * this.speed;
    const k1 = this.derivatives(this.state);

    const state2: PendulumState = {
      theta1: this.state.theta1 + k1.theta1 * adjustedDt * 0.5,
      theta2: this.state.theta2 + k1.theta2 * adjustedDt * 0.5,
      omega1: this.state.omega1 + k1.omega1 * adjustedDt * 0.5,
      omega2: this.state.omega2 + k1.omega2 * adjustedDt * 0.5
    };
    const k2 = this.derivatives(state2);

    const state3: PendulumState = {
      theta1: this.state.theta1 + k2.theta1 * adjustedDt * 0.5,
      theta2: this.state.theta2 + k2.theta2 * adjustedDt * 0.5,
      omega1: this.state.omega1 + k2.omega1 * adjustedDt * 0.5,
      omega2: this.state.omega2 + k2.omega2 * adjustedDt * 0.5
    };
    const k3 = this.derivatives(state3);

    const state4: PendulumState = {
      theta1: this.state.theta1 + k3.theta1 * adjustedDt,
      theta2: this.state.theta2 + k3.theta2 * adjustedDt,
      omega1: this.state.omega1 + k3.omega1 * adjustedDt,
      omega2: this.state.omega2 + k3.omega2 * adjustedDt
    };
    const k4 = this.derivatives(state4);

    this.state.theta1 += (adjustedDt / 6) * (k1.theta1 + 2 * k2.theta1 + 2 * k3.theta1 + k4.theta1);
    this.state.theta2 += (adjustedDt / 6) * (k1.theta2 + 2 * k2.theta2 + 2 * k3.theta2 + k4.theta2);
    this.state.omega1 += (adjustedDt / 6) * (k1.omega1 + 2 * k2.omega1 + 2 * k3.omega1 + k4.omega1);
    this.state.omega2 += (adjustedDt / 6) * (k1.omega2 + 2 * k2.omega2 + 2 * k3.omega2 + k4.omega2);
  }

  public getPositions(originX: number, originY: number): PendulumPosition {
    const x1 = originX + this.l1 * Math.sin(this.state.theta1);
    const y1 = originY + this.l1 * Math.cos(this.state.theta1);
    const x2 = x1 + this.l2 * Math.sin(this.state.theta2);
    const y2 = y1 + this.l2 * Math.cos(this.state.theta2);
    return { x1, y1, x2, y2 };
  }
}

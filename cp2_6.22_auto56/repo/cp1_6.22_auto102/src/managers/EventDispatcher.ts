import { PhysicsEvent, CollisionParticle, EnergyRipple } from '@/types';

type EventCallback = (event: PhysicsEvent) => void;
type ParticleCallback = (particle: CollisionParticle) => void;
type RippleCallback = (ripple: EnergyRipple) => void;

export class EventDispatcher {
  private physicsListeners: Set<EventCallback> = new Set();
  private particleListeners: Set<ParticleCallback> = new Set();
  private rippleListeners: Set<RippleCallback> = new Set();
  private eventQueue: PhysicsEvent[] = [];

  public addPhysicsListener(callback: EventCallback): void {
    this.physicsListeners.add(callback);
  }

  public removePhysicsListener(callback: EventCallback): void {
    this.physicsListeners.delete(callback);
  }

  public addParticleListener(callback: ParticleCallback): void {
    this.particleListeners.add(callback);
  }

  public removeParticleListener(callback: ParticleCallback): void {
    this.particleListeners.delete(callback);
  }

  public addRippleListener(callback: RippleCallback): void {
    this.rippleListeners.add(callback);
  }

  public removeRippleListener(callback: RippleCallback): void {
    this.rippleListeners.delete(callback);
  }

  public dispatchEvent(event: PhysicsEvent): void {
    this.eventQueue.push(event);
  }

  public dispatchParticle(particle: CollisionParticle): void {
    this.particleListeners.forEach((callback) => callback(particle));
  }

  public dispatchRipple(ripple: EnergyRipple): void {
    this.rippleListeners.forEach((callback) => callback(ripple));
  }

  public processEvents(): void {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;
      this.physicsListeners.forEach((callback) => callback(event));
    }
  }

  public clear(): void {
    this.eventQueue = [];
  }
}

import * as THREE from 'three';

export class FoodManager {
  private foods: THREE.Mesh[] = [];
  private timerId: ReturnType<typeof setInterval> | null = null;

  generate(count: number, bounds: number): void {
    const half = bounds / 2;
    for (let i = 0; i < count; i++) {
      const geometry = new THREE.SphereGeometry(0.1, 12, 12);
      const material = new THREE.MeshBasicMaterial({
        color: 0xa5d6a7,
        transparent: true,
        opacity: 0.8,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        (Math.random() - 0.5) * bounds,
        (Math.random() - 0.5) * bounds,
        (Math.random() - 0.5) * bounds
      );
      const light = new THREE.PointLight(0xa5d6a7, 0.1, 1.5);
      mesh.add(light);
      (mesh as any)._light = light;
      this.foods.push(mesh);
    }
  }

  spawnPeriodic(interval: number = 2000): void {
    this.timerId = setInterval(() => {
      this.generate(5, 30);
    }, interval);
  }

  consume(food: THREE.Mesh): void {
    const index = this.foods.indexOf(food);
    if (index === -1) return;
    this.foods.splice(index, 1);
    if ((food as any)._light) {
      food.remove((food as any)._light);
      (food as any)._light.dispose();
      (food as any)._light = undefined;
    }
    food.geometry.dispose();
    (food.material as THREE.MeshBasicMaterial).dispose();
    if (food.parent) {
      food.parent.remove(food);
    }
  }

  getAll(): THREE.Mesh[] {
    return this.foods;
  }

  getCount(): number {
    return this.foods.length;
  }

  dispose(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    for (const food of this.foods) {
      if ((food as any)._light) {
        food.remove((food as any)._light);
        (food as any)._light.dispose();
      }
      food.geometry.dispose();
      (food.material as THREE.MeshBasicMaterial).dispose();
      if (food.parent) {
        food.parent.remove(food);
      }
    }
    this.foods = [];
  }
}

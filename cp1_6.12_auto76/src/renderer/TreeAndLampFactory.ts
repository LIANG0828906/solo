import * as THREE from 'three';

export type TreeLampType = 'tree' | 'lamp';

export class TreeAndLampFactory {
  public static create(type: TreeLampType, isNight: boolean): THREE.Group {
    if (type === 'tree') {
      return this.createTree();
    } else {
      return this.createLamp(isNight);
    }
  }

  private static createTree(): THREE.Group {
    const group = new THREE.Group();

    const trunkHeight = 1.0 + Math.random() * 0.5;
    const trunkRadius = 0.12 + Math.random() * 0.05;

    const trunkGeom = new THREE.CylinderGeometry(trunkRadius * 0.8, trunkRadius, trunkHeight, 8);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x7A5230,
      roughness: 0.9,
      metalness: 0.0
    });
    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    group.add(trunk);

    const foliageRadius = 0.8 + Math.random() * 0.4;
    const foliageGeom = new THREE.SphereGeometry(foliageRadius, 10, 8);
    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x4A7A4A,
      roughness: 0.8,
      metalness: 0.0
    });
    const foliage = new THREE.Mesh(foliageGeom, foliageMat);
    foliage.position.y = trunkHeight + foliageRadius * 0.7;
    foliage.castShadow = true;
    group.add(foliage);

    const foliage2Geom = new THREE.SphereGeometry(foliageRadius * 0.7, 8, 6);
    const foliage2 = new THREE.Mesh(foliage2Geom, foliageMat);
    foliage2.position.set(
      (Math.random() - 0.5) * 0.5,
      trunkHeight + foliageRadius * 1.0,
      (Math.random() - 0.5) * 0.5
    );
    foliage2.castShadow = true;
    group.add(foliage2);

    return group;
  }

  private static createLamp(isNight: boolean): THREE.Group {
    const group = new THREE.Group();

    const poleHeight = 3.5;
    const poleRadius = 0.08;

    const poleGeom = new THREE.CylinderGeometry(poleRadius, poleRadius * 1.2, poleHeight, 10);
    const poleMat = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.5,
      metalness: 0.7
    });
    const pole = new THREE.Mesh(poleGeom, poleMat);
    pole.position.y = poleHeight / 2;
    pole.castShadow = true;
    group.add(pole);

    const baseGeom = new THREE.CylinderGeometry(poleRadius * 1.8, poleRadius * 2.0, 0.15, 12);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.6,
      metalness: 0.5
    });
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = 0.075;
    base.receiveShadow = true;
    group.add(base);

    const armLength = 0.4;
    const armGeom = new THREE.BoxGeometry(0.06, 0.06, armLength);
    const armMat = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.5,
      metalness: 0.7
    });
    const arm = new THREE.Mesh(armGeom, armMat);
    arm.position.set(0, poleHeight - 0.1, armLength / 2);
    group.add(arm);

    const glowColor = isNight ? 0xffee88 : 0xaaaaaa;
    const glowGeom = new THREE.SphereGeometry(0.2, 12, 10);
    const glowMat = new THREE.MeshBasicMaterial({
      color: glowColor
    });
    const glow = new THREE.Mesh(glowGeom, glowMat);
    glow.position.set(0, poleHeight - 0.1, armLength + 0.1);
    glow.name = 'lampGlow';
    group.add(glow);

    const fixtureGeom = new THREE.CylinderGeometry(0.18, 0.22, 0.12, 12);
    const fixtureMat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.4,
      metalness: 0.6
    });
    const fixture = new THREE.Mesh(fixtureGeom, fixtureMat);
    fixture.position.set(0, poleHeight - 0.05, armLength + 0.1);
    group.add(fixture);

    const lampLight = new THREE.PointLight(0xffee88, isNight ? 2.0 : 0.0, 8, 2);
    lampLight.position.copy(glow.position);
    lampLight.name = 'lampLight';
    group.add(lampLight);

    return group;
  }
}

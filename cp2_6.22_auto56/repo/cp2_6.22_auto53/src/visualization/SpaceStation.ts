import * as THREE from 'three';

export enum DockingStatus {
  FAR = 'far',
  APPROACHING = 'approaching',
  NEAR = 'near',
  LOCKED = 'locked'
}

export class SpaceStation {
  private scene: THREE.Scene;
  public group: THREE.Group;
  private dockingPort: THREE.Group;
  private dockingLight: THREE.PointLight;
  private status: DockingStatus = DockingStatus.FAR;
  private glowMesh: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.dockingPort = new THREE.Group();
    this.dockingLight = new THREE.PointLight(0x00ff9d, 2, 15);
    this.glowMesh = new THREE.Mesh();
    this.build();
  }

  private createHighLightMaterial(color: number): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color,
      metalness: 0.9,
      roughness: 0.1
    });
  }

  build(): void {
    const stationGroup = new THREE.Group();
    const coreMaterial = this.createHighLightMaterial(0xe0e8f0);
    const labMaterial = this.createHighLightMaterial(0xd0d8e8);
    const nodeMaterial = this.createHighLightMaterial(0xf0f0f5);
    const panelMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a3a6e,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x0a1530,
      emissiveIntensity: 0.3
    });
    const darkMaterial = new THREE.MeshStandardMaterial({
      color: 0x202830,
      metalness: 0.6,
      roughness: 0.3
    });

    const coreModule = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 1.8, 8, 24),
      coreMaterial
    );
    coreModule.rotation.z = Math.PI / 2;
    stationGroup.add(coreModule);

    for (let side = -1; side <= 1; side += 2) {
      const solarPanel = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 14, 4.5),
        panelMaterial
      );
      solarPanel.position.set(0, side * 5, 0);
      stationGroup.add(solarPanel);

      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 2; col++) {
          const cell = new THREE.Mesh(
            new THREE.BoxGeometry(0.17, 1.8, 1.8),
            new THREE.MeshStandardMaterial({
              color: 0x2850a0,
              metalness: 0.5,
              roughness: 0.4,
              emissive: 0x102040,
              emissiveIntensity: 0.2
            })
          );
          cell.position.set(
            0,
            side * (2 + row * 2.1),
            -1 + col * 2.1
          );
          stationGroup.add(cell);
        }
      }
    }

    const labLeft = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.4, 5, 24),
      labMaterial
    );
    labLeft.position.set(-5.5, 0, 0);
    labLeft.rotation.z = Math.PI / 2;
    stationGroup.add(labLeft);

    const labLeftEnd = new THREE.Mesh(
      new THREE.SphereGeometry(1.4, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      labMaterial
    );
    labLeftEnd.position.set(-8, 0, 0);
    labLeftEnd.rotation.y = Math.PI / 2;
    stationGroup.add(labLeftEnd);

    const labRight = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.4, 5, 24),
      labMaterial
    );
    labRight.position.set(5.5, 0, 0);
    labRight.rotation.z = Math.PI / 2;
    stationGroup.add(labRight);

    const labRightEnd = new THREE.Mesh(
      new THREE.SphereGeometry(1.4, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      labMaterial
    );
    labRightEnd.position.set(8, 0, 0);
    labRightEnd.rotation.y = -Math.PI / 2;
    stationGroup.add(labRightEnd);

    const nodeModule = new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 24, 24),
      nodeMaterial
    );
    nodeModule.position.set(4.5, 0, 0);
    stationGroup.add(nodeModule);

    for (let i = 0; i < 6; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.82, 0.08, 8, 32),
        darkMaterial
      );
      ring.position.set(-3 + i * 1.2, 0, 0);
      ring.rotation.y = Math.PI / 2;
      stationGroup.add(ring);
    }

    const dockingAdapter = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1, 1.2, 16),
      nodeMaterial
    );
    dockingAdapter.position.set(4.5, 0, 2.8);
    dockingAdapter.rotation.x = Math.PI / 2;
    stationGroup.add(dockingAdapter);

    const dockingRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.1, 0.12, 12, 32),
      darkMaterial
    );
    dockingRing.position.set(4.5, 0, 3.5);
    stationGroup.add(dockingRing);

    const dockingFrameMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4757,
      transparent: true,
      opacity: 0.85
    });

    const frameSize = 2.2;
    const edgeGeo = new THREE.BoxGeometry(frameSize, 0.08, 0.08);
    const edgeGeoV = new THREE.BoxGeometry(0.08, frameSize, 0.08);

    const corners = [
      { x: -1, y: 1, z: 0, geo: edgeGeo, rot: 'none' },
      { x: 1, y: 1, z: 0, geo: edgeGeo, rot: 'none' },
      { x: -1, y: -1, z: 0, geo: edgeGeo, rot: 'none' },
      { x: 1, y: -1, z: 0, geo: edgeGeo, rot: 'none' },
      { x: -1, y: 1, z: 0, geo: edgeGeoV, rot: 'none' },
      { x: -1, y: -1, z: 0, geo: edgeGeoV, rot: 'none' },
      { x: 1, y: 1, z: 0, geo: edgeGeoV, rot: 'none' },
      { x: 1, y: -1, z: 0, geo: edgeGeoV, rot: 'none' }
    ];

    corners.forEach(c => {
      const mesh = new THREE.Mesh(c.geo, dockingFrameMaterial.clone());
      mesh.position.set(
        4.5 + (c.geo === edgeGeo ? c.x * frameSize * 0.5 : c.x * frameSize * 0.5),
        c.y * frameSize * 0.5,
        4.2
      );
      (mesh.material as THREE.MeshBasicMaterial).name = 'dockingFrameEdge';
      this.dockingPort.add(mesh);
    });

    const glowGeo = new THREE.RingGeometry(1.0, 1.25, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x00ff9d,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    this.glowMesh = new THREE.Mesh(glowGeo, glowMat);
    this.glowMesh.position.set(4.5, 0, 3.55);
    this.dockingPort.add(this.glowMesh);

    this.dockingLight.position.set(4.5, 0, 4.5);
    this.dockingPort.add(this.dockingLight);

    stationGroup.add(this.dockingPort);
    this.group.add(stationGroup);
    this.scene.add(this.group);
  }

  updateDockingStatus(status: DockingStatus): void {
    this.status = status;
    let color = 0xff4757;
    let opacity = 0.85;
    let glowIntensity = 1.2;
    let glowOpacity = 0.4;
    switch (status) {
      case DockingStatus.APPROACHING:
        color = 0xffaa00;
        glowIntensity = 1.8;
        glowOpacity = 0.6;
        break;
      case DockingStatus.NEAR:
        color = 0x99ff44;
        glowIntensity = 2.4;
        glowOpacity = 0.75;
        break;
      case DockingStatus.LOCKED:
        color = 0x00ff9d;
        opacity = 1;
        glowIntensity = 3;
        glowOpacity = 0.95;
        break;
    }
    this.dockingPort.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        const mat = mesh.material as THREE.MeshBasicMaterial;
        if (mat && mat.name === 'dockingFrameEdge') {
          mat.color.setHex(color);
          mat.opacity = opacity;
        }
      }
    });
    const glowMat = this.glowMesh.material as THREE.MeshBasicMaterial;
    glowMat.color.setHex(0x00ff9d);
    glowMat.opacity = glowOpacity;
    this.dockingLight.intensity = glowIntensity;
  }

  getDockingPortWorldPosition(): THREE.Vector3 {
    const pos = new THREE.Vector3(4.5, 0, 4.5);
    this.dockingPort.localToWorld(pos);
    this.group.localToWorld(pos);
    return pos;
  }

  getDockingPortWorldQuaternion(): THREE.Quaternion {
    this.dockingPort.updateMatrixWorld(true);
    this.group.updateMatrixWorld(true);
    const q = new THREE.Quaternion();
    q.copy(this.dockingPort.quaternion).premultiply(this.group.quaternion);
    return q;
  }

  update(delta: number, time: number): void {
    this.glowMesh.rotation.z += delta * 0.5;
    const pulse = 1 + Math.sin(time * 3) * 0.15;
    (this.glowMesh.material as THREE.MeshBasicMaterial).opacity =
      ((this.glowMesh.material as THREE.MeshBasicMaterial).opacity + 0) * pulse;
  }
}

import * as THREE from 'three';

export type BuildingType = 'residential' | 'office' | 'commercial';

export interface BuildingData {
  mesh: THREE.Group;
  floorCount: number;
  windowLights: THREE.Mesh[];
}

export class BuildingFactory {
  private static readonly FLOOR_HEIGHT = 2;

  public static create(type: BuildingType, isNight: boolean): BuildingData {
    switch (type) {
      case 'residential':
        return this.createResidential(isNight);
      case 'office':
        return this.createOffice(isNight);
      case 'commercial':
        return this.createCommercial(isNight);
    }
  }

  private static createResidential(isNight: boolean): BuildingData {
    const group = new THREE.Group();
    const floorCount = 2 + Math.floor(Math.random() * 3);
    const width = 1.8;
    const depth = 1.8;
    const height = floorCount * this.FLOOR_HEIGHT;

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xE8D5A8,
      roughness: 0.8,
      metalness: 0.1
    });
    const bodyGeometry = new THREE.BoxGeometry(width, height, depth);
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = height / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const windowLights: THREE.Mesh[] = [];
    const windowColor = isNight ? 0xffcc66 : 0x333333;
    const windowMaterial = new THREE.MeshBasicMaterial({ color: windowColor });

    const windowWidth = 0.25;
    const windowHeight = 0.6;
    const windowGeom = new THREE.BoxGeometry(windowWidth, windowHeight, 0.05);

    for (let floor = 0; floor < floorCount; floor++) {
      for (let col = 0; col < 2; col++) {
        const wx = (col - 0.5) * 0.6;
        const wy = floor * this.FLOOR_HEIGHT + this.FLOOR_HEIGHT / 2 + 0.3;

        const frontWin = new THREE.Mesh(windowGeom, windowMaterial);
        frontWin.position.set(wx, wy, depth / 2 + 0.02);
        group.add(frontWin);
        windowLights.push(frontWin);

        const backWin = new THREE.Mesh(windowGeom, windowMaterial);
        backWin.position.set(wx, wy, -depth / 2 - 0.02);
        group.add(backWin);
        windowLights.push(backWin);

        const leftWin = new THREE.Mesh(windowGeom, windowMaterial);
        leftWin.rotation.y = Math.PI / 2;
        leftWin.position.set(-width / 2 - 0.02, wy, wx);
        group.add(leftWin);
        windowLights.push(leftWin);

        const rightWin = new THREE.Mesh(windowGeom, windowMaterial);
        rightWin.rotation.y = Math.PI / 2;
        rightWin.position.set(width / 2 + 0.02, wy, wx);
        group.add(rightWin);
        windowLights.push(rightWin);
      }
    }

    const roofGeom = new THREE.BoxGeometry(width * 1.05, 0.2, depth * 1.05);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xA0826D, roughness: 0.9 });
    const roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.y = height + 0.1;
    roof.castShadow = true;
    group.add(roof);

    return { mesh: group, floorCount, windowLights };
  }

  private static createOffice(isNight: boolean): BuildingData {
    const group = new THREE.Group();
    const floorCount = 8 + Math.floor(Math.random() * 8);
    const width = 1.7;
    const depth = 1.7;
    const height = floorCount * this.FLOOR_HEIGHT;

    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x5B8DB8,
      roughness: 0.2,
      metalness: 0.6,
      transparent: true,
      opacity: 0.85
    });
    const bodyGeometry = new THREE.BoxGeometry(width, height, depth);
    const body = new THREE.Mesh(bodyGeometry, glassMaterial);
    body.position.y = height / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 0.5,
      metalness: 0.8
    });

    const frameThickness = 0.05;
    for (let i = 0; i <= floorCount; i++) {
      const y = i * this.FLOOR_HEIGHT;
      const ringGeom = new THREE.BoxGeometry(width + frameThickness, frameThickness, depth + frameThickness);
      const ring = new THREE.Mesh(ringGeom, frameMaterial);
      ring.position.y = y;
      group.add(ring);
    }

    const windowLights: THREE.Mesh[] = [];
    const windowColor = isNight ? 0xffcc66 : 0x1a2a3a;
    const windowMaterial = new THREE.MeshBasicMaterial({
      color: windowColor,
      transparent: true,
      opacity: isNight ? 0.8 : 0.3
    });

    const tileGeom = new THREE.PlaneGeometry(0.3, 0.8);
    for (let floor = 0; floor < floorCount; floor++) {
      for (let col = 0; col < 3; col++) {
        const wx = (col - 1) * 0.4;
        const wy = floor * this.FLOOR_HEIGHT + this.FLOOR_HEIGHT / 2;

        const lit = Math.random() > 0.3 || isNight;
        if (!lit) continue;

        const frontWin = new THREE.Mesh(tileGeom, windowMaterial);
        frontWin.position.set(wx, wy, depth / 2 + 0.02);
        group.add(frontWin);
        windowLights.push(frontWin);

        const backWin = new THREE.Mesh(tileGeom, windowMaterial);
        backWin.position.set(wx, wy, -depth / 2 - 0.02);
        backWin.rotation.y = Math.PI;
        group.add(backWin);
        windowLights.push(backWin);

        const leftWin = new THREE.Mesh(tileGeom, windowMaterial);
        leftWin.rotation.y = -Math.PI / 2;
        leftWin.position.set(-width / 2 - 0.02, wy, wx);
        group.add(leftWin);
        windowLights.push(leftWin);

        const rightWin = new THREE.Mesh(tileGeom, windowMaterial);
        rightWin.rotation.y = Math.PI / 2;
        rightWin.position.set(width / 2 + 0.02, wy, wx);
        group.add(rightWin);
        windowLights.push(rightWin);
      }
    }

    const topGeom = new THREE.BoxGeometry(width * 0.6, 0.8, depth * 0.6);
    const topMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5, metalness: 0.7 });
    const top = new THREE.Mesh(topGeom, topMat);
    top.position.y = height + 0.4;
    top.castShadow = true;
    group.add(top);

    return { mesh: group, floorCount, windowLights };
  }

  private static createCommercial(isNight: boolean): BuildingData {
    const group = new THREE.Group();
    const floorCount = 1 + Math.floor(Math.random() * 3);
    const width = 1.8;
    const depth = 1.8;
    const height = floorCount * this.FLOOR_HEIGHT;

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xC25656,
      roughness: 0.7,
      metalness: 0.2
    });
    const bodyGeometry = new THREE.BoxGeometry(width, height, depth);
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = height / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const stripeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
      metalness: 0.3
    });
    const stripeHeight = 0.15;
    for (let i = 0; i < floorCount; i++) {
      const stripeGeom = new THREE.BoxGeometry(width + 0.02, stripeHeight, depth + 0.02);
      const stripe = new THREE.Mesh(stripeGeom, stripeMaterial);
      stripe.position.y = i * this.FLOOR_HEIGHT + 0.2;
      group.add(stripe);
    }

    const windowLights: THREE.Mesh[] = [];
    const windowColor = isNight ? 0xffcc66 : 0x222222;
    const windowMaterial = new THREE.MeshBasicMaterial({
      color: windowColor,
      transparent: true,
      opacity: 0.9
    });

    const signWidth = width * 0.7;
    const signHeight = 0.6;
    const signGeom = new THREE.PlaneGeometry(signWidth, signHeight);

    const frontSign = new THREE.Mesh(signGeom, windowMaterial);
    frontSign.position.set(0, this.FLOOR_HEIGHT / 2, depth / 2 + 0.03);
    group.add(frontSign);
    windowLights.push(frontSign);

    const backSign = new THREE.Mesh(signGeom, windowMaterial);
    backSign.position.set(0, this.FLOOR_HEIGHT / 2, -depth / 2 - 0.03);
    backSign.rotation.y = Math.PI;
    group.add(backSign);
    windowLights.push(backSign);

    const winGeom = new THREE.BoxGeometry(0.5, 0.8, 0.05);
    for (let floor = 0; floor < floorCount; floor++) {
      const wy = floor * this.FLOOR_HEIGHT + this.FLOOR_HEIGHT / 2 + 0.6;

      const f1 = new THREE.Mesh(winGeom, windowMaterial);
      f1.position.set(-0.45, wy, depth / 2 + 0.02);
      group.add(f1);
      windowLights.push(f1);

      const f2 = new THREE.Mesh(winGeom, windowMaterial);
      f2.position.set(0.45, wy, depth / 2 + 0.02);
      group.add(f2);
      windowLights.push(f2);

      const b1 = new THREE.Mesh(winGeom, windowMaterial);
      b1.position.set(-0.45, wy, -depth / 2 - 0.02);
      group.add(b1);
      windowLights.push(b1);

      const b2 = new THREE.Mesh(winGeom, windowMaterial);
      b2.position.set(0.45, wy, -depth / 2 - 0.02);
      group.add(b2);
      windowLights.push(b2);
    }

    return { mesh: group, floorCount, windowLights };
  }
}

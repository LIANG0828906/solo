import * as THREE from 'three';
import type { Artwork } from '../../shared/types';

export interface FrameData {
  group: THREE.Group;
  artworkId: string;
  originalMaterial: THREE.MeshPhongMaterial | THREE.MeshStandardMaterial;
  frameBorder: THREE.Mesh;
  originalBorderColor: THREE.Color;
}

const textureLoader = new THREE.TextureLoader();

const loadTextureAsync = (url: string): Promise<THREE.Texture> => {
  return new Promise((resolve, reject) => {
    textureLoader.load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        resolve(texture);
      },
      undefined,
      reject
    );
  });
};

export const ArtworkRenderer = {
  createFrame: async (
    artwork: Artwork,
    frameWidth: number = 2,
    frameHeight: number = 1.5
  ): Promise<FrameData> => {
    const group = new THREE.Group();
    group.userData = { artworkId: artwork.id, type: 'artwork' };

    const frameBorderThickness = 0.1;
    const borderColor = new THREE.Color(0x1a1a1a);

    const borderGeometry = new THREE.BoxGeometry(
      frameWidth + frameBorderThickness * 2,
      frameHeight + frameBorderThickness * 2,
      0.08
    );
    const borderMaterial = new THREE.MeshPhongMaterial({
      color: borderColor,
      shininess: 50,
      specular: new THREE.Color(0x222222),
    });
    const frameBorder = new THREE.Mesh(borderGeometry, borderMaterial);
    frameBorder.position.z = -0.01;
    group.add(frameBorder);

    let texture: THREE.Texture;
    try {
      texture = await loadTextureAsync(artwork.imageUrl);
    } catch (e) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 384;
      const ctx = canvas.getContext('2d')!;
      const gradient = ctx.createLinearGradient(0, 0, 512, 384);
      gradient.addColorStop(0, '#3A3A5E');
      gradient.addColorStop(0.5, '#2C3E50');
      gradient.addColorStop(1, '#1A1A2E');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 384);
      ctx.fillStyle = '#E0E0E0';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(artwork.title, 256, 192);
      texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
    }

    const ratio = Math.min(
      (frameWidth - 0.1) / artwork.width,
      (frameHeight - 0.1) / artwork.height
    );
    const displayWidth = Math.min(frameWidth - 0.1, artwork.width * ratio);
    const displayHeight = Math.min(frameHeight - 0.1, artwork.height * ratio);

    const planeGeometry = new THREE.PlaneGeometry(displayWidth, displayHeight);
    const material = new THREE.MeshPhongMaterial({
      map: texture,
      shininess: 20,
    });
    const plane = new THREE.Mesh(planeGeometry, material);
    plane.position.z = 0.01;
    group.add(plane);

    return {
      group,
      artworkId: artwork.id,
      originalMaterial: material,
      frameBorder,
      originalBorderColor: borderColor.clone(),
    };
  },

  setHighlight: (
    frame: FrameData,
    highlighted: boolean,
    highlightColor: number = 0xffd700,
    lineWidth: number = 0.12
  ) => {
    const borderMesh = frame.frameBorder;
    const borderMat = borderMesh.material as THREE.MeshPhongMaterial;
    if (highlighted) {
      borderMat.color.setHex(highlightColor);
      borderMat.emissive = new THREE.Color(highlightColor).multiplyScalar(0.25);
      const geo = borderMesh.geometry as THREE.BoxGeometry;
      const params = geo.parameters;
      const newGeo = new THREE.BoxGeometry(
        params.width + lineWidth,
        params.height + lineWidth,
        params.depth + 0.02
      );
      borderMesh.geometry.dispose();
      borderMesh.geometry = newGeo;
    } else {
      borderMat.color.copy(frame.originalBorderColor);
      borderMat.emissive = new THREE.Color(0x000000);
      const geo = borderMesh.geometry as THREE.BoxGeometry;
      const params = geo.parameters;
      const originalWidth = (frameWidth_: number) => frameWidth_;
      const w = params.width;
      const h = params.height;
      const newGeo = new THREE.BoxGeometry(w - lineWidth, h - lineWidth, params.depth - 0.02);
      borderMesh.geometry.dispose();
      borderMesh.geometry = newGeo;
    }
  },

  createRoom: (
    width: number = 24,
    height: number = 6,
    depth: number = 24,
    wallColor: string = '#C4B7A6',
    floorGlossiness: number = 0.3
  ): THREE.Group => {
    const room = new THREE.Group();
    const wallColorHex = new THREE.Color(wallColor);

    const wallMat = new THREE.MeshPhongMaterial({
      color: wallColorHex,
      side: THREE.BackSide,
      shininess: 10,
    });

    const boxGeometry = new THREE.BoxGeometry(width, height, depth);
    const roomBox = new THREE.Mesh(boxGeometry, wallMat);
    room.add(roomBox);

    const floorColor = new THREE.Color('#8B7355');
    const floorMaterial = new THREE.MeshPhongMaterial({
      color: floorColor,
      shininess: 100 * floorGlossiness,
      specular: new THREE.Color(0x333333),
    });
    const floorGeo = new THREE.PlaneGeometry(width * 0.99, depth * 0.99);
    const floor = new THREE.Mesh(floorGeo, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -height / 2 + 0.001;
    room.add(floor);

    const ceilingMat = new THREE.MeshPhongMaterial({
      color: new THREE.Color('#D4C4B0'),
      side: THREE.FrontSide,
      shininess: 5,
    });
    const ceiling = new THREE.Mesh(floorGeo.clone(), ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = height / 2 - 0.001;
    room.add(ceiling);

    return room;
  },

  getWallPosition: (
    wall: 'front' | 'back' | 'left' | 'right',
    gridX: number,
    gridY: number,
    roomW: number = 24,
    roomH: number = 6,
    roomD: number = 24,
    spacing: number = 30
  ): { position: THREE.Vector3; rotation: THREE.Euler } => {
    const spacingWorld = spacing / 100 + 2;
    const pos = new THREE.Vector3();
    const rot = new THREE.Euler();
    const baseY = gridY * spacingWorld;

    switch (wall) {
      case 'front':
        pos.set(gridX * spacingWorld, baseY, -roomD / 2 + 0.1);
        rot.set(0, 0, 0);
        break;
      case 'back':
        pos.set(-gridX * spacingWorld, baseY, roomD / 2 - 0.1);
        rot.set(0, Math.PI, 0);
        break;
      case 'left':
        pos.set(-roomW / 2 + 0.1, baseY, gridX * spacingWorld);
        rot.set(0, Math.PI / 2, 0);
        break;
      case 'right':
        pos.set(roomW / 2 - 0.1, baseY, -gridX * spacingWorld);
        rot.set(0, -Math.PI / 2, 0);
        break;
    }

    return { position: pos, rotation: rot };
  },

  checkCollision: (
    position: THREE.Vector3,
    radius: number = 0.5,
    roomW: number = 24,
    roomD: number = 24
  ): THREE.Vector3 => {
    const minX = -roomW / 2 + radius;
    const maxX = roomW / 2 - radius;
    const minZ = -roomD / 2 + radius;
    const maxZ = roomD / 2 - radius;

    return new THREE.Vector3(
      Math.min(maxX, Math.max(minX, position.x)),
      position.y,
      Math.min(maxZ, Math.max(minZ, position.z))
    );
  },

  disposeFrame: (frame: FrameData) => {
    frame.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        if (obj.geometry) obj.geometry.dispose();
        const mat = obj.material as THREE.Material | THREE.Material[];
        if (Array.isArray(mat)) {
          mat.forEach((m) => m.dispose());
        } else if (mat) {
          if ('map' in mat && (mat as any).map) (mat as any).map.dispose();
          mat.dispose();
        }
      }
    });
  },
};

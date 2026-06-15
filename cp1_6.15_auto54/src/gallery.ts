import * as THREE from 'three';
import { Artwork, ArtworkData } from './artwork';

interface GalleryConfig {
  width: number;
  height: number;
  depth: number;
}

const DEFAULT_CONFIG: GalleryConfig = {
  width: 14,
  height: 5,
  depth: 10
};

export function createGallery(artworksData: ArtworkData[]): { group: THREE.Group; artworks: Artwork[] } {
  const config = DEFAULT_CONFIG;
  const galleryGroup = new THREE.Group();

  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0xD4A574,
    roughness: 0.85,
    metalness: 0.0
  });

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0xE8E3DE,
    roughness: 0.95,
    metalness: 0.0,
    side: THREE.DoubleSide
  });

  const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: 0xF5F0EB,
    roughness: 0.9,
    metalness: 0.0,
    side: THREE.DoubleSide
  });

  const floorGeometry = new THREE.PlaneGeometry(config.width, config.depth);
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.castShadow = true;
  floor.receiveShadow = true;
  galleryGroup.add(floor);

  const ceilingGeometry = new THREE.PlaneGeometry(config.width, config.depth);
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = config.height;
  galleryGroup.add(ceiling);

  const backWallGeometry = new THREE.PlaneGeometry(config.width, config.height);
  const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
  backWall.position.set(0, config.height / 2, -config.depth / 2);
  backWall.receiveShadow = true;
  galleryGroup.add(backWall);

  const frontWallGeometry = new THREE.PlaneGeometry(config.width, config.height);
  const frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
  frontWall.position.set(0, config.height / 2, config.depth / 2);
  frontWall.receiveShadow = true;
  galleryGroup.add(frontWall);

  const leftWallGeometry = new THREE.PlaneGeometry(config.depth, config.height);
  const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-config.width / 2, config.height / 2, 0);
  leftWall.receiveShadow = true;
  galleryGroup.add(leftWall);

  const rightWallGeometry = new THREE.PlaneGeometry(config.depth, config.height);
  const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(config.width / 2, config.height / 2, 0);
  rightWall.receiveShadow = true;
  galleryGroup.add(rightWall);

  const artworks: Artwork[] = [];
  const artworkPositions = calculateArtworkPositions(config, artworksData.length);

  artworksData.forEach((data, index) => {
    const { position, normal } = artworkPositions[index];
    const artwork = new Artwork(data, position, normal);
    
    const lookAtPoint = position.clone().add(normal);
    artwork.lookAt(lookAtPoint);
    
    galleryGroup.add(artwork);
    artworks.push(artwork);
  });

  return { group: galleryGroup, artworks };
}

function calculateArtworkPositions(
  config: GalleryConfig,
  count: number
): Array<{ position: THREE.Vector3; normal: THREE.Vector3 }> {
  const positions: Array<{ position: THREE.Vector3; normal: THREE.Vector3 }> = [];
  const wallOffset = 0.07;
  const artworkHeight = config.height / 2;

  const walls = [
    {
      normal: new THREE.Vector3(0, 0, 1),
      count: 2,
      getPosition: (i: number, total: number) => {
        const spacing = config.width / (total + 1);
        return new THREE.Vector3(
          -config.width / 2 + spacing * (i + 1),
          artworkHeight,
          -config.depth / 2 + wallOffset
        );
      }
    },
    {
      normal: new THREE.Vector3(0, 0, -1),
      count: 2,
      getPosition: (i: number, total: number) => {
        const spacing = config.width / (total + 1);
        return new THREE.Vector3(
          config.width / 2 - spacing * (i + 1),
          artworkHeight,
          config.depth / 2 - wallOffset
        );
      }
    },
    {
      normal: new THREE.Vector3(1, 0, 0),
      count: 1,
      getPosition: (i: number, total: number) => {
        const spacing = config.depth / (total + 1);
        return new THREE.Vector3(
          -config.width / 2 + wallOffset,
          artworkHeight,
          -config.depth / 2 + spacing * (i + 1)
        );
      }
    },
    {
      normal: new THREE.Vector3(-1, 0, 0),
      count: 1,
      getPosition: (i: number, total: number) => {
        const spacing = config.depth / (total + 1);
        return new THREE.Vector3(
          config.width / 2 - wallOffset,
          artworkHeight,
          config.depth / 2 - spacing * (i + 1)
        );
      }
    }
  ];

  let remaining = count;
  for (const wall of walls) {
    if (remaining <= 0) break;
    const take = Math.min(wall.count, remaining);
    for (let i = 0; i < take; i++) {
      positions.push({
        position: wall.getPosition(i, take),
        normal: wall.normal
      });
    }
    remaining -= take;
  }

  return positions;
}

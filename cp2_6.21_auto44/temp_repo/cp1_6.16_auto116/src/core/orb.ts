import * as THREE from 'three';

export interface StarData {
  position: THREE.Vector3;
  magnitude: number;
  color: THREE.Color;
}

export interface Constellation {
  id: string;
  name: string;
  chineseName: string;
  meaning: string;
  stars: StarData[];
  iconPath: string;
}

export function createArmillaryRings(): THREE.Group {
  const group = new THREE.Group();
  const radius = 2.2;
  const tubeRadius = 0.05;

  const colorStart = new THREE.Color(0xa67b5b);
  const colorEnd = new THREE.Color(0xc19a6b);

  const ringConfigs = [
    { rotation: [0, 0, 0] },
    { rotation: [Math.PI / 2, 0, 0] },
    { rotation: [0, Math.PI / 2, Math.PI / 6] },
  ];

  ringConfigs.forEach((config) => {
    const geometry = new THREE.TorusGeometry(radius, tubeRadius, 16, 128);

    const material = new THREE.MeshStandardMaterial({
      color: colorStart,
      metalness: 0.9,
      roughness: 0.35,
      emissive: colorEnd,
      emissiveIntensity: 0.15,
    });

    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.set(config.rotation[0], config.rotation[1], config.rotation[2]);

    const colors = [];
    const posAttribute = geometry.attributes.position;
    for (let i = 0; i < posAttribute.count; i++) {
      const y = posAttribute.getY(i);
      const t = (y + radius) / (2 * radius);
      const c = colorStart.clone().lerp(colorEnd, t);
      colors.push(c.r, c.g, c.b);
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    material.vertexColors = true;

    const tickGeometry = createTickMarks(radius, tubeRadius);
    const tickMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b6914,
      metalness: 0.7,
      roughness: 0.4,
    });
    const ticks = new THREE.Mesh(tickGeometry, tickMaterial);
    ticks.rotation.set(config.rotation[0], config.rotation[1], config.rotation[2]);
    ring.add(ticks);

    group.add(ring);
  });

  return group;
}

function createTickMarks(ringRadius: number, tubeRadius: number): THREE.BufferGeometry {
  const positions: number[] = [];
  const tickCount = 72;
  const tickLength = 0.04;
  const tickDepth = 0.008;

  for (let i = 0; i < tickCount; i++) {
    const angle = (i / tickCount) * Math.PI * 2;
    const x = Math.cos(angle) * ringRadius;
    const y = Math.sin(angle) * ringRadius;

    const innerX = Math.cos(angle) * (ringRadius - tickLength);
    const innerY = Math.sin(angle) * (ringRadius - tickLength);

    const zOffset = tubeRadius + tickDepth;

    positions.push(x, y, -zOffset);
    positions.push(innerX, innerY, -zOffset);
    positions.push(innerX, innerY, zOffset);

    positions.push(x, y, -zOffset);
    positions.push(innerX, innerY, zOffset);
    positions.push(x, y, zOffset);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function createCelestialSphere(): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(2, 64, 64);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x0a0a1a,
    transparent: true,
    opacity: 0.15,
    side: THREE.BackSide,
    roughness: 0.1,
    metalness: 0.0,
    clearcoat: 0.3,
  });
  const sphere = new THREE.Mesh(geometry, material);
  return sphere;
}

export function generateStars(count: number = 200): StarData[] {
  const stars: StarData[] = [];
  const radius = 1.95;

  const coldColor = new THREE.Color(0xe0f0ff);
  const warmColor = new THREE.Color(0xfff8dc);

  for (let i = 0; i < count; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    const magnitude = 0.5 + Math.random() * 2.5;
    const colorT = Math.random();
    const color = coldColor.clone().lerp(warmColor, colorT);

    stars.push({
      position: new THREE.Vector3(x, y, z),
      magnitude,
      color,
    });
  }

  return stars;
}

export function createStarPoints(stars: StarData[]): THREE.Points {
  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const colors: number[] = [];
  const sizes: number[] = [];

  stars.forEach((star) => {
    positions.push(star.position.x, star.position.y, star.position.z);
    colors.push(star.color.r, star.color.g, star.color.b);
    sizes.push(star.magnitude);
  });

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      brightness: { value: 1.0 },
    },
    vertexShader: `
      attribute float size;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * 3.0 * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float brightness;
      varying vec3 vColor;
      void main() {
        float d = distance(gl_PointCoord, vec2(0.5));
        if (d > 0.5) discard;
        float alpha = 1.0 - smoothstep(0.0, 0.5, d);
        alpha = pow(alpha, 2.0);
        gl_FragColor = vec4(vColor * brightness, alpha);
      }
    `,
    transparent: true,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  return new THREE.Points(geometry, material);
}

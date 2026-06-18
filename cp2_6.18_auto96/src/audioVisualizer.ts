import * as THREE from 'three';

const BAR_COUNT = 8;
const LOW_COLOR = new THREE.Color(0x00ff88);
const HIGH_COLOR = new THREE.Color(0xff0055);

export function createAudioVisualizer(scene: THREE.Scene) {
  let currentBPM = 80;

  const bars: THREE.Mesh[] = [];
  const barMaterials: THREE.MeshBasicMaterial[] = [];

  for (let i = 0; i < BAR_COUNT; i++) {
    const geometry = new THREE.BoxGeometry(0.5, 1, 0.5);
    geometry.translate(0, 0.5, 0);

    const material = new THREE.MeshBasicMaterial({
      color: LOW_COLOR.clone(),
      transparent: true,
      opacity: 0.85,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-3.5 + i * 1.0, -2, 0);
    mesh.scale.y = 0.5;

    scene.add(mesh);
    bars.push(mesh);
    barMaterials.push(material);
  }

  function getFrequencyData(time: number): number[] {
    const beatFreq = currentBPM / 60;
    const bands: number[] = [];
    for (let i = 0; i < BAR_COUNT; i++) {
      const base =
        0.3 + Math.sin(time * beatFreq * Math.PI * 2 * (1 + i * 0.15)) * 0.3;
      const noise = Math.sin(time * (2.5 + i * 1.3) + i * 0.7) * 0.15;
      bands.push(Math.max(0.05, Math.min(1, base + noise + 0.2)));
    }
    return bands;
  }

  const tempColor = new THREE.Color();

  function update(time: number) {
    const data = getFrequencyData(time);
    for (let i = 0; i < BAR_COUNT; i++) {
      const amp = data[i];
      bars[i].scale.y = 0.5 + amp * 3.5;
      tempColor.lerpColors(LOW_COLOR, HIGH_COLOR, amp);
      barMaterials[i].color.copy(tempColor);
    }
  }

  function setBPM(bpm: number) {
    currentBPM = bpm;
  }

  return { update, setBPM };
}

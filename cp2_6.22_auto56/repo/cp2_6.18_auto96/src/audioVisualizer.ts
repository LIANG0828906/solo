import * as THREE from 'three';
import type { GenrePreset } from './particleSystem';

const BAR_COUNT = 8;

export function createAudioVisualizer(scene: THREE.Scene, initialPreset: GenrePreset) {
  let currentBPM = 80;
  let currentPreset = initialPreset;

  const bars: THREE.Mesh[] = [];
  const barMaterials: THREE.MeshBasicMaterial[] = [];

  const barGroup = new THREE.Group();
  scene.add(barGroup);

  const barWidth = 0.45;
  const barSpacing = 0.85;
  const totalWidth = (BAR_COUNT - 1) * barSpacing;
  const startX = -totalWidth / 2;

  for (let i = 0; i < BAR_COUNT; i++) {
    const geometry = new THREE.BoxGeometry(barWidth, 1, barWidth);
    geometry.translate(0, 0.5, 0);

    const material = new THREE.MeshBasicMaterial({
      color: currentPreset.colors[0].clone(),
      transparent: true,
      opacity: 0.9,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(startX + i * barSpacing, 0, 0);
    mesh.scale.y = 0.5;

    barGroup.add(mesh);
    bars.push(mesh);
    barMaterials.push(material);
  }

  function getFrequencyData(time: number): number[] {
    const beatFreq = currentBPM / 60;
    const bands: number[] = [];
    for (let i = 0; i < BAR_COUNT; i++) {
      const bandBase = 0.25 + (i / BAR_COUNT) * 0.15;
      const beat =
        Math.sin(time * beatFreq * Math.PI * 2 * (1 + i * 0.18)) * 0.35;
      const noise = Math.sin(time * (3 + i * 1.4) + i * 0.9) * 0.12;
      bands.push(Math.max(0.05, Math.min(1, bandBase + beat + noise)));
    }
    return bands;
  }

  const tempColor = new THREE.Color();

  function update(time: number) {
    const data = getFrequencyData(time);
    const colorCount = currentPreset.colors.length;
    for (let i = 0; i < BAR_COUNT; i++) {
      const amp = data[i];
      bars[i].scale.y = 0.3 + amp * 3.8;

      const colorIndex = Math.min(
        colorCount - 1,
        Math.floor(amp * colorCount),
      );
      const nextIndex = Math.min(colorCount - 1, colorIndex + 1);
      const colorT = (amp * colorCount) % 1;
      tempColor.lerpColors(
        currentPreset.colors[colorIndex],
        currentPreset.colors[nextIndex],
        colorT,
      );
      barMaterials[i].color.copy(tempColor);
    }
  }

  function setBPM(bpm: number) {
    currentBPM = bpm;
  }

  function setGenre(preset: GenrePreset) {
    currentPreset = preset;
  }

  return { update, setBPM, setGenre, barGroup };
}

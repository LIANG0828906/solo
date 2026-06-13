import { Visualizer } from './visualizer';
import { AudioEngine } from './audioEngine';
import { Controls } from './controls';

const canvas = document.getElementById('visualizer') as HTMLCanvasElement;
const visualizer = new Visualizer(canvas, {
  width: 800,
  height: 450,
  particleDensity: 200,
  spectrumSensitivity: 1.5,
  blendMode: 'normal',
  theme: 'japanese'
});
visualizer.start();

const audioEngine = new AudioEngine({
  workerPath: new URL('./worker.ts', import.meta.url).href
});

const controls = new Controls(visualizer, audioEngine, {
  particleDensitySliderId: 'density',
  spectrumSensitivitySliderId: 'sensitivity',
  blendModeSelectId: 'blendMode',
  themeButtonIds: {
    japanese: 'presetJapanese',
    cyberpunk: 'presetCyberpunk',
    darkTech: 'presetDarkTech'
  },
  playPauseButtonId: 'playPauseBtn',
  progressBarId: 'progressBar',
  progressFillId: 'progressFill',
  timeDisplayId: 'timeDisplay',
  screenshotButtonId: 'screenshotBtn',
  fileInputId: 'fileInput',
  easingDuration: 300
});

const uploadArea = document.getElementById('uploadArea');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const fileInput = document.getElementById('fileInput') as HTMLInputElement;

if (uploadArea && fileInput) {
  uploadArea.addEventListener('click', () => fileInput.click());

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = (e as DragEvent).dataTransfer?.files;
    if (files && files.length > 0) {
      fileInput.files = files;
      fileInput.dispatchEvent(new Event('change'));
    }
  });
}

fileInput.addEventListener('change', (e) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file && fileNameDisplay) {
    fileNameDisplay.textContent = `当前文件: ${file.name}`;
  }
});

const densityValue = document.getElementById('densityValue');
const sensitivityValue = document.getElementById('sensitivityValue');
const densitySlider = document.getElementById('density') as HTMLInputElement;
const sensitivitySlider = document.getElementById('sensitivity') as HTMLInputElement;

if (densitySlider && densityValue) {
  densitySlider.addEventListener('input', () => {
    densityValue.textContent = densitySlider.value;
  });
}
if (sensitivitySlider && sensitivityValue) {
  sensitivitySlider.addEventListener('input', () => {
    sensitivityValue.textContent = sensitivitySlider.value;
  });
}

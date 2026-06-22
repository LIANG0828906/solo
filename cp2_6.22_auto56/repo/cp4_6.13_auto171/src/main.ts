import { GameEngine } from './GameEngine';
import { SettingsManager } from './SettingsManager';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const settingsBtn = document.getElementById('settings-btn') as HTMLButtonElement;
const settingsModal = document.getElementById('settings-modal') as HTMLDivElement;
const closeSettingsBtn = document.getElementById('close-settings') as HTMLButtonElement;
const musicVolumeSlider = document.getElementById('music-volume') as HTMLInputElement;
const musicVolumeValue = document.getElementById('music-volume-value') as HTMLSpanElement;
const sfxVolumeSlider = document.getElementById('sfx-volume') as HTMLInputElement;
const sfxVolumeValue = document.getElementById('sfx-volume-value') as HTMLSpanElement;
const beatIndicatorToggle = document.getElementById('beat-indicator-toggle') as HTMLDivElement;

const settingsManager = new SettingsManager();

function updateSettingsUI() {
  const settings = settingsManager.getSettings();
  musicVolumeSlider.value = String(settings.musicVolume);
  musicVolumeValue.textContent = `${settings.musicVolume}%`;
  sfxVolumeSlider.value = String(settings.sfxVolume);
  sfxVolumeValue.textContent = `${settings.sfxVolume}%`;
  if (settings.beatIndicator) {
    beatIndicatorToggle.classList.add('active');
  } else {
    beatIndicatorToggle.classList.remove('active');
  }
}

updateSettingsUI();

musicVolumeSlider.addEventListener('input', () => {
  const value = parseInt(musicVolumeSlider.value, 10);
  settingsManager.setMusicVolume(value);
  musicVolumeValue.textContent = `${value}%`;
});

sfxVolumeSlider.addEventListener('input', () => {
  const value = parseInt(sfxVolumeSlider.value, 10);
  settingsManager.setSfxVolume(value);
  sfxVolumeValue.textContent = `${value}%`;
});

beatIndicatorToggle.addEventListener('click', () => {
  const current = settingsManager.getSettings().beatIndicator;
  settingsManager.setBeatIndicator(!current);
  updateSettingsUI();
});

settingsBtn.addEventListener('click', () => {
  settingsModal.classList.add('active');
});

closeSettingsBtn.addEventListener('click', () => {
  settingsModal.classList.remove('active');
});

settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) {
    settingsModal.classList.remove('active');
  }
});

function resizeCanvas() {
  const container = document.getElementById('game-container') as HTMLDivElement;
  const minWidth = 1024;
  const minHeight = 600;
  
  let width = window.innerWidth;
  let height = window.innerHeight;
  
  if (width < minWidth) width = minWidth;
  if (height < minHeight) height = minHeight;
  
  canvas.width = width;
  canvas.height = height;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const game = new GameEngine(canvas, settingsManager);
game.start();

class UIControls {
  constructor(scene, waveform) {
    this.scene = scene;
    this.waveform = waveform;
    this.frequencySlider = document.getElementById('frequency-slider');
    this.frequencyValue = document.getElementById('frequency-value');
    this.resetBtn = document.getElementById('reset-btn');
    
    this.init();
  }

  init() {
    this.frequencySlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      this.setFrequency(value);
    });

    this.resetBtn.addEventListener('click', () => {
      this.reset();
    });

    this.setFrequency(parseInt(this.frequencySlider.value));
  }

  setFrequency(frequency) {
    this.scene.setFrequency(frequency);
    this.frequencyValue.textContent = `${frequency} Hz`;
    
    const wavelength = this.scene.getWavelength();
    this.frequencyValue.textContent = `${frequency} Hz (λ: ${wavelength.toFixed(2)})`;
  }

  reset() {
    this.scene.reset();
    this.waveform.reset();
    
    this.frequencySlider.value = 50;
    this.setFrequency(50);
  }

  getFrequency() {
    return parseInt(this.frequencySlider.value);
  }
}

export default UIControls;

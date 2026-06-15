import { ShadowSimulator, SHICHEN_DATA, SOLAR_TERMS } from './ShadowSimulator';

type EventCallback = (data: unknown) => void;

class EventBus {
  private events: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  emit(event: string, data: unknown): void {
    if (this.events.has(event)) {
      this.events.get(event)!.forEach(callback => callback(data));
    }
  }
}

export const eventBus = new EventBus();

export function setupUI(simulator: ShadowSimulator): void {
  const dateSlider = document.getElementById('date-slider') as HTMLInputElement;
  const timeSlider = document.getElementById('time-slider') as HTMLInputElement;
  const dateValue = document.getElementById('date-value') as HTMLSpanElement;
  const timeValue = document.getElementById('time-value') as HTMLSpanElement;
  const shichenLabelsContainer = document.getElementById('shichen-labels') as HTMLDivElement;

  const infoShichen = document.getElementById('info-shichen') as HTMLSpanElement;
  const infoModern = document.getElementById('info-modern') as HTMLSpanElement;
  const infoAncient = document.getElementById('info-ancient') as HTMLSpanElement;
  const infoSolar = document.getElementById('info-solar') as HTMLSpanElement;
  const infoDeclination = document.getElementById('info-declination') as HTMLSpanElement;

  SHICHEN_DATA.forEach((shichen, index) => {
    const label = document.createElement('div');
    label.className = 'shichen-label';
    label.textContent = shichen.name;
    label.dataset.index = String(index);
    label.addEventListener('click', () => {
      const targetTime = index * 8 + 4;
      timeSlider.value = String(targetTime);
      simulator.setTime(targetTime);
      updateTimeDisplay();
      eventBus.emit('time-changed', targetTime);
      eventBus.emit('shichen-selected', index);
    });
    shichenLabelsContainer.appendChild(label);
  });

  function updateDateDisplay(): void {
    const day = parseInt(dateSlider.value);
    simulator.setDate(day);
    
    const solarTerm = simulator.getCurrentSolarTerm();
    dateValue.textContent = solarTerm.name;
    
    updateInfoPanel();
  }

  function updateTimeDisplay(): void {
    const time = parseInt(timeSlider.value);
    simulator.setTime(time);
    
    const shichen = simulator.getCurrentShichen();
    const ke = simulator.getCurrentKe();
    timeValue.textContent = `${shichen.name} ${ke}`;
    
    updateShichenLabels();
    updateInfoPanel();
  }

  function updateShichenLabels(): void {
    const currentIndex = Math.floor(simulator.getTime() / 8) % 12;
    const labels = shichenLabelsContainer.querySelectorAll('.shichen-label');
    labels.forEach((label, index) => {
      if (index === currentIndex) {
        label.classList.add('active');
      } else {
        label.classList.remove('active');
      }
    });
  }

  function updateInfoPanel(): void {
    const shichen = simulator.getCurrentShichen();
    const solarTerm = simulator.getCurrentSolarTerm();
    const declination = simulator.getSolarDeclination();

    infoShichen.textContent = shichen.name;
    infoModern.textContent = shichen.modern;
    infoAncient.textContent = shichen.ancient;
    infoSolar.textContent = solarTerm.name;
    infoDeclination.textContent = `${declination.toFixed(2)}°`;
  }

  let dateUpdateTimeout: number | null = null;
  dateSlider.addEventListener('input', () => {
    if (dateUpdateTimeout) {
      clearTimeout(dateUpdateTimeout);
    }
    dateUpdateTimeout = window.setTimeout(() => {
      updateDateDisplay();
      eventBus.emit('date-changed', parseInt(dateSlider.value));
    }, 16);
  });

  let timeUpdateTimeout: number | null = null;
  timeSlider.addEventListener('input', () => {
    if (timeUpdateTimeout) {
      clearTimeout(timeUpdateTimeout);
    }
    timeUpdateTimeout = window.setTimeout(() => {
      updateTimeDisplay();
      eventBus.emit('time-changed', parseInt(timeSlider.value));
    }, 16);
  });

  eventBus.on('solar-term-selected', (data) => {
    const day = data as number;
    dateSlider.value = String(day);
    updateDateDisplay();
  });

  eventBus.on('shichen-aligned-ui', (data) => {
    const { index } = data as { index: number };
    const labels = shichenLabelsContainer.querySelectorAll('.shichen-label');
    labels.forEach((label, i) => {
      if (i === index) {
        const htmlLabel = label as HTMLElement;
        htmlLabel.style.transform = 'scale(1.2)';
        htmlLabel.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.8)';
        setTimeout(() => {
          htmlLabel.style.transform = '';
          htmlLabel.style.boxShadow = '';
        }, 300);
      }
    });
  });

  updateDateDisplay();
  updateTimeDisplay();
}

export function setDateSliderValue(day: number): void {
  const dateSlider = document.getElementById('date-slider') as HTMLInputElement;
  dateSlider.value = String(day);
  
  const dateValue = document.getElementById('date-value') as HTMLSpanElement;
  const solarTerm = SOLAR_TERMS.find(t => t.day === day) || SOLAR_TERMS[0];
  dateValue.textContent = solarTerm.name;
  
  const infoSolar = document.getElementById('info-solar') as HTMLSpanElement;
  infoSolar.textContent = solarTerm.name;
  
  const infoDeclination = document.getElementById('info-declination') as HTMLSpanElement;
  const simulator = new ShadowSimulator();
  simulator.setDate(day);
  infoDeclination.textContent = `${simulator.getSolarDeclination().toFixed(2)}°`;
}

export function setTimeSliderValue(timeIndex: number): void {
  const timeSlider = document.getElementById('time-slider') as HTMLInputElement;
  timeSlider.value = String(timeIndex);
  
  const shichenIndex = Math.floor(timeIndex / 8) % 12;
  const keIndex = Math.floor(timeIndex % 8 / 2);
  const keNames = ['初刻', '一刻', '二刻', '三刻'];
  
  const timeValue = document.getElementById('time-value') as HTMLSpanElement;
  timeValue.textContent = `${SHICHEN_DATA[shichenIndex].name} ${keNames[keIndex]}`;
  
  const infoShichen = document.getElementById('info-shichen') as HTMLSpanElement;
  const infoModern = document.getElementById('info-modern') as HTMLSpanElement;
  const infoAncient = document.getElementById('info-ancient') as HTMLSpanElement;
  
  infoShichen.textContent = SHICHEN_DATA[shichenIndex].name;
  infoModern.textContent = SHICHEN_DATA[shichenIndex].modern;
  infoAncient.textContent = SHICHEN_DATA[shichenIndex].ancient;
  
  const labels = document.querySelectorAll('.shichen-label');
  labels.forEach((label, index) => {
    if (index === shichenIndex) {
      label.classList.add('active');
    } else {
      label.classList.remove('active');
    }
  });
}

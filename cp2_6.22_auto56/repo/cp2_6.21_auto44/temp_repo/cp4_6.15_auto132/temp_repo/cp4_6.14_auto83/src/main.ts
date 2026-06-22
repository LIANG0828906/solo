import { VisualCore } from './visualCore';
import { dataManager, MetricType, CityInfo } from './dataManager';

class App {
  private visualCore!: VisualCore;
  private cities: CityInfo[] = [];
  private activeCities: Set<number> = new Set();
  private activeMetric: MetricType = 'temperature';

  constructor() {
    this.init();
  }

  private init(): void {
    try {
      this.visualCore = new VisualCore({
        containerId: 'canvas-container',
      });
    } catch (e) {
      console.error('Failed to initialize VisualCore:', e);
      return;
    }

    this.cities = dataManager.getCities();
    this.cities.forEach((c) => this.activeCities.add(c.index));

    this.setupMetricButtons();
    this.setupCityList();
    this.setupDateSlider();

    this.visualCore.start();
  }

  private setupMetricButtons(): void {
    const buttons = document.querySelectorAll('.metric-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const metric = (btn as HTMLElement).dataset.metric as MetricType;
        if (!metric) return;

        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        this.activeMetric = metric;
        this.visualCore.setMetric(metric);
      });
    });
  }

  private setupCityList(): void {
    const cityList = document.getElementById('city-list');
    if (!cityList) return;

    this.cities.forEach((city) => {
      const item = document.createElement('div');
      item.className = 'city-item';

      const checkbox = document.createElement('div');
      checkbox.className = 'city-checkbox checked';
      checkbox.style.backgroundColor = city.color;

      const name = document.createElement('span');
      name.className = 'city-name';
      name.textContent = city.name;

      item.appendChild(checkbox);
      item.appendChild(name);

      item.addEventListener('click', () => {
        if (this.activeCities.has(city.index)) {
          this.activeCities.delete(city.index);
          checkbox.classList.remove('checked');
          checkbox.style.backgroundColor = 'transparent';
          checkbox.style.border = `2px solid ${city.color}`;
        } else {
          this.activeCities.add(city.index);
          checkbox.classList.add('checked');
          checkbox.style.backgroundColor = city.color;
          checkbox.style.border = 'none';
        }
        this.visualCore.setActiveCities(Array.from(this.activeCities));
      });

      cityList.appendChild(item);
    });
  }

  private setupDateSlider(): void {
    const slider = document.getElementById('date-slider') as HTMLInputElement | null;
    if (!slider) return;

    slider.addEventListener('input', () => {
      const dayIndex = parseInt(slider.value, 10);
      this.visualCore.setSliceDay(dayIndex, true);
    });
  }
}

new App();

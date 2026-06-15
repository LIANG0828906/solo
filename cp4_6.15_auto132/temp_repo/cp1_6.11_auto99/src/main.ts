import { MapRenderer } from './mapRenderer';
import { planRoute, parseCities, getGuide, cityCoordinates } from './routePlanner';

interface CityDayData {
  [city: string]: number;
}

let mapRenderer: MapRenderer;
let cityDays: CityDayData = {};
let currentRouteCities: string[] = [];

function init(): void {
  const canvas = document.getElementById('mapCanvas') as HTMLCanvasElement;
  const tooltip = document.getElementById('tooltip') as HTMLDivElement;

  if (!canvas || !tooltip) {
    console.error('Canvas or tooltip element not found');
    return;
  }

  mapRenderer = new MapRenderer(canvas, tooltip);
  mapRenderer.setOnCityClick(handleCityClick);
  mapRenderer.start();

  const planBtn = document.getElementById('planBtn') as HTMLButtonElement;
  const cityInput = document.getElementById('cityInput') as HTMLInputElement;

  if (planBtn && cityInput) {
    planBtn.addEventListener('click', () => handlePlanRoute(cityInput.value));
    cityInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handlePlanRoute(cityInput.value);
      }
    });
  }

  const modal = document.getElementById('modal') as HTMLDivElement;
  const modalClose = document.getElementById('modalClose') as HTMLButtonElement;

  if (modal && modalClose) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
    modalClose.addEventListener('click', closeModal);
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  mapRenderer.updateData(Object.keys(cityCoordinates), [], []);
}

function resizeCanvas(): void {
  const canvas = document.getElementById('mapCanvas') as HTMLCanvasElement;
  const mapSection = document.querySelector('.map-section');
  if (!canvas || !mapSection) return;

  const rect = (mapSection as HTMLElement).getBoundingClientRect();
  const width = Math.max(900, rect.width - 40);
  const height = Math.max(600, rect.height - 40);

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  if (mapRenderer) {
    mapRenderer.resize(width, height);
  }
}

function handlePlanRoute(input: string): void {
  const cities = parseCities(input);

  if (cities.length === 0) {
    alert('请输入有效的城市名称');
    return;
  }

  const validCities: string[] = [];
  const invalidCities: string[] = [];

  for (const city of cities) {
    if (cityCoordinates[city]) {
      validCities.push(city);
    } else {
      invalidCities.push(city);
    }
  }

  if (validCities.length === 0) {
    alert(`暂不支持这些城市：${invalidCities.join('、')}\n支持的城市：北京、上海、成都、西安、广州`);
    return;
  }

  if (invalidCities.length > 0) {
    console.warn(`暂不支持的城市已忽略：${invalidCities.join('、')}`);
  }

  const startTime = performance.now();
  const result = planRoute(validCities);
  const endTime = performance.now();
  console.log(`路线规划耗时：${(endTime - startTime).toFixed(2)}ms`);

  currentRouteCities = result.orderedCities;
  cityDays = {};
  for (const city of result.orderedCities) {
    cityDays[city] = 1;
  }

  renderRouteSummary(result.orderedCities);

  if (mapRenderer) {
    mapRenderer.updateData(validCities, result.orderedCities, result.distances);
  }
}

function renderRouteSummary(cities: string[]): void {
  const summaryEl = document.getElementById('routeSummary') as HTMLDivElement;
  if (!summaryEl) return;

  summaryEl.innerHTML = '';

  if (cities.length === 0) {
    summaryEl.innerHTML = '<p class="empty-tip">请输入城市并点击"规划路线"按钮</p>';
    return;
  }

  for (let i = 0; i < cities.length; i++) {
    const city = cities[i];
    const card = document.createElement('div');
    card.className = 'route-card';

    const nameEl = document.createElement('span');
    nameEl.className = 'city-name';
    nameEl.textContent = `${i + 1}. ${city}`;

    const daysControl = document.createElement('div');
    daysControl.className = 'days-control';

    const minusBtn = document.createElement('button');
    minusBtn.className = 'days-btn';
    minusBtn.textContent = '-';
    minusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      adjustDays(city, -1);
    });

    const daysSpan = document.createElement('span');
    daysSpan.className = 'days-count';
    daysSpan.id = `days-${city}`;
    daysSpan.textContent = `${cityDays[city] || 1}天`;

    const plusBtn = document.createElement('button');
    plusBtn.className = 'days-btn';
    plusBtn.textContent = '+';
    plusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      adjustDays(city, 1);
    });

    daysControl.appendChild(minusBtn);
    daysControl.appendChild(daysSpan);
    daysControl.appendChild(plusBtn);

    card.appendChild(nameEl);
    card.appendChild(daysControl);

    card.style.cursor = 'pointer';
    card.addEventListener('click', () => handleCityClick(city));

    summaryEl.appendChild(card);
  }
}

function adjustDays(city: string, delta: number): void {
  if (!cityDays[city]) cityDays[city] = 1;
  const newValue = cityDays[city] + delta;
  if (newValue < 1) return;
  if (newValue > 30) return;

  cityDays[city] = newValue;

  const daysSpan = document.getElementById(`days-${city}`);
  if (daysSpan) {
    daysSpan.textContent = `${newValue}天`;
  }
}

function handleCityClick(city: string): void {
  const guide = getGuide(city);
  if (!guide) return;

  const modalTitle = document.getElementById('modalTitle') as HTMLHeadingElement;
  const modalAttractions = document.getElementById('modalAttractions') as HTMLParagraphElement;
  const modalFood = document.getElementById('modalFood') as HTMLUListElement;
  const modalSeason = document.getElementById('modalSeason') as HTMLParagraphElement;

  if (modalTitle) modalTitle.textContent = guide.name;
  if (modalAttractions) modalAttractions.textContent = guide.attractions;

  if (modalFood) {
    modalFood.innerHTML = '';
    for (const food of guide.food) {
      const li = document.createElement('li');
      li.textContent = food;
      modalFood.appendChild(li);
    }
  }

  if (modalSeason) modalSeason.textContent = guide.season;

  const modal = document.getElementById('modal') as HTMLDivElement;
  if (modal) {
    requestAnimationFrame(() => {
      modal.classList.add('visible');
    });
  }
}

function closeModal(): void {
  const modal = document.getElementById('modal') as HTMLDivElement;
  if (modal) {
    modal.classList.remove('visible');
  }
}

document.addEventListener('DOMContentLoaded', init);

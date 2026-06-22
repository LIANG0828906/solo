import './styles/main.css';
import { SceneManager } from './core/sceneManager';
import { EarthParticles } from './core/earthParticles';
import { ScenarioPanel } from './control/scenarioPanel';
import { TimeSlider } from './control/timeSlider';
import { TrendChart } from './visualization/chart';
import { CountryEmission, getCountryData, getCountryRank } from './data/carbonData';

class App {
  private sceneManager: SceneManager;
  private earthParticles: EarthParticles;
  private scenarioPanel: ScenarioPanel;
  private timeSlider: TimeSlider;
  private chart: TrendChart;
  private tooltip: HTMLElement;
  private tooltipCountry: HTMLElement;
  private tooltipEmission: HTMLElement;
  private tooltipPopulation: HTMLElement;
  private tooltipRank: HTMLElement;

  constructor() {
    this.sceneManager = new SceneManager('earth-canvas');
    this.earthParticles = new EarthParticles(
      this.sceneManager.scene,
      this.sceneManager.camera,
      this.sceneManager.canvas
    );
    this.scenarioPanel = new ScenarioPanel();
    this.timeSlider = new TimeSlider('time-slider', 'current-year');
    this.chart = new TrendChart('chart-container');
    
    const tooltip = document.getElementById('country-tooltip');
    const tooltipCountry = document.getElementById('tooltip-country');
    const tooltipEmission = document.getElementById('tooltip-emission');
    const tooltipPopulation = document.getElementById('tooltip-population');
    const tooltipRank = document.getElementById('tooltip-rank');

    if (!tooltip || !tooltipCountry || !tooltipEmission || !tooltipPopulation || !tooltipRank) {
      throw new Error('Tooltip elements not found');
    }

    this.tooltip = tooltip;
    this.tooltipCountry = tooltipCountry;
    this.tooltipEmission = tooltipEmission;
    this.tooltipPopulation = tooltipPopulation;
    this.tooltipRank = tooltipRank;

    this.init();
  }

  private init(): void {
    this.bindEvents();
    this.startAnimation();
  }

  private bindEvents(): void {
    this.timeSlider.onChange((year: number) => {
      this.earthParticles.updateParticlesByYear(year);
      this.chart.updateYear(year);
    });

    this.scenarioPanel.onChange((result) => {
      this.earthParticles.triggerScenarioGlow(result);
    });

    this.earthParticles.onCountryHover((country: CountryEmission | null) => {
      if (country) {
        this.showTooltip(country);
      } else {
        this.hideTooltip();
      }
    });

    this.sceneManager.canvas.addEventListener('mousemove', (e) => {
      if (this.tooltip.classList.contains('visible')) {
        this.updateTooltipPosition(e.clientX, e.clientY);
      }
    });
  }

  private showTooltip(country: CountryEmission): void {
    const year = this.timeSlider.getYear();
    const data = getCountryData(country.countryCode, year);
    const rank = getCountryRank(country.countryCode, year);

    if (!data) return;

    this.tooltipCountry.textContent = country.countryName;
    this.tooltipEmission.textContent = `${data.emission.toFixed(2)} 吨`;
    this.tooltipPopulation.textContent = this.formatPopulation(country.population);
    this.tooltipRank.textContent = `第 ${rank} 名`;

    this.tooltip.classList.add('visible');
  }

  private hideTooltip(): void {
    this.tooltip.classList.remove('visible');
  }

  private updateTooltipPosition(x: number, y: number): void {
    const offsetX = 15;
    const offsetY = 15;
    
    const tooltipRect = this.tooltip.getBoundingClientRect();
    let posX = x + offsetX;
    let posY = y + offsetY;

    if (posX + tooltipRect.width > window.innerWidth) {
      posX = x - tooltipRect.width - offsetX;
    }
    if (posY + tooltipRect.height > window.innerHeight) {
      posY = y - tooltipRect.height - offsetY;
    }

    this.tooltip.style.left = `${posX}px`;
    this.tooltip.style.top = `${posY}px`;
  }

  private formatPopulation(pop: number): string {
    if (pop >= 100000000) {
      return `${(pop / 100000000).toFixed(1)} 亿`;
    } else if (pop >= 10000) {
      return `${(pop / 10000).toFixed(1)} 万`;
    }
    return String(pop);
  }

  private startAnimation(): void {
    this.sceneManager.startAnimationLoop((time: number) => {
      this.earthParticles.update(time);
    });
  }

  public dispose(): void {
    this.earthParticles.dispose();
    this.chart.dispose();
    this.sceneManager.dispose();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  
  window.addEventListener('beforeunload', () => {
    app.dispose();
  });
});

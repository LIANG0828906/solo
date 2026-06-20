import { MoleculeStore } from './data/MoleculeStore';
import { MoleculeRenderer } from './renderer/MoleculeRenderer';
import { MeasurementTool } from './renderer/Measurement';
import { Panel } from './ui/Panel';
import './style.css';

class App {
  private moleculeStore: MoleculeStore;
  private renderer: MoleculeRenderer;
  private measurement: MeasurementTool;
  private panel: Panel;

  private measureMode: boolean;
  private clipMode: boolean;

  constructor() {
    this.moleculeStore = new MoleculeStore();
    this.measureMode = false;
    this.clipMode = false;

    const canvas = document.getElementById('canvas-container');
    if (!canvas) {
      throw new Error('Canvas container not found');
    }

    this.renderer = new MoleculeRenderer(canvas, {
      onSelect: (info) => this.handleSelect(info),
      onAtomClick: (atomId) => this.handleAtomClick(atomId)
    });

    this.measurement = new MeasurementTool(this.renderer);

    this.panel = new Panel(this.moleculeStore, {
      onAtomSelect: (atomId) => this.handlePanelAtomSelect(atomId),
      onBondSelect: (bondId) => this.handlePanelBondSelect(bondId)
    });

    this.setupToolbar();

    this.hideLoading();

    const select = this.panel.getSelectElement();
    const molecules = this.moleculeStore.getAllMolecules();
    if (molecules.length > 0) {
      select.value = molecules[0].id;
      this.loadMolecule(molecules[0].id);
    }

    this.animate();
  }

  private setupToolbar(): void {
    const btnMeasure = document.getElementById('btn-measure');
    const btnClip = document.getElementById('btn-clip');
    const btnReset = document.getElementById('btn-reset');

    if (btnMeasure) {
      btnMeasure.addEventListener('click', () => {
        this.measureMode = !this.measureMode;
        btnMeasure.classList.toggle('active', this.measureMode);
        this.measurement.setActive(this.measureMode);
        if (!this.measureMode) {
          this.measurement.clearMeasurement();
        }
      });
    }

    if (btnClip) {
      btnClip.addEventListener('click', () => {
        this.clipMode = !this.clipMode;
        btnClip.classList.toggle('active', this.clipMode);
        this.renderer.setClippingEnabled(this.clipMode);
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.renderer.resetView();
        this.measurement.clearMeasurement();
      });
    }

    const select = this.panel.getSelectElement();
    select.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      if (target.value) {
        this.loadMolecule(target.value);
      }
    });
  }

  private loadMolecule(id: string): void {
    const molecule = this.moleculeStore.getMolecule(id);
    if (!molecule) return;

    this.renderer.loadMolecule(molecule);
    this.panel.setMolecule(molecule);
    this.measurement.clearMeasurement();
  }

  private handleSelect(info: { type: string; id: string } | null): void {
    if (!info) {
      this.panel.clearSelection();
      return;
    }

    if (info.type === 'atom') {
      this.panel.selectAtom(info.id);
    } else if (info.type === 'bond') {
      this.panel.selectBond(info.id);
    }
  }

  private handleAtomClick(atomId: string): void {
    if (this.measureMode) {
      this.measurement.handleAtomClick(atomId);
    }
  }

  private handlePanelAtomSelect(atomId: string): void {
    this.renderer.selectAtom(atomId);
  }

  private handlePanelBondSelect(_bondId: string): void {
    this.renderer.clearSelection();
  }

  private hideLoading(): void {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.add('hidden');
      setTimeout(() => {
        loading.style.display = 'none';
      }, 500);
    }
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());

    if (this.measureMode && this.measurement.getFirstAtomId() && this.measurement.getSecondAtomId()) {
      this.measurement.update();
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});

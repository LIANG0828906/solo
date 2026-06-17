import { MoleculeParser, MoleculeData, AtomData } from './MoleculeParser';
import { MoleculeRenderer } from './MoleculeRenderer';
import { gsap } from 'gsap';

export type MoleculeChangeCallback = (data: MoleculeData) => void;
export type AtomModifyCallback = (atomIndex: number, newType: string) => void;

export class UIManager {
  private moleculeRenderer: MoleculeRenderer;
  private currentMolecule: MoleculeData | null = null;
  private selectedAtomIndex: number | null = null;
  private onMoleculeChange: MoleculeChangeCallback;
  private onAtomModify: AtomModifyCallback;

  constructor(
    renderer: MoleculeRenderer,
    onMoleculeChange: MoleculeChangeCallback,
    onAtomModify: AtomModifyCallback
  ) {
    this.moleculeRenderer = renderer;
    this.onMoleculeChange = onMoleculeChange;
    this.onAtomModify = onAtomModify;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const moleculeSelect = document.getElementById('molecule-select') as HTMLSelectElement;
    if (moleculeSelect) {
      moleculeSelect.addEventListener('change', (e) => {
        const value = (e.target as HTMLSelectElement).value;
        this.loadMolecule(value);
      });
    }

    const modifyBtn = document.getElementById('modify-atom-btn') as HTMLButtonElement;
    if (modifyBtn) {
      modifyBtn.addEventListener('click', () => {
        this.applyAtomModification();
      });
    }

    const helpBtn = document.getElementById('help-btn') as HTMLButtonElement;
    if (helpBtn) {
      helpBtn.addEventListener('click', () => {
        this.showHelpModal();
      });
    }

    const closeModalBtn = document.getElementById('close-modal-btn') as HTMLButtonElement;
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => {
        this.hideHelpModal();
      });
    }

    const modal = document.getElementById('help-modal') as HTMLDivElement;
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideHelpModal();
        }
      });
    }
  }

  loadMolecule(formula: string): void {
    const data = MoleculeParser.parse(formula);
    
    if (!data || !data.atoms || data.atoms.length === 0) {
      console.error('Failed to parse molecule:', formula);
      return;
    }
    
    const hasExistingMolecule = this.currentMolecule !== null;
    
    if (!hasExistingMolecule) {
      this.moleculeRenderer.renderMolecule(data);
      this.currentMolecule = data;
      this.selectedAtomIndex = null;
      this.updateAtomInfoDisplay(null);
      this.updateMoleculeProperties();
      this.onMoleculeChange(data);
      return;
    }
    
    const fadeOutObj = { opacity: 1 };
    gsap.to(fadeOutObj, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onUpdate: () => {
        this.moleculeRenderer.setOpacity(fadeOutObj.opacity);
      },
      onComplete: () => {
        this.moleculeRenderer.renderMolecule(data);
        this.currentMolecule = data;
        this.selectedAtomIndex = null;
        this.updateAtomInfoDisplay(null);
        this.updateMoleculeProperties();
        
        this.moleculeRenderer.setOpacity(0);
        
        const fadeInObj = { opacity: 0 };
        gsap.to(fadeInObj, {
          opacity: 1,
          duration: 0.5,
          ease: 'power2.out',
          onUpdate: () => {
            this.moleculeRenderer.setOpacity(fadeInObj.opacity);
          }
        });
        
        this.onMoleculeChange(data);
      }
    });
  }

  selectAtom(atomIndex: number | null): void {
    this.selectedAtomIndex = atomIndex;
    this.moleculeRenderer.selectAtom(atomIndex);
    this.updateAtomInfoDisplay(atomIndex);
    
    const section = document.getElementById('atom-info-section');
    if (section) {
      section.style.animation = 'none';
      section.offsetHeight;
      section.style.animation = 'slideIn 0.2s ease-out';
    }
  }

  private updateAtomInfoDisplay(atomIndex: number | null): void {
    const emptyEl = document.querySelector('.atom-info-empty') as HTMLDivElement;
    const contentEl = document.querySelector('.atom-info-content') as HTMLDivElement;
    
    if (atomIndex === null || !this.currentMolecule) {
      if (emptyEl) emptyEl.style.display = 'block';
      if (contentEl) contentEl.style.display = 'none';
      return;
    }
    
    if (emptyEl) emptyEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'block';
    
    const atom = this.currentMolecule.atoms[atomIndex];
    
    const typeEl = document.getElementById('atom-type') as HTMLSpanElement;
    if (typeEl) typeEl.textContent = atom.type;
    
    const coordsEl = document.getElementById('atom-coords') as HTMLSpanElement;
    if (coordsEl) {
      coordsEl.textContent = `(${atom.x.toFixed(2)}, ${atom.y.toFixed(2)}, ${atom.z.toFixed(2)})`;
    }
    
    const typeSelect = document.getElementById('atom-type-select') as HTMLSelectElement;
    if (typeSelect) {
      typeSelect.value = atom.type;
    }
    
    this.updateAtomAngles(atomIndex);
    this.updateAtomBondLengths(atomIndex);
  }

  private updateAtomAngles(atomIndex: number): void {
    const anglesEl = document.getElementById('atom-angles') as HTMLSpanElement;
    if (!anglesEl || !this.currentMolecule) return;
    
    const adjacent = MoleculeParser.getAdjacentAtoms(this.currentMolecule, atomIndex);
    const angles: string[] = [];
    
    if (adjacent.length >= 2) {
      for (let i = 0; i < adjacent.length; i++) {
        for (let j = i + 1; j < adjacent.length; j++) {
          const angle = MoleculeParser.calculateBondAngle(
            this.currentMolecule,
            atomIndex,
            adjacent[i],
            adjacent[j]
          );
          angles.push(`${angle.degrees.toFixed(1)}°`);
        }
      }
    }
    
    if (angles.length === 0) {
      anglesEl.textContent = '无';
    } else {
      anglesEl.textContent = angles.join(', ');
    }
  }

  private updateAtomBondLengths(atomIndex: number): void {
    const lengthsEl = document.getElementById('atom-bond-lengths') as HTMLSpanElement;
    if (!lengthsEl || !this.currentMolecule) return;
    
    const adjacent = MoleculeParser.getAdjacentAtoms(this.currentMolecule, atomIndex);
    const lengths: string[] = [];
    
    for (const adjIndex of adjacent) {
      const length = MoleculeParser.calculateBondLength(this.currentMolecule, atomIndex, adjIndex);
      const adjAtom = this.currentMolecule.atoms[adjIndex];
      lengths.push(`${adjAtom.type}: ${length.toFixed(3)}Å`);
    }
    
    if (lengths.length === 0) {
      lengthsEl.textContent = '无';
    } else {
      lengthsEl.textContent = lengths.join(', ');
    }
  }

  private applyAtomModification(): void {
    if (this.selectedAtomIndex === null || !this.currentMolecule) return;
    
    const typeSelect = document.getElementById('atom-type-select') as HTMLSelectElement;
    if (!typeSelect) return;
    
    const newType = typeSelect.value;
    const oldType = this.currentMolecule.atoms[this.selectedAtomIndex].type;
    
    if (newType === oldType) return;
    
    this.currentMolecule.atoms[this.selectedAtomIndex].type = newType;
    this.moleculeRenderer.updateAtomColor(this.selectedAtomIndex, newType);
    
    this.updateAtomInfoDisplay(this.selectedAtomIndex);
    this.updateMoleculeProperties();
    
    this.onAtomModify(this.selectedAtomIndex, newType);
  }

  updateMoleculeProperties(): void {
    if (!this.currentMolecule) return;
    
    const totalAtoms = this.currentMolecule.atoms.length;
    const totalBonds = this.currentMolecule.bonds.length;
    const avgAngle = MoleculeParser.calculateAverageBondAngle(this.currentMolecule);
    const polarity = MoleculeParser.calculatePolarity(this.currentMolecule);
    
    this.animateValue('total-atoms', totalAtoms);
    this.animateValue('total-bonds', totalBonds);
    
    const avgAngleEl = document.getElementById('avg-bond-angle') as HTMLSpanElement;
    if (avgAngleEl) {
      const oldValue = parseFloat(avgAngleEl.textContent || '0');
      this.animateNumber(oldValue, avgAngle, (val) => {
        avgAngleEl.textContent = `${val.toFixed(1)}°`;
      });
    }
    
    const polarityEl = document.getElementById('molecule-polarity') as HTMLSpanElement;
    if (polarityEl) {
      polarityEl.textContent = polarity;
    }
  }

  private animateValue(elementId: string, newValue: number): void {
    const el = document.getElementById(elementId) as HTMLSpanElement;
    if (!el) return;
    
    const oldValue = parseInt(el.textContent || '0', 10);
    this.animateNumber(oldValue, newValue, (val) => {
      el.textContent = Math.round(val).toString();
    });
  }

  private animateNumber(from: number, to: number, onUpdate: (value: number) => void): void {
    const obj = { value: from };
    gsap.to(obj, {
      value: to,
      duration: 0.2,
      ease: 'power2.out',
      onUpdate: () => {
        onUpdate(obj.value);
      }
    });
  }

  private showHelpModal(): void {
    const modal = document.getElementById('help-modal') as HTMLDivElement;
    if (modal) {
      modal.style.display = 'flex';
    }
  }

  private hideHelpModal(): void {
    const modal = document.getElementById('help-modal') as HTMLDivElement;
    if (modal) {
      modal.style.display = 'none';
    }
  }

  getCurrentMolecule(): MoleculeData | null {
    return this.currentMolecule;
  }

  getSelectedAtomIndex(): number | null {
    return this.selectedAtomIndex;
  }

  refreshAtomInfo(): void {
    if (this.selectedAtomIndex !== null) {
      this.updateAtomInfoDisplay(this.selectedAtomIndex);
    }
    this.updateMoleculeProperties();
  }
}

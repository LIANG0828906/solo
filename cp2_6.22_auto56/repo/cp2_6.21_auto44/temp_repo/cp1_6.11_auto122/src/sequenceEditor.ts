import { BaseType, getComplementaryBase, isValidPair } from './dnaModel';

export interface SequenceEditorOptions {
  containerId: string;
  listId: string;
  pickerId: string;
  onSequenceChange?: (sequence: BaseType[]) => void;
  onPairChange?: (index: number, base1: BaseType, base2: BaseType) => void;
  onEdit?: (index: number) => void;
}

export class SequenceEditor {
  private options: Required<SequenceEditorOptions>;
  private container: HTMLElement;
  private listEl: HTMLElement;
  private pickerEl: HTMLElement;
  private basePairs: { base1: BaseType; base2: BaseType; isMismatch: boolean }[] = [];
  private selectedIndex: number = -1;
  private editingStrand: 'base1' | null = null;

  constructor(options: SequenceEditorOptions) {
    this.options = {
      onSequenceChange: () => {},
      onPairChange: () => {},
      onEdit: () => {},
      ...options,
    } as Required<SequenceEditorOptions>;

    const container = document.getElementById(this.options.containerId);
    const listEl = document.getElementById(this.options.listId);
    const pickerEl = document.getElementById(this.options.pickerId);

    if (!container || !listEl || !pickerEl) {
      throw new Error('Sequence editor elements not found');
    }

    this.container = container;
    this.listEl = listEl;
    this.pickerEl = pickerEl;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.pickerEl.querySelectorAll('.base-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const base = target.dataset.base as BaseType;
        if (base && this.selectedIndex >= 0) {
          this.selectBase(base);
        }
      });
    });
  }

  public setSequence(sequence: BaseType[]): void {
    this.basePairs = sequence.map((base1) => {
      const base2 = getComplementaryBase(base1);
      return {
        base1,
        base2,
        isMismatch: false,
      };
    });
    this.render();
  }

  public setPairs(pairs: { base1: BaseType; base2: BaseType }[]): void {
    this.basePairs = pairs.map(({ base1, base2 }) => ({
      base1,
      base2,
      isMismatch: !isValidPair(base1, base2),
    }));
    this.render();
  }

  private render(): void {
    this.listEl.innerHTML = '';

    this.basePairs.forEach((pair, index) => {
      const row = document.createElement('div');
      row.className = 'sequence-row';
      row.dataset.index = String(index);

      if (index === this.selectedIndex) {
        row.classList.add('selected');
      }

      const indexLabel = document.createElement('span');
      indexLabel.className = 'sequence-index';
      indexLabel.textContent = String(index + 1);
      row.appendChild(indexLabel);

      const pairDiv = document.createElement('div');
      pairDiv.className = 'base-pair';

      const base1Box = document.createElement('span');
      base1Box.className = `base-box ${pair.base1.toLowerCase()}`;
      if (pair.isMismatch) {
        base1Box.className = 'base-box mismatch';
      }
      base1Box.textContent = pair.base1;
      pairDiv.appendChild(base1Box);

      const separator = document.createElement('span');
      separator.className = 'base-separator';
      separator.textContent = '-';
      pairDiv.appendChild(separator);

      const base2Box = document.createElement('span');
      base2Box.className = `base-box ${pair.base2.toLowerCase()}`;
      if (pair.isMismatch) {
        base2Box.className = 'base-box mismatch';
      }
      base2Box.textContent = pair.base2;
      pairDiv.appendChild(base2Box);

      if (pair.isMismatch) {
        const warning = document.createElement('span');
        warning.className = 'warning-icon';
        warning.textContent = '⚠';
        pairDiv.appendChild(warning);
      }

      row.appendChild(pairDiv);

      const editBtn = document.createElement('button');
      editBtn.className = 'edit-btn';
      editBtn.innerHTML = '✎';
      editBtn.title = '编辑';
      editBtn.addEventListener('click', () => {
        this.startEdit(index);
      });
      row.appendChild(editBtn);

      this.listEl.appendChild(row);
    });
  }

  private startEdit(index: number): void {
    this.selectedIndex = index;
    this.editingStrand = 'base1';
    this.pickerEl.classList.remove('hidden');
    this.render();
    this.options.onEdit(index);
  }

  private selectBase(base: BaseType): void {
    if (this.selectedIndex < 0 || !this.editingStrand) return;

    const pair = this.basePairs[this.selectedIndex];
    pair.base1 = base;
    pair.isMismatch = !isValidPair(pair.base1, pair.base2);

    this.render();
    this.flashRow(this.selectedIndex);

    this.options.onPairChange(this.selectedIndex, pair.base1, pair.base2);

    const sequence = this.basePairs.map((p) => p.base1);
    this.options.onSequenceChange(sequence);
  }

  public flashRow(index: number): void {
    const rows = this.listEl.querySelectorAll('.sequence-row');
    const row = rows[index] as HTMLElement;
    if (row) {
      row.classList.remove('flash');
      void row.offsetWidth;
      row.classList.add('flash');
    }
  }

  public hidePicker(): void {
    this.pickerEl.classList.add('hidden');
    this.selectedIndex = -1;
    this.editingStrand = null;
    this.render();
  }

  public getSequence(): BaseType[] {
    return this.basePairs.map((p) => p.base1);
  }

  public getPairs(): { base1: BaseType; base2: BaseType }[] {
    return this.basePairs.map((p) => ({ base1: p.base1, base2: p.base2 }));
  }
}

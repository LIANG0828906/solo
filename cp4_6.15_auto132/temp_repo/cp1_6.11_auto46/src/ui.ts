import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface StatsData {
  formula: string;
  name: string;
  atoms: number;
  bonds: number;
}

export interface InfoCardData {
  symbol: string;
  name: string;
  atomicNumber: number;
  atomicRadius: number;
  coordinationText: string;
  color: number;
}

export interface UIOptions {
  onMoleculeChange: (id: string) => void;
  onViewChange: (view: 'top' | 'front' | 'side') => void;
  getCamera: () => THREE.PerspectiveCamera;
  getControls: () => OrbitControls;
}

let loadingOverlay: HTMLElement;
let infoCard: HTMLElement;
let infoCardClose: HTMLElement;
let statFormula: HTMLElement;
let statName: HTMLElement;
let statAtoms: HTMLElement;
let statBonds: HTMLElement;
let cardSymbol: HTMLElement;
let cardName: HTMLElement;
let cardSubtitle: HTMLElement;
let cardElement: HTMLElement;
let cardNumber: HTMLElement;
let cardRadius: HTMLElement;
let cardCoord: HTMLElement;

function colorToHex(n: number): string {
  return '#' + n.toString(16).padStart(6, '0').toUpperCase();
}

export function setupUI(options: UIOptions) {
  loadingOverlay = document.getElementById('loading-overlay')!;
  infoCard = document.getElementById('info-card')!;
  infoCardClose = document.getElementById('info-card-close')!;
  statFormula = document.getElementById('stat-formula')!;
  statName = document.getElementById('stat-name')!;
  statAtoms = document.getElementById('stat-atoms')!;
  statBonds = document.getElementById('stat-bonds')!;
  cardSymbol = document.getElementById('card-symbol')!;
  cardName = document.getElementById('card-name')!;
  cardSubtitle = document.getElementById('card-subtitle')!;
  cardElement = document.getElementById('card-element')!;
  cardNumber = document.getElementById('card-number')!;
  cardRadius = document.getElementById('card-radius')!;
  cardCoord = document.getElementById('card-coord')!;

  const moleculeSelect = document.getElementById('molecule-select') as HTMLSelectElement;
  moleculeSelect.addEventListener('change', (e) => {
    const target = e.target as HTMLSelectElement;
    options.onMoleculeChange(target.value);
  });

  const viewButtons = document.querySelectorAll('.view-btn');
  viewButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view') as 'top' | 'front' | 'side';
      options.onViewChange(view);
      viewButtons.forEach((b) => (b as HTMLElement).style.transform = '');
    });
  });

  infoCardClose.addEventListener('click', (e) => {
    e.stopPropagation();
    hideInfoCard();
    const event = new CustomEvent('deselect-atom');
    document.dispatchEvent(event);
  });

  setupViewButtonRipple();
}

function setupViewButtonRipple() {
  document.querySelectorAll('.view-btn').forEach((btn) => {
    btn.addEventListener('click', function (this: HTMLElement, e) {
      const rect = this.getBoundingClientRect();
      const x = (e as MouseEvent).clientX - rect.left;
      const y = (e as MouseEvent).clientY - rect.top;
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      ripple.style.position = 'absolute';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x - size / 2 + 'px';
      ripple.style.top = y - size / 2 + 'px';
      ripple.style.borderRadius = '50%';
      ripple.style.background = 'rgba(0, 255, 136, 0.25)';
      ripple.style.transform = 'scale(0)';
      ripple.style.animation = 'ripple 0.55s ease-out';
      ripple.style.pointerEvents = 'none';
      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });

  if (!document.getElementById('ripple-style')) {
    const style = document.createElement('style');
    style.id = 'ripple-style';
    style.textContent = `
      @keyframes ripple {
        to {
          transform: scale(2.5);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

export function showLoading() {
  loadingOverlay.classList.add('active');
}

export function hideLoading() {
  loadingOverlay.classList.remove('active');
}

export function updateStats(data: StatsData) {
  const animateText = (el: HTMLElement, newText: string) => {
    el.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-6px)';
    setTimeout(() => {
      el.textContent = newText;
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 240);
  };

  if (statFormula.textContent !== data.formula) animateText(statFormula, data.formula);
  if (statName.textContent !== data.name) animateText(statName, data.name);
  const atomsStr = String(data.atoms);
  const bondsStr = String(data.bonds);
  if (statAtoms.textContent !== atomsStr) animateText(statAtoms, atomsStr);
  if (statBonds.textContent !== bondsStr) animateText(statBonds, bondsStr);
}

export function updateInfoCard(data: InfoCardData) {
  const bgColor = colorToHex(data.color);
  cardSymbol.style.background = `radial-gradient(circle at 30% 30%, ${lighten(bgColor, 0.3)}, ${bgColor} 70%, ${darken(bgColor, 0.25)})`;
  cardSymbol.style.boxShadow = `0 4px 16px ${hexToRgba(bgColor, 0.4)}, 0 0 0 1px ${hexToRgba(bgColor, 0.2)} inset`;
  cardSymbol.textContent = data.symbol;

  cardName.textContent = data.name;
  cardSubtitle.textContent = `第 ${data.atomicNumber} 号元素`;
  cardElement.textContent = data.symbol;
  cardNumber.textContent = String(data.atomicNumber);
  cardRadius.textContent = `${data.atomicRadius} pm`;
  cardCoord.textContent = data.coordinationText;
}

export function showInfoCard() {
  infoCard.classList.add('active');
}

export function hideInfoCard() {
  infoCard.classList.remove('active');
}

function lighten(hex: string, amount: number): string {
  const { r, g, b } = parseHex(hex);
  const nr = Math.min(255, Math.round(r + (255 - r) * amount));
  const ng = Math.min(255, Math.round(g + (255 - g) * amount));
  const nb = Math.min(255, Math.round(b + (255 - b) * amount));
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}

function darken(hex: string, amount: number): string {
  const { r, g, b } = parseHex(hex);
  const nr = Math.max(0, Math.round(r * (1 - amount)));
  const ng = Math.max(0, Math.round(g * (1 - amount)));
  const nb = Math.max(0, Math.round(b * (1 - amount)));
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function parseHex(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return {
    r: parseInt(full.substring(0, 2), 16),
    g: parseInt(full.substring(2, 4), 16),
    b: parseInt(full.substring(4, 6), 16),
  };
}

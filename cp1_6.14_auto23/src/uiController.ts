import { sceneManager, type LightRecord } from './sceneManager.js';

const $ = <T extends HTMLElement = HTMLElement>(sel: string) =>
  document.querySelector<T>(sel) as T | null;
const $$ = <T extends HTMLElement = HTMLElement>(sel: string) =>
  Array.from(document.querySelectorAll<T>(sel));

const clamp = (x: number, min: number, max: number) => Math.max(min, Math.min(max, x));

function flashGlow(el: HTMLElement | null) {
  if (!el) return;
  el.classList.add('glowing');
  clearTimeout((el as any)._glowT);
  (el as any)._glowT = setTimeout(() => el.classList.remove('glowing'), 260);
}

class UIController {
  private selectedId: string | null = null;
  private lastMode: 'day' | 'night' = 'day';
  private suppressUpdate = false;

  init() {
    this.bindToolbar();
    this.bindConfigPanel();
    this.bindResponsive();
    sceneManager.subscribe((ev) => this.onSceneEvent(ev));
    this.refreshLightList();
    this.setModeVisuals('day');
  }

  private bindToolbar() {
    const addPoint = $('#btn-add-point');
    const addSpot = $('#btn-add-spot');
    const switcher = $('#mode-switcher');
    const toggle = switcher?.querySelector('.toggle-track');
    const menuBtn = $('#btn-menu-toggle');
    const panel = $('#right-panel');

    addPoint?.addEventListener('click', () => {
      addPoint.classList.add('active');
      addSpot?.classList.remove('active');
      sceneManager.queueAddLight('point');
    });
    addSpot?.addEventListener('click', () => {
      addSpot.classList.add('active');
      addPoint?.classList.remove('active');
      sceneManager.queueAddLight('spot');
    });

    const switchMode = () => {
      const next: 'day' | 'night' = this.lastMode === 'day' ? 'night' : 'day';
      sceneManager.setMode(next);
    };
    toggle?.addEventListener('click', switchMode);
    switcher?.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).classList.contains('mode-label')) switchMode();
    });

    menuBtn?.addEventListener('click', () => {
      const open = panel?.classList.toggle('open');
      if (!open) panel?.classList.add('collapsed');
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        addPoint?.classList.remove('active');
        addSpot?.classList.remove('active');
        sceneManager.cancelAddLight();
        sceneManager.selectLight(null);
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (this.selectedId && (e.target as HTMLElement).tagName !== 'INPUT') {
          sceneManager.removeLight(this.selectedId);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        switchMode();
      }
    });
  }

  private bindConfigPanel() {
    const sliders: Record<string, { input: HTMLInputElement; label: HTMLElement }> = {
      intensity: { input: $('#slider-intensity') as HTMLInputElement, label: $('#val-intensity')! },
      distance: { input: $('#slider-distance') as HTMLInputElement, label: $('#val-distance')! },
      decay: { input: $('#slider-decay') as HTMLInputElement, label: $('#val-decay')! },
      angle: { input: $('#slider-angle') as HTMLInputElement, label: $('#val-angle')! },
      penumbra: { input: $('#slider-penumbra') as HTMLInputElement, label: $('#val-penumbra')! },
    };

    Object.entries(sliders).forEach(([key, { input, label }]) => {
      if (!input) return;
      input.addEventListener('input', () => {
        if (!this.selectedId) return;
        const v = parseFloat(input.value);
        const rec = sceneManager.getLight(this.selectedId);
        if (!rec) return;
        const patch: Partial<LightRecord['params']> = {};
        if (key === 'intensity') { patch.intensity = v; label.textContent = v.toFixed(1); }
        if (key === 'distance') { patch.distance = v; label.textContent = v.toFixed(1); }
        if (key === 'decay') { patch.decay = v; label.textContent = v.toFixed(2); }
        if (key === 'angle') { patch.angle = v; label.textContent = `${v.toFixed(0)}°`; }
        if (key === 'penumbra') { patch.penumbra = v; label.textContent = v.toFixed(2); }
        flashGlow(label);
        if (!this.suppressUpdate) sceneManager.updateLight(this.selectedId, patch);
      });
    });

    const picker = $('#picker-color') as HTMLInputElement | null;
    const valColor = $('#val-color')!;
    picker?.addEventListener('input', () => {
      if (!this.selectedId) return;
      const c = picker.value;
      valColor.textContent = c;
      (valColor as HTMLElement).style.color = c;
      (valColor as HTMLElement).style.backgroundColor = `${c}22`;
      flashGlow(valColor);
      if (!this.suppressUpdate) sceneManager.updateLight(this.selectedId, { color: c });
      this.updateActiveColorDot(c);
    });

    $$<HTMLButtonElement>('.color-dot').forEach((dot) => {
      dot.addEventListener('click', () => {
        const c = dot.dataset.color || '#ffffff';
        if (picker) picker.value = c;
        picker?.dispatchEvent(new Event('input'));
      });
    });

    ['x', 'y', 'z'].forEach((axis) => {
      const input = $(`#pos-${axis}`) as HTMLInputElement | null;
      input?.addEventListener('input', () => {
        if (!this.selectedId) return;
        const rec = sceneManager.getLight(this.selectedId);
        if (!rec) return;
        const v = parseFloat(input.value) || 0;
        const p = rec.light.position;
        const posArr: [number, number, number] = [p.x, p.y, p.z];
        if (axis === 'x') posArr[0] = v;
        if (axis === 'y') posArr[1] = v;
        if (axis === 'z') posArr[2] = v;
        rec.light.position.set(...posArr);
        rec.helper.position.set(...posArr);
        if (rec.type !== 'spot') rec.halo.position.set(...posArr);
      });
    });

    $('#btn-delete-light')?.addEventListener('click', () => {
      if (this.selectedId) sceneManager.removeLight(this.selectedId);
    });
  }

  private bindResponsive() {
    const panel = $('#right-panel');
    const update = () => {
      if (window.innerWidth <= 900) {
        panel?.classList.remove('collapsed');
      } else {
        panel?.classList.remove('open');
      }
    };
    update();
    window.addEventListener('resize', update);
  }

  private onSceneEvent(ev: any) {
    switch (ev.type) {
      case 'light-added':
      case 'light-removed':
        this.refreshLightList();
        break;
      case 'light-selected':
        this.selectedId = ev.id;
        this.renderSelected(ev.record);
        this.refreshLightList();
        break;
      case 'light-deselected':
        this.selectedId = null;
        this.renderEmpty();
        this.refreshLightList();
        break;
      case 'light-updated':
        this.syncPositionInputs(ev.record);
        this.refreshLightList();
        break;
      case 'mode-changed':
        this.lastMode = ev.mode;
        this.setModeVisuals(ev.mode);
        break;
    }
  }

  private setModeVisuals(mode: 'day' | 'night') {
    const switcher = $('#mode-switcher');
    const dayLabel = switcher?.querySelector('.day-label');
    const nightLabel = switcher?.querySelector('.night-label');
    if (mode === 'night') {
      switcher?.classList.add('is-night');
      nightLabel?.classList.add('active');
      dayLabel?.classList.remove('active');
    } else {
      switcher?.classList.remove('is-night');
      dayLabel?.classList.add('active');
      nightLabel?.classList.remove('active');
    }
  }

  private renderEmpty() {
    $('#no-selection')!.style.display = 'flex';
    $('#light-config')!.style.display = 'none';
  }

  private renderSelected(rec: LightRecord) {
    this.suppressUpdate = true;
    $('#no-selection')!.style.display = 'none';
    $('#light-config')!.style.display = 'flex';
    $('#light-id')!.textContent = rec.id;

    const setSlider = (q: string, val: string) => (($(q) as HTMLInputElement)!.value = val);
    const setLabel = (q: string, val: string) => (($(q) as HTMLElement)!.textContent = val);

    setSlider('#slider-intensity', String(rec.params.intensity));
    setLabel('#val-intensity', rec.params.intensity.toFixed(1));

    setSlider('#slider-distance', String(rec.params.distance));
    setLabel('#val-distance', rec.params.distance.toFixed(1));

    setSlider('#slider-decay', String(rec.params.decay));
    setLabel('#val-decay', rec.params.decay.toFixed(2));

    const picker = $('#picker-color') as HTMLInputElement;
    picker.value = rec.params.color;
    const vc = $('#val-color')!;
    vc.textContent = rec.params.color;
    vc.style.color = rec.params.color;
    vc.style.backgroundColor = `${rec.params.color}22`;
    this.updateActiveColorDot(rec.params.color);

    const spotGroup = $('#spot-only')!;
    if (rec.type === 'spot') {
      spotGroup.style.display = 'flex';
      setSlider('#slider-angle', String(rec.params.angle ?? 30));
      setLabel('#val-angle', `${rec.params.angle?.toFixed(0) ?? 30}°`);
      setSlider('#slider-penumbra', String(rec.params.penumbra ?? 0.3));
      setLabel('#val-penumbra', (rec.params.penumbra ?? 0.3).toFixed(2));
    } else {
      spotGroup.style.display = 'none';
    }

    this.syncPositionInputs(rec);
    this.suppressUpdate = false;
  }

  private syncPositionInputs(rec: LightRecord) {
    const p = rec.light.position;
    (document.getElementById('pos-x') as HTMLInputElement).value = p.x.toFixed(2);
    (document.getElementById('pos-y') as HTMLInputElement).value = p.y.toFixed(2);
    (document.getElementById('pos-z') as HTMLInputElement).value = p.z.toFixed(2);
  }

  private updateActiveColorDot(color: string) {
    $$<HTMLButtonElement>('.color-dot').forEach((d) => {
      d.classList.toggle('active', d.dataset.color?.toLowerCase() === color.toLowerCase());
    });
  }

  private refreshLightList() {
    const list = $('#lights-list')!;
    const count = $('#lights-count')!;
    const lights = sceneManager.getLights();
    count.textContent = String(lights.length);
    if (lights.length === 0) {
      list.innerHTML = `<div class="empty-state" style="padding:28px 8px;"><p style="font-size:12px;opacity:0.6;">暂无光源<br/>点击上方按钮添加</p></div>`;
      return;
    }
    list.innerHTML = lights
      .map((rec) => {
        const selected = rec.id === this.selectedId ? ' selected' : '';
        const iconSvg =
          rec.type === 'point'
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`
            : `<svg viewBox="0 0 2
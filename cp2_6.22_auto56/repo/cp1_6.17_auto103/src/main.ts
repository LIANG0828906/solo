import { Renderer } from './Renderer';
import './styles.css';

function init(): void {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  if (!canvas) return;

  const renderer = new Renderer(canvas);
  renderer.start();

  canvas.addEventListener('click', (e: MouseEvent) => {
    const toolbar = document.getElementById('toolbar');
    if (toolbar) {
      const rect = toolbar.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        return;
      }
    }
    renderer.addBrushAt(e.clientX, e.clientY);
  });

  const colorDots = document.querySelectorAll('.color-dot');
  colorDots.forEach((dot) => {
    dot.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      colorDots.forEach((d) => d.classList.remove('selected'));
      (dot as HTMLElement).classList.add('selected');
      const color = (dot as HTMLElement).getAttribute('data-color');
      if (color) {
        renderer.setTheme(color);
      }
    });
  });

  const clearBtn = document.getElementById('clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      renderer.clear();
    });
  }
}

init();

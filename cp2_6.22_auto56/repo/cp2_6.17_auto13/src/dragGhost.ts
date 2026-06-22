let ghostElement: HTMLElement | null = null;

function onDragMove(e: DragEvent) {
  if (ghostElement) {
    ghostElement.style.left = `${e.clientX + 10}px`;
    ghostElement.style.top = `${e.clientY + 10}px`;
  }
}

function onDragEnd() {
  if (ghostElement && ghostElement.parentNode) {
    ghostElement.parentNode.removeChild(ghostElement);
  }
  ghostElement = null;
  document.removeEventListener('dragover', onDragMove);
  document.removeEventListener('dragend', onDragEnd);
  document.removeEventListener('drop', onDragEnd);
}

function cleanCloneAttributes(el: HTMLElement) {
  el.removeAttribute('draggable');
  el.removeAttribute('onDragStart');
  el.removeAttribute('onDragEnd');
  el.removeAttribute('onDragOver');
  el.removeAttribute('onDragLeave');
  el.removeAttribute('onDrop');
  el.removeAttribute('onclick');
  el.removeAttribute('onClick');
  el.removeAttribute('ondragstart');
  el.removeAttribute('ondragend');
  el.removeAttribute('ondragover');
  el.removeAttribute('ondragleave');
  el.removeAttribute('ondrop');
  const draggableChildren = el.querySelectorAll('[draggable="true"]');
  draggableChildren.forEach((child) => {
    (child as HTMLElement).removeAttribute('draggable');
  });
}

export function createCustomDragGhost(
  sourceEl: HTMLElement,
  width: number,
  height: number,
  dragEvent?: DragEvent
) {
  const clone = sourceEl.cloneNode(true) as HTMLElement;
  cleanCloneAttributes(clone);
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.transform = 'scale(0.8)';
  clone.style.opacity = '0.6';
  clone.style.position = 'fixed';
  clone.style.pointerEvents = 'none';
  clone.style.zIndex = '9999';
  clone.style.left = '-9999px';
  clone.style.top = '-9999px';
  clone.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  clone.style.borderRadius = '8px';
  document.body.appendChild(clone);
  ghostElement = clone;

  document.addEventListener('dragover', onDragMove, { passive: true });
  document.addEventListener('dragend', onDragEnd, { passive: true });
  document.addEventListener('drop', onDragEnd, { passive: true });

  try {
    if (dragEvent?.dataTransfer) {
      const emptyCanvas = document.createElement('canvas');
      emptyCanvas.width = 1;
      emptyCanvas.height = 1;
      dragEvent.dataTransfer.setDragImage(emptyCanvas, 0, 0);
    }
  } catch {
    // ignore
  }
}

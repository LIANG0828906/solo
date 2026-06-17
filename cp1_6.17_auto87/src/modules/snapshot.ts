export interface DOMNodeSnapshot {
  tagName: string;
  attributes: Record<string, string>;
  textContent: string | null;
  childNodes: DOMNodeSnapshot[];
}

export interface FormValue {
  selector: string;
  name: string;
  value: string;
  type: string;
  checked?: boolean;
}

export interface Snapshot {
  hash: string;
  timestamp: number;
  domSnapshot: DOMNodeSnapshot | null;
  scrollPosition: { x: number; y: number };
  formValues: FormValue[];
}

const STORAGE_PREFIX = 'psr_snapshot_';
const MAX_STORAGE_BYTES = 3.8 * 1024 * 1024;

function getStorageKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      keys.push(key);
    }
  }
  return keys;
}

function getUsedStorageBytes(): number {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value) {
        total += key.length + value.length;
      }
    }
  }
  return total;
}

function cleanupOldSnapshots(): void {
  const keys = getStorageKeys();
  const snapshotsWithTime: { key: string; timestamp: number }[] = keys.map((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed: Snapshot = JSON.parse(raw);
        return { key, timestamp: parsed.timestamp };
      }
    } catch {
      // ignore
    }
    return { key, timestamp: 0 };
  });
  snapshotsWithTime.sort((a, b) => a.timestamp - b.timestamp);
  while (snapshotsWithTime.length > 0 && getUsedStorageBytes() > MAX_STORAGE_BYTES) {
    const oldest = snapshotsWithTime.shift()!;
    localStorage.removeItem(oldest.key);
  }
}

function serializeDOMNode(node: Node): DOMNodeSnapshot | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return {
      tagName: '#text',
      attributes: {},
      textContent: node.textContent,
      childNodes: [],
    };
  }
  if (node.nodeType === Node.COMMENT_NODE) {
    return {
      tagName: '#comment',
      attributes: {},
      textContent: node.textContent,
      childNodes: [],
    };
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }
  const element = node as HTMLElement;
  const attributes: Record<string, string> = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attributes[attr.name] = attr.value;
  }
  const childNodes: DOMNodeSnapshot[] = [];
  for (let i = 0; i < element.childNodes.length; i++) {
    const child = serializeDOMNode(element.childNodes[i]);
    if (child) {
      childNodes.push(child);
    }
  }
  let textContent: string | null = null;
  if (childNodes.length === 0 && element.textContent) {
    textContent = element.textContent;
  }
  return {
    tagName: element.tagName.toLowerCase(),
    attributes,
    textContent,
    childNodes,
  };
}

function collectFormValues(container: HTMLElement): FormValue[] {
  const values: FormValue[] = [];
  const inputs = container.querySelectorAll('input, textarea, select');
  inputs.forEach((el, index) => {
    const input = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const selector = `${input.tagName.toLowerCase()}:nth-of-type(${index + 1})`;
    const entry: FormValue = {
      selector,
      name: input.name || '',
      value: input.value,
      type: (input as HTMLInputElement).type || input.tagName.toLowerCase(),
    };
    if ((input as HTMLInputElement).type === 'checkbox' || (input as HTMLInputElement).type === 'radio') {
      entry.checked = (input as HTMLInputElement).checked;
    }
    values.push(entry);
  });
  return values;
}

function deserializeDOMToContainer(snapshot: DOMNodeSnapshot, container: HTMLElement): void {
  container.innerHTML = '';
  const fragment = document.createDocumentFragment();
  function buildNode(snap: DOMNodeSnapshot): Node | null {
    if (snap.tagName === '#text') {
      return document.createTextNode(snap.textContent || '');
    }
    if (snap.tagName === '#comment') {
      return document.createComment(snap.textContent || '');
    }
    const el = document.createElement(snap.tagName);
    Object.entries(snap.attributes).forEach(([name, value]) => {
      el.setAttribute(name, value);
    });
    if (snap.textContent !== null) {
      el.textContent = snap.textContent;
    }
    snap.childNodes.forEach((child) => {
      const childNode = buildNode(child);
      if (childNode) {
        el.appendChild(childNode);
      }
    });
    return el;
  }
  const rootNode = buildNode(snapshot);
  if (rootNode) {
    fragment.appendChild(rootNode);
  }
  container.appendChild(fragment);
}

function applyFormValues(container: HTMLElement, formValues: FormValue[]): void {
  const inputs = container.querySelectorAll('input, textarea, select');
  formValues.forEach((fv, idx) => {
    const input = inputs[idx] as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    if (input) {
      input.value = fv.value;
      if (fv.type === 'checkbox' || fv.type === 'radio') {
        (input as HTMLInputElement).checked = fv.checked || false;
      }
    }
  });
}

export class SnapshotManager {
  private autoSaveEnabled = true;

  setAutoSaveEnabled(enabled: boolean): void {
    this.autoSaveEnabled = enabled;
  }

  isAutoSaveEnabled(): boolean {
    return this.autoSaveEnabled;
  }

  saveState(hash: string, container: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
      if (!this.autoSaveEnabled) {
        resolve();
        return;
      }
      requestAnimationFrame(() => {
        const startTime = performance.now();
        const domSnapshot = serializeDOMNode(container);
        const formValues = collectFormValues(container);
        const snapshot: Snapshot = {
          hash,
          timestamp: Date.now(),
          domSnapshot,
          scrollPosition: { x: window.scrollX, y: window.scrollY },
          formValues,
        };
        const key = STORAGE_PREFIX + hash;
        const data = JSON.stringify(snapshot);
        localStorage.setItem(key, data);
        cleanupOldSnapshots();
        const elapsed = performance.now() - startTime;
        if (elapsed > 30) {
          console.warn(`[SnapshotManager] saveState took ${elapsed.toFixed(2)}ms, exceeds 30ms`);
        }
        resolve();
      });
    });
  }

  restoreState(hash: string, container: HTMLElement): Snapshot | null {
    const startTime = performance.now();
    const key = STORAGE_PREFIX + hash;
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    try {
      const snapshot: Snapshot = JSON.parse(raw);
      if (snapshot.domSnapshot) {
        deserializeDOMToContainer(snapshot.domSnapshot, container);
      }
      applyFormValues(container, snapshot.formValues);
      window.scrollTo(snapshot.scrollPosition.x, snapshot.scrollPosition.y);
      const elapsed = performance.now() - startTime;
      if (elapsed > 50) {
        console.warn(`[SnapshotManager] restoreState took ${elapsed.toFixed(2)}ms, exceeds 50ms`);
      }
      return snapshot;
    } catch (err) {
      console.error('[SnapshotManager] Failed to restore state:', err);
      return null;
    }
  }

  clearAllSnapshots(): void {
    const keys = getStorageKeys();
    keys.forEach((key) => localStorage.removeItem(key));
  }

  hasSnapshot(hash: string): boolean {
    return localStorage.getItem(STORAGE_PREFIX + hash) !== null;
  }
}

export const snapshotManager = new SnapshotManager();

import * as THREE from 'three';

export interface ContextMenuHandlers {
  onCopy: (mesh: THREE.Mesh) => void;
  onDelete: (mesh: THREE.Mesh) => void;
  onResetPosition: (mesh: THREE.Mesh) => void;
}

let menu: HTMLElement;
let currentMesh: THREE.Mesh | null = null;
let handlers: ContextMenuHandlers;

export function initContextMenu(
  container: HTMLElement,
  handlersRef: ContextMenuHandlers
): void {
  handlers = handlersRef;
  createMenuElements();
  attachToContainer(container);
  bindEvents();
  
  window.addEventListener('geometryContextMenu', (e: Event) => {
    const customEvent = e as CustomEvent;
    showMenu(customEvent.detail.x, customEvent.detail.y, customEvent.detail.mesh);
  });
}

function createMenuElements(): void {
  menu = document.createElement('div');
  menu.id = 'context-menu';
  menu.style.cssText = `
    position: fixed;
    background: rgba(26, 26, 46, 0.95);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 8px;
    min-width: 160px;
    z-index: 1000;
    display: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    transition: opacity 0.15s ease, transform 0.15s ease;
    transform-origin: top left;
  `;
  
  const menuItems = [
    { id: 'copy', label: '复制', icon: '📋', color: '#48dbfb' },
    { id: 'delete', label: '删除', icon: '🗑️', color: '#ff6b6b' },
    { id: 'reset', label: '重置位置', icon: '↩️', color: '#feca57' }
  ];
  
  menuItems.forEach((item, index) => {
    const menuItem = document.createElement('div');
    menuItem.className = 'menu-item';
    menuItem.dataset.action = item.id;
    menuItem.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      color: #fff;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s ease;
      opacity: 0;
      transform: translateX(-10px);
      animation: slideIn 0.2s ease forwards;
      animation-delay: ${index * 0.05}s;
    `;
    
    const icon = document.createElement('span');
    icon.textContent = item.icon;
    icon.style.cssText = `
      font-size: 16px;
      width: 20px;
      text-align: center;
    `;
    
    const label = document.createElement('span');
    label.textContent = item.label;
    label.style.cssText = `
      flex: 1;
    `;
    
    menuItem.appendChild(icon);
    menuItem.appendChild(label);
    
    menuItem.addEventListener('mouseenter', () => {
      menuItem.style.background = `${item.color}20`;
      menuItem.style.transform = 'translateX(4px)';
    });
    
    menuItem.addEventListener('mouseleave', () => {
      menuItem.style.background = 'transparent';
      menuItem.style.transform = 'translateX(0)';
    });
    
    menuItem.addEventListener('mousedown', () => {
      menuItem.style.transform = 'scale(0.95)';
    });
    
    menuItem.addEventListener('mouseup', () => {
      menuItem.style.transform = 'scale(1)';
    });
    
    menu.appendChild(menuItem);
  });
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `;
  document.head.appendChild(style);
}

function attachToContainer(container: HTMLElement): void {
  container.appendChild(menu);
}

function bindEvents(): void {
  menu.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = (item as HTMLElement).dataset.action;
      
      if (!currentMesh) return;
      
      switch (action) {
        case 'copy':
          handlers.onCopy(currentMesh);
          break;
        case 'delete':
          handlers.onDelete(currentMesh);
          break;
        case 'reset':
          handlers.onResetPosition(currentMesh);
          break;
      }
      
      hideMenu();
    });
  });
  
  document.addEventListener('click', hideMenu);
  document.addEventListener('scroll', hideMenu, true);
  window.addEventListener('resize', hideMenu);
}

export function showMenu(x: number, y: number, mesh: THREE.Mesh): void {
  currentMesh = mesh;
  
  const menuWidth = 180;
  const menuHeight = 150;
  
  let adjustedX = x;
  let adjustedY = y;
  
  if (x + menuWidth > window.innerWidth) {
    adjustedX = window.innerWidth - menuWidth - 10;
  }
  
  if (y + menuHeight > window.innerHeight) {
    adjustedY = window.innerHeight - menuHeight - 10;
  }
  
  menu.style.left = `${adjustedX}px`;
  menu.style.top = `${adjustedY}px`;
  menu.style.display = 'block';
  menu.style.opacity = '0';
  menu.style.transform = 'scale(0.9)';
  
  requestAnimationFrame(() => {
    menu.style.opacity = '1';
    menu.style.transform = 'scale(1)';
  });
  
  const items = menu.querySelectorAll('.menu-item');
  items.forEach((item, index) => {
    (item as HTMLElement).style.animation = 'none';
    (item as HTMLElement).offsetHeight;
    (item as HTMLElement).style.animation = `slideIn 0.2s ease forwards ${index * 0.05}s`;
  });
}

export function hideMenu(): void {
  menu.style.opacity = '0';
  menu.style.transform = 'scale(0.9)';
  
  setTimeout(() => {
    menu.style.display = 'none';
    currentMesh = null;
  }, 150);
}

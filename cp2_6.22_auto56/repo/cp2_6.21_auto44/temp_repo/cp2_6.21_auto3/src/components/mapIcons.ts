import L from 'leaflet'

export const supplyIcon = L.divIcon({
  className: 'custom-marker supply-marker',
  html: `
    <div style="position: relative; width: 28px; height: 28px;">
      <svg viewBox="0 0 28 28" width="28" height="28">
        <polygon points="4,2 4,26 22,14" fill="#e67e22" stroke="#d35400" stroke-width="1.5"/>
        <polygon points="4,2 4,14 22,14" fill="#f39c12" stroke="#d35400" stroke-width="1.5"/>
        <circle cx="10" cy="14" r="3" fill="#fff" opacity="0.6"/>
      </svg>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [4, 26],
  popupAnchor: [10, -20],
})

export const campIcon = L.divIcon({
  className: 'custom-marker camp-marker',
  html: `
    <div style="position: relative; width: 32px; height: 32px;">
      <svg viewBox="0 0 32 32" width="32" height="32">
        <polygon points="16,2 2,28 30,28" fill="#8b5a2b" stroke="#6b4423" stroke-width="1.5"/>
        <polygon points="16,2 8,28 24,28" fill="#a0522d" opacity="0.7"/>
        <polygon points="16,14 12,28 20,28" fill="#4a3728" opacity="0.6"/>
        <circle cx="16" cy="10" r="2" fill="#ffd700"/>
      </svg>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 28],
  popupAnchor: [0, -26],
})

export function createMemberIcon(status: 'moving' | 'resting' | 'trouble', name: string) {
  const colors = {
    moving: '#2ecc71',
    resting: '#f1c40f',
    trouble: '#e74c3c',
  }
  const color = colors[status]

  return L.divIcon({
    className: 'member-marker-icon',
    html: `
      <div style="position: relative; width: 24px; height: 24px;">
        <div class="marker-glow" style="background: ${color};"></div>
        <div 
          class="member-marker"
          style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 16px;
            height: 16px;
            background: ${color};
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 8px ${color};
          "
        ></div>
        <div class="member-marker-label">${name}</div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

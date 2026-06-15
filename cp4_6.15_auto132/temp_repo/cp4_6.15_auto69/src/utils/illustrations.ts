const illustrations: string[] = [
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 10 C60 30, 80 35, 70 55 C90 60, 75 80, 50 90 C25 80, 10 60, 30 55 C20 35, 40 30, 50 10 Z" fill="currentColor" opacity="0.3"/>
    <circle cx="50" cy="50" r="25" fill="currentColor" opacity="0.5"/>
    <path d="M50 30 Q55 45, 50 60 Q45 45, 50 30" fill="none" stroke="currentColor" stroke-width="2" opacity="0.8"/>
  </svg>`,
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M30 70 Q50 20, 70 70" fill="none" stroke="currentColor" stroke-width="3" opacity="0.6"/>
    <circle cx="40" cy="55" r="8" fill="currentColor" opacity="0.5"/>
    <circle cx="60" cy="50" r="6" fill="currentColor" opacity="0.5"/>
    <circle cx="50" cy="35" r="5" fill="currentColor" opacity="0.5"/>
    <circle cx="35" cy="40" r="4" fill="currentColor" opacity="0.5"/>
    <circle cx="65" cy="42" r="7" fill="currentColor" opacity="0.5"/>
  </svg>`,
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 80 L50 20 L80 80 Z" fill="currentColor" opacity="0.2"/>
    <path d="M30 75 L50 40 L70 75 Z" fill="currentColor" opacity="0.3"/>
    <circle cx="70" cy="25" r="10" fill="currentColor" opacity="0.4"/>
    <path d="M65 25 L80 15" stroke="currentColor" stroke-width="2" opacity="0.5"/>
    <path d="M80 25 L95 20" stroke="currentColor" stroke-width="2" opacity="0.5"/>
    <path d="M75 30 L88 38" stroke="currentColor" stroke-width="2" opacity="0.5"/>
  </svg>`,
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" stroke-width="2" opacity="0.4"/>
    <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
    <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" stroke-width="1" opacity="0.6"/>
    <path d="M50 15 L50 85" stroke="currentColor" stroke-width="1" opacity="0.3"/>
    <path d="M15 50 L85 50" stroke="currentColor" stroke-width="1" opacity="0.3"/>
  </svg>`,
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 50 Q25 30, 40 50 T70 50 T100 50" fill="none" stroke="currentColor" stroke-width="2.5" opacity="0.5"/>
    <path d="M10 65 Q25 45, 40 65 T70 65 T100 65" fill="none" stroke="currentColor" stroke-width="2" opacity="0.4"/>
    <path d="M10 80 Q25 60, 40 80 T70 80 T100 80" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
    <circle cx="25" cy="20" r="4" fill="currentColor" opacity="0.5"/>
    <circle cx="55" cy="15" r="3" fill="currentColor" opacity="0.5"/>
    <circle cx="80" cy="22" r="5" fill="currentColor" opacity="0.5"/>
  </svg>`,
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 10 L50 90" stroke="currentColor" stroke-width="3" opacity="0.4"/>
    <path d="M20 30 Q35 35, 50 30" fill="none" stroke="currentColor" stroke-width="2" opacity="0.5"/>
    <path d="M80 30 Q65 35, 50 30" fill="none" stroke="currentColor" stroke-width="2" opacity="0.5"/>
    <path d="M25 55 Q37 58, 50 55" fill="none" stroke="currentColor" stroke-width="2" opacity="0.5"/>
    <path d="M75 55 Q63 58, 50 55" fill="none" stroke="currentColor" stroke-width="2" opacity="0.5"/>
    <path d="M30 80 Q40 82, 50 80" fill="none" stroke="currentColor" stroke-width="2" opacity="0.5"/>
    <path d="M70 80 Q60 82, 50 80" fill="none" stroke="currentColor" stroke-width="2" opacity="0.5"/>
  </svg>`,
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 90 Q30 70, 20 40 Q35 55, 50 40 Q65 55, 80 40 Q70 70, 50 90 Z" fill="currentColor" opacity="0.3"/>
    <path d="M50 90 Q40 60, 35 30" fill="none" stroke="currentColor" stroke-width="2" opacity="0.6"/>
    <path d="M50 90 Q60 60, 65 30" fill="none" stroke="currentColor" stroke-width="2" opacity="0.6"/>
    <circle cx="50" cy="25" r="10" fill="currentColor" opacity="0.4"/>
  </svg>`,
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect x="15" y="40" width="70" height="50" rx="4" fill="currentColor" opacity="0.2"/>
    <path d="M15 60 L85 60" stroke="currentColor" stroke-width="2" opacity="0.5"/>
    <path d="M30 60 L30 90" stroke="currentColor" stroke-width="1.5" opacity="0.4"/>
    <path d="M50 60 L50 90" stroke="currentColor" stroke-width="1.5" opacity="0.4"/>
    <path d="M70 60 L70 90" stroke="currentColor" stroke-width="1.5" opacity="0.4"/>
    <polygon points="50,5 60,35 40,35" fill="currentColor" opacity="0.5"/>
    <path d="M25 40 L50 5 L75 40" fill="none" stroke="currentColor" stroke-width="2" opacity="0.4"/>
  </svg>`,
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 75 Q30 70, 50 75 T90 75" fill="none" stroke="currentColor" stroke-width="2" opacity="0.5"/>
    <path d="M20 70 Q30 40, 35 65" fill="currentColor" opacity="0.3"/>
    <path d="M50 70 Q60 35, 68 60" fill="currentColor" opacity="0.3"/>
    <path d="M75 72 Q82 45, 88 65" fill="currentColor" opacity="0.3"/>
    <circle cx="30" cy="30" r="6" fill="currentColor" opacity="0.5"/>
    <circle cx="60" cy="28" r="7" fill="currentColor" opacity="0.5"/>
    <circle cx="83" cy="35" r="5" fill="currentColor" opacity="0.5"/>
  </svg>`,
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 20 L80 80" stroke="currentColor" stroke-width="2" opacity="0.3"/>
    <path d="M80 20 L20 80" stroke="currentColor" stroke-width="2" opacity="0.3"/>
    <circle cx="50" cy="50" r="30" fill="currentColor" opacity="0.15"/>
    <circle cx="50" cy="50" r="20" fill="currentColor" opacity="0.25"/>
    <circle cx="50" cy="50" r="10" fill="currentColor" opacity="0.4"/>
    <path d="M50 10 Q60 30, 50 50 Q40 70, 50 90" fill="none" stroke="currentColor" stroke-width="2" opacity="0.5"/>
  </svg>`,
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 95 L50 60" stroke="currentColor" stroke-width="3" opacity="0.5"/>
    <path d="M50 75 Q30 70, 25 50" fill="none" stroke="currentColor" stroke-width="2" opacity="0.4"/>
    <path d="M50 75 Q70 70, 75 50" fill="none" stroke="currentColor" stroke-width="2" opacity="0.4"/>
    <path d="M50 60 Q35 55, 30 35" fill="none" stroke="currentColor" stroke-width="2" opacity="0.4"/>
    <path d="M50 60 Q65 55, 70 35" fill="none" stroke="currentColor" stroke-width="2" opacity="0.4"/>
    <circle cx="50" cy="45" r="20" fill="currentColor" opacity="0.3"/>
    <circle cx="50" cy="20" r="12" fill="currentColor" opacity="0.4"/>
  </svg>`,
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 15 L85 50 L50 85 L15 50 Z" fill="currentColor" opacity="0.2"/>
    <circle cx="35" cy="35" r="8" fill="currentColor" opacity="0.4"/>
    <circle cx="65" cy="35" r="8" fill="currentColor" opacity="0.4"/>
    <circle cx="35" cy="65" r="8" fill="currentColor" opacity="0.4"/>
    <circle cx="65" cy="65" r="8" fill="currentColor" opacity="0.4"/>
    <circle cx="50" cy="50" r="10" fill="currentColor" opacity="0.5"/>
    <path d="M50 25 L50 75" stroke="currentColor" stroke-width="1" opacity="0.3"/>
    <path d="M25 50 L75 50" stroke="currentColor" stroke-width="1" opacity="0.3"/>
  </svg>`
];

export function getRandomIllustration(): string {
  const index = Math.floor(Math.random() * illustrations.length);
  return illustrations[index];
}

export default illustrations;

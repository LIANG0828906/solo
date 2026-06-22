interface SolarTermIconProps {
  icon: string;
  color: string;
  size?: number;
}

export function SolarTermIcon({ icon, color, size = 24 }: SolarTermIconProps) {
  const renderIcon = () => {
    switch (icon) {
      case 'willow':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path d="M12 4C12 4 6 6 6 12C6 15 8 18 12 20C16 18 18 15 18 12C18 6 12 4 12 4Z" stroke={color} strokeWidth="1.5" fill="none" />
            <path d="M8 8L9 12M10 6L11 11M14 6L13 11M16 8L15 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );
      case 'rain':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path d="M7 14L6 17M10 15L9 19M14 14L13 17M17 15L16 19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M20 10C20 7.23858 17.7614 5 15 5C13.786 5 12.684 5.43116 11.831 6.15765C10.6872 4.30448 8.48322 3 6 3C2.68629 3 0 5.68629 0 9C0 12.3137 2.68629 15 6 15H19C20.6569 15 22 13.6569 22 12C22 10.8954 21.1046 10 20 10Z" stroke={color} strokeWidth="1.5" fill="rgba(100,181,246,0.2)" />
          </svg>
        );
      case 'sun':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="1.5" fill="rgba(255,213,79,0.3)" />
            <path d="M12 2V4M12 20V22M4 12H2M22 12H20M4.929 4.929L6.343 6.343M17.657 17.657L19.071 19.071M4.929 19.071L6.343 17.657M17.657 6.343L19.071 4.929" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );
      case 'lotus':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <ellipse cx="12" cy="14" rx="8" ry="3" stroke={color} strokeWidth="1.5" fill="rgba(240,98,146,0.2)" />
            <path d="M12 14C12 10 10 6 6 6C2 6 2 14 12 14Z" stroke={color} strokeWidth="1.5" fill="rgba(240,98,146,0.3)" />
            <path d="M12 14C12 10 14 6 18 6C22 6 22 14 12 14Z" stroke={color} strokeWidth="1.5" fill="rgba(240,98,146,0.25)" />
            <path d="M12 14C12 9 14 4 12 2C10 4 12 9 12 14Z" stroke={color} strokeWidth="1.5" fill="rgba(240,98,146,0.35)" />
          </svg>
        );
      case 'moon':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path d="M21 12.79A9 9 0 1 1 11.21 3A7 7 0 0 0 21 12.79Z" stroke={color} strokeWidth="1.5" fill="rgba(255,209,128,0.3)" />
          </svg>
        );
      case 'snowflake':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path d="M12 2L12 22M12 2L10 5M12 2L14 5M12 22L10 19M12 22L14 19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M2 12L22 12M2 12L5 10M2 12L5 14M22 12L19 10M22 12L19 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M4.5 4.5L19.5 19.5M4.5 4.5L6.5 5.5M4.5 4.5L5.5 6.5M19.5 19.5L17.5 18.5M19.5 19.5L18.5 17.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M19.5 4.5L4.5 19.5M19.5 4.5L17.5 5.5M19.5 4.5L18.5 6.5M4.5 19.5L6.5 18.5M4.5 19.5L5.5 17.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );
      case 'flower':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5" fill="rgba(255,193,7,0.4)" />
            <circle cx="12" cy="6" r="3" stroke={color} strokeWidth="1.5" fill="rgba(244,143,177,0.4)" />
            <circle cx="12" cy="18" r="3" stroke={color} strokeWidth="1.5" fill="rgba(244,143,177,0.4)" />
            <circle cx="6" cy="12" r="3" stroke={color} strokeWidth="1.5" fill="rgba(244,143,177,0.4)" />
            <circle cx="18" cy="12" r="3" stroke={color} strokeWidth="1.5" fill="rgba(244,143,177,0.4)" />
          </svg>
        );
      case 'leaf':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path d="M11 20C11 20 4 18 4 10C4 4 11 2 19 3C20 10 18 17 11 20Z" stroke={color} strokeWidth="1.5" fill="rgba(102,187,106,0.3)" />
            <path d="M11 20L14 10L19 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );
      case 'wheat':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path d="M12 22L12 10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <ellipse cx="9" cy="9" rx="2.5" ry="3.5" stroke={color} strokeWidth="1.5" fill="rgba(255,183,77,0.3)" />
            <ellipse cx="15" cy="9" rx="2.5" ry="3.5" stroke={color} strokeWidth="1.5" fill="rgba(255,183,77,0.3)" />
            <ellipse cx="12" cy="5" rx="2.5" ry="3.5" stroke={color} strokeWidth="1.5" fill="rgba(255,183,77,0.3)" />
            <path d="M12 2L12 1.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );
      case 'flame':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path d="M12 2C12 2 16 6 16 12C16 15.3137 13.3137 18 10 18C6.68629 18 4 15.3137 4 12C4 10 5 9 5 9C5 9 6 13 9 13C11 13 11 8 11 8C11 8 14 5 12 2Z" stroke={color} strokeWidth="1.5" fill="rgba(239,83,80,0.3)" />
          </svg>
        );
      default:
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.5" fill={color + '22'} />
          </svg>
        );
    }
  };

  return renderIcon();
}

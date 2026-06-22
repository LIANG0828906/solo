interface WineSvgProps {
  size?: number;
}

export function WineSvg({ size = 24 }: WineSvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2h8l1 7H7l1-7z" />
      <path d="M7 9v7a5 5 0 0 0 10 0V9" />
      <line x1="12" y1="22" x2="12" y2="16" />
    </svg>
  );
}

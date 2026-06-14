import type { SearchBarProps } from '../types';

export default function SearchBar({ placeholder, borderRadius, backgroundColor }: SearchBarProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        backgroundColor,
        borderRadius,
        padding: '0 12px',
        boxSizing: 'border-box',
        border: '1px solid #e2e8f0',
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ color: '#94a3b8', marginRight: 8, flexShrink: 0 }}
      >
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
      <input
        type="text"
        placeholder={placeholder}
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          backgroundColor: 'transparent',
          fontSize: 14,
          color: '#1e293b',
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
}

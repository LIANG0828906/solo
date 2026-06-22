interface SaveButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

const SaveButton = ({ onClick, disabled }: SaveButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="btn-press animate-pulse-glow fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all duration-200"
      style={{
        backgroundColor: 'var(--bg-card-hover)',
        color: '#ffffff',
        border: '2px solid rgba(88, 166, 255, 0.6)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.3 : 1,
        boxShadow: disabled ? 'none' : undefined,
      }}
      title="存档 / 读档"
    >
      💾
    </button>
  );
};

export default SaveButton;

import type { Choice } from '../types';

interface ChoicePanelProps {
  choices: Choice[];
  onChoice: (choiceId: string) => void;
  disabled: boolean;
}

const ChoicePanel = ({ choices, onChoice, disabled }: ChoicePanelProps) => {
  if (!choices || choices.length === 0) return null;

  return (
    <div
      className="flex-shrink-0 border-t px-4 py-4"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div
        className="font-mono text-xs mb-3 uppercase tracking-wider"
        style={{ color: 'var(--text-accent)' }}
      >
        {'>'} 可用行动:
      </div>
      <div className="space-y-2 max-w-3xl mx-auto">
        {choices.map((choice, index) => (
          <button
            key={choice.id}
            onClick={() => !disabled && onChoice(choice.id)}
            disabled={disabled}
            className="btn-press w-full text-left font-mono text-sm px-4 py-3 rounded border transition-all duration-200 group"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.backgroundColor = 'rgba(31, 111, 235, 0.15)';
                e.currentTarget.style.borderColor = 'var(--bg-card-hover)';
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(31, 111, 235, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-card)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span
              className="inline-block w-8 font-bold mr-3"
              style={{ color: 'var(--text-accent)' }}
            >
              [{index + 1}]
            </span>
            <span>{choice.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChoicePanel;

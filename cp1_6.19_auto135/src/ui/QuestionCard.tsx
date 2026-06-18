import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Question, Option } from '../engine/types';

interface QuestionCardProps {
  question: Question;
  onAnswer: (optionId: string) => void;
  selected: boolean;
}

const optionColors: Record<string, string> = {
  Melody: '#6C63FF',
  Rhythm: '#FF6584',
  Lyric: '#00D2FF',
  Mood: '#A855F7',
  Complexity: '#F59E0B',
};

function OptionButton({
  option,
  onClick,
  disabled,
}: {
  option: Option;
  onClick: () => void;
  disabled: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const color = optionColors[option.dimension] || '#6C63FF';

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        padding: '20px 16px',
        borderRadius: 12,
        background: isHovered ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        transform: isPressed ? 'scale(0.98)' : 'scale(1)',
        transition: 'background 0.2s ease, transform 0.1s ease',
      }}
    >
      <motion.div
        initial={{ scale: 1 }}
        animate={{
          scale: isHovered ? 1.1 : 1,
          background: isHovered
            ? `linear-gradient(135deg, ${color} 0%, #FF6584 100%)`
            : 'rgba(255, 255, 255, 0.1)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          fontSize: 18,
          color: isHovered ? '#fff' : 'rgba(255, 255, 255, 0.8)',
          flexShrink: 0,
        }}
      >
        {option.text.charAt(0)}
      </motion.div>
      <span
        style={{
          fontSize: 14,
          color: 'rgba(255, 255, 255, 0.9)',
          textAlign: 'center',
          lineHeight: 1.4,
        }}
      >
        {option.text}
      </span>
    </motion.button>
  );
}

export default function QuestionCard({
  question,
  onAnswer,
  selected,
}: QuestionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{
        width: '100%',
        maxWidth: 560,
        padding: 40,
        background: 'rgba(42, 42, 58, 0.8)',
        backdropFilter: 'blur(10px)',
        borderRadius: 20,
        animation: 'breathe 3s ease-in-out infinite',
      }}
    >
      <h2
        style={{
          fontSize: 22,
          fontWeight: 600,
          textAlign: 'center',
          marginBottom: 32,
          lineHeight: 1.5,
          color: '#fff',
        }}
      >
        {question.text}
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}
      >
        {question.options.map((option) => (
          <OptionButton
            key={option.id}
            option={option}
            onClick={() => onAnswer(option.id)}
            disabled={selected}
          />
        ))}
      </div>
    </motion.div>
  );
}

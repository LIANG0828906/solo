import { useMemo } from 'react';
import { CheckCircleFilled } from '@ant-design/icons';
import { ChoiceQuestion, FontSize } from '../types/question';
import { parseRichText } from '../utils/questionParser';

interface ChoicePreviewProps {
  value: ChoiceQuestion;
  fontSize: FontSize;
}

const fontSizeValueMap: Record<FontSize, number> = {
  small: 14,
  medium: 16,
  large: 18,
};

export default function ChoicePreview({ value, fontSize }: ChoicePreviewProps) {
  const stemHtml = useMemo(() => parseRichText(value.stem), [value.stem]);
  const fontSizeValue = fontSizeValueMap[fontSize];

  return (
    <div style={{ width: '100%' }}>
      <style>{`
        .choice-option-card {
          transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 2px solid #e5e7eb;
          background-color: #ffffff;
          padding: 12px 16px;
          cursor: default;
          border-radius: 12px;
        }
        .choice-option-card:hover {
          background-color: #e6f0ff;
          border-color: #1a365d;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(26, 54, 93, 0.15);
        }
        .choice-option-card.correct {
          background-color: #f0fdf4;
          border-color: #22c55e;
        }
        .choice-label-circle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          flex-shrink: 0;
          border-radius: 50%;
          border: 2px solid #d1d5db;
          font-weight: 600;
          color: #6b7280;
        }
        .choice-label-circle.correct {
          background-color: #22c55e;
          border-color: #22c55e;
          color: #ffffff;
        }
      `}</style>

      <div
        style={{
          marginBottom: 24,
          fontWeight: 500,
          color: '#1f2937',
          fontSize: fontSizeValue,
          transition: 'font-size 0.3s ease',
        }}
        dangerouslySetInnerHTML={{ __html: stemHtml }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {value.options.map((option) => {
          const isCorrect = value.correctAnswers.includes(option.label);
          const optionHtml = parseRichText(option.content);

          return (
            <div
              key={option.id}
              className={`choice-option-card${isCorrect ? ' correct' : ''}`}
              style={{ fontSize: fontSizeValue, transition: 'font-size 0.3s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease' }}
            >
              <div className={`choice-label-circle${isCorrect ? ' correct' : ''}`}>
                {option.label}
              </div>
              <div
                style={{ flex: 1, color: '#374151' }}
                dangerouslySetInnerHTML={{ __html: optionHtml }}
              />
              {isCorrect && (
                <CheckCircleFilled style={{ color: '#22c55e', fontSize: 18 }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

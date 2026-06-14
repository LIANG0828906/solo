import { useMemo } from 'react';
import { CheckCircleFilled } from '@ant-design/icons';
import { ChoiceQuestion, FontSize } from '../types/question';
import { parseRichText } from '../utils/questionParser';
import { cn } from '@/lib/utils';

interface ChoicePreviewProps {
  value: ChoiceQuestion;
  fontSize: FontSize;
}

const fontSizeMap = {
  small: 'text-sm',
  medium: 'text-base',
  large: 'text-lg',
};

export default function ChoicePreview({ value, fontSize }: ChoicePreviewProps) {
  const stemHtml = useMemo(() => parseRichText(value.stem), [value.stem]);
  const fontClass = fontSizeMap[fontSize];

  return (
    <div className="w-full">
      <style>{`
        .choice-option-card {
          transition: all 0.2s ease;
        }
        .choice-option-card:hover {
          background-color: #e6f0ff;
          border-color: #1a365d;
        }
        .choice-option-card.correct {
          background-color: #f0fdf4;
          border-color: #22c55e;
        }
      `}</style>

      <div
        className={cn('mb-6 font-medium text-gray-800', fontClass)}
        dangerouslySetInnerHTML={{ __html: stemHtml }}
      />

      <div className="flex flex-col gap-3">
        {value.options.map((option) => {
          const isCorrect = value.correctAnswers.includes(option.label);
          const optionHtml = parseRichText(option.content);

          return (
            <div
              key={option.id}
              className={cn(
                'choice-option-card flex items-center gap-3 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 cursor-default',
                isCorrect && 'correct',
                fontClass
              )}
              style={{ borderRadius: '12px' }}
            >
              <div
                className={cn(
                  'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold',
                  isCorrect
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 text-gray-500'
                )}
              >
                {option.label}
              </div>
              <div
                className="flex-1 text-gray-700"
                dangerouslySetInnerHTML={{ __html: optionHtml }}
              />
              {isCorrect && (
                <CheckCircleFilled className="text-green-500 text-lg" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

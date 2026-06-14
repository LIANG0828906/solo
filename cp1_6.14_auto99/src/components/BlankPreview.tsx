import { useMemo, useState } from 'react';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import { BlankQuestion, FontSize } from '../types/question';
import { parseRichText } from '../utils/questionParser';
import { cn } from '@/lib/utils';

interface BlankPreviewProps {
  value: BlankQuestion;
  fontSize: FontSize;
}

const fontSizeMap = {
  small: {
    container: 'text-sm',
    input: 'text-sm',
    inputHeight: 'h-8',
    inputWidth: 'w-24',
  },
  medium: {
    container: 'text-base',
    input: 'text-base',
    inputHeight: 'h-10',
    inputWidth: 'w-32',
  },
  large: {
    container: 'text-lg',
    input: 'text-lg',
    inputHeight: 'h-12',
    inputWidth: 'w-40',
  },
};

type BlankStatus = 'idle' | 'correct' | 'wrong';

export default function BlankPreview({ value, fontSize }: BlankPreviewProps) {
  const fontSizes = fontSizeMap[fontSize];
  const [inputValues, setInputValues] = useState<string[]>(
    value.blanks.map(() => '')
  );
  const [blankStatuses, setBlankStatuses] = useState<BlankStatus[]>(
    value.blanks.map(() => 'idle')
  );

  const stemParts = useMemo(() => {
    const parts: { type: 'text' | 'blank'; content: string; index?: number }[] = [];
    const blankPattern = /\{\{blank\}\}/g;
    let lastIndex = 0;
    let blankIndex = 0;
    let match;

    while ((match = blankPattern.exec(value.stem)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: value.stem.slice(lastIndex, match.index),
        });
      }
      parts.push({
        type: 'blank',
        content: '',
        index: blankIndex,
      });
      blankIndex++;
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < value.stem.length) {
      parts.push({
        type: 'text',
        content: value.stem.slice(lastIndex),
      });
    }

    return parts;
  }, [value.stem]);

  const handleInputChange = (index: number, value: string) => {
    const newValues = [...inputValues];
    newValues[index] = value;
    setInputValues(newValues);

    if (value.trim() === '') {
      const newStatuses = [...blankStatuses];
      newStatuses[index] = 'idle';
      setBlankStatuses(newStatuses);
    }
  };

  const handleInputBlur = (index: number) => {
    const blank = value.blanks[index];
    const inputValue = inputValues[index].trim();

    if (inputValue === '') {
      const newStatuses = [...blankStatuses];
      newStatuses[index] = 'idle';
      setBlankStatuses(newStatuses);
      return;
    }

    const isCorrect = blank.correctAnswers.some(
      (answer) => answer.toLowerCase() === inputValue.toLowerCase()
    );

    const newStatuses = [...blankStatuses];
    newStatuses[index] = isCorrect ? 'correct' : 'wrong';
    setBlankStatuses(newStatuses);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === 'Enter') {
      handleInputBlur(index);
    }
  };

  const renderStem = () => {
    return stemParts.map((part, partIndex) => {
      if (part.type === 'text') {
        const html = parseRichText(part.content);
        return (
          <span
            key={`text-${partIndex}`}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      }

      const blankIndex = part.index ?? 0;
      const status = blankStatuses[blankIndex];

      return (
        <span
          key={`blank-${blankIndex}`}
          className="inline-flex items-center gap-1 mx-1 align-middle"
        >
          <input
            type="text"
            value={inputValues[blankIndex]}
            onChange={(e) => handleInputChange(blankIndex, e.target.value)}
            onBlur={() => handleInputBlur(blankIndex)}
            onKeyDown={(e) => handleKeyDown(e, blankIndex)}
            className={cn(
              'blank-input rounded-lg border-2 border-dashed px-3 outline-none transition-all duration-0.2s bg-white',
              fontSizes.input,
              fontSizes.inputHeight,
              fontSizes.inputWidth,
              status === 'idle' && 'border-gray-300 focus:border-blue-500',
              status === 'correct' && 'border-green-500 bg-green-50',
              status === 'wrong' && 'border-red-500 bg-red-50'
            )}
            style={{ borderRadius: '12px' }}
            placeholder={`空${blankIndex + 1}`}
          />
          {status === 'correct' && (
            <CheckCircleFilled className="text-green-500 text-lg" />
          )}
          {status === 'wrong' && (
            <CloseCircleFilled className="text-red-500 text-lg" />
          )}
        </span>
      );
    });
  };

  return (
    <div className="w-full">
      <style>{`
        .blank-input {
          transition: all 0.2s ease;
        }
        .blank-input:focus {
          box-shadow: 0 0 0 3px rgba(26, 54, 93, 0.1);
        }
      `}</style>

      <div
        className={cn(
          'font-medium text-gray-800 leading-relaxed',
          fontSizes.container
        )}
      >
        {renderStem()}
      </div>

      <div className="mt-6 space-y-2">
        <div className="text-sm font-medium" style={{ color: '#1a365d' }}>
          参考答案：
        </div>
        {value.blanks.map((blank, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-500">空{index + 1}：</span>
            <span className="text-gray-700">
              {blank.correctAnswers.join(' / ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

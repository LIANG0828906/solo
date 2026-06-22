import { useMemo, useState } from 'react';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import { BlankQuestion, FontSize } from '../types/question';
import { parseRichText } from '../utils/questionParser';

interface BlankPreviewProps {
  value: BlankQuestion;
  fontSize: FontSize;
}

type BlankStatus = 'idle' | 'correct' | 'wrong';

const fontSizeValueMap: Record<FontSize, number> = {
  small: 14,
  medium: 16,
  large: 18,
};

const inputSizeMap: Record<FontSize, { height: number; width: number; padding: string }> = {
  small: { height: 32, width: 96, padding: '0 12px' },
  medium: { height: 40, width: 128, padding: '0 12px' },
  large: { height: 48, width: 160, padding: '0 12px' },
};

export default function BlankPreview({ value, fontSize }: BlankPreviewProps) {
  const fontSizeValue = fontSizeValueMap[fontSize];
  const inputSize = inputSizeMap[fontSize];
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
    let match: RegExpExecArray | null;

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

  const handleInputChange = (index: number, val: string) => {
    const newValues = [...inputValues];
    newValues[index] = val;
    setInputValues(newValues);

    if (val.trim() === '') {
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

  const getInputStyles = (status: BlankStatus): React.CSSProperties => {
    const base: React.CSSProperties = {
      border: '2px dashed #d1d5db',
      backgroundColor: '#ffffff',
      borderRadius: 12,
      padding: inputSize.padding,
      height: inputSize.height,
      width: inputSize.width,
      fontSize: fontSizeValue,
      outline: 'none',
      transition: 'border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease, font-size 0.3s ease',
      boxSizing: 'border-box',
    };

    if (status === 'correct') {
      return {
        ...base,
        borderColor: '#22c55e',
        backgroundColor: '#f0fdf4',
      };
    }
    if (status === 'wrong') {
      return {
        ...base,
        borderColor: '#ef4444',
        backgroundColor: '#fef2f2',
      };
    }
    return base;
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
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            marginLeft: 4,
            marginRight: 4,
            verticalAlign: 'middle',
          }}
        >
          <input
            type="text"
            className="blank-input"
            value={inputValues[blankIndex]}
            onChange={(e) => handleInputChange(blankIndex, e.target.value)}
            onBlur={() => handleInputBlur(blankIndex)}
            onKeyDown={(e) => handleKeyDown(e, blankIndex)}
            style={getInputStyles(status)}
            placeholder={`空${blankIndex + 1}`}
          />
          {status === 'correct' && (
            <CheckCircleFilled style={{ color: '#22c55e', fontSize: 18 }} />
          )}
          {status === 'wrong' && (
            <CloseCircleFilled style={{ color: '#ef4444', fontSize: 18 }} />
          )}
        </span>
      );
    });
  };

  return (
    <div style={{ width: '100%' }}>
      <style>{`
        .blank-input:focus {
          box-shadow: 0 0 0 3px rgba(26, 54, 93, 0.15);
          border-color: #1a365d !important;
        }
      `}</style>

      <div
        style={{
          fontWeight: 500,
          color: '#1f2937',
          fontSize: fontSizeValue,
          transition: 'font-size 0.3s ease',
          lineHeight: 1.75,
        }}
      >
        {renderStem()}
      </div>

      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#1a365d' }}>
          参考答案：
        </div>
        {value.blanks.map((blank, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            <span style={{ fontWeight: 500, color: '#6b7280' }}>空{index + 1}：</span>
            <span style={{ color: '#374151' }}>
              {blank.correctAnswers.join(' / ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

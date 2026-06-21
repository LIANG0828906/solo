import { forwardRef, useMemo } from 'react';
import type { Theme } from './themes';
import { tokenizeLine, getTokenColor } from './highlight';

interface CardProps {
  code: string;
  theme: Theme;
  fontFamily: string;
  lineHeight: number;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { code, theme, fontFamily, lineHeight },
  ref
) {
  const { colors } = theme;

  const lines = useMemo(() => {
    const split = code.split('\n');
    if (split.length === 1 && split[0] === '') {
      return [''];
    }
    return split;
  }, [code]);

  const tokenizedLines = useMemo(() => {
    return lines.map((line) => tokenizeLine(line));
  }, [lines]);

  const lineCountWidth = String(lines.length).length;

  return (
    <div
      ref={ref}
      style={{
        minWidth: 600,
        maxWidth: 1200,
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
        transition: 'background-color 0.4s ease, color 0.4s ease',
        backgroundColor: colors.background,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          backgroundColor: colors.headerBackground,
          transition: 'background-color 0.4s ease',
          borderBottom: `1px solid ${colors.accent}20`,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 8,
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#FF5F56',
            }}
          />
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#FFBD2E',
            }}
          />
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#27C93F',
            }}
          />
        </div>
        <div
          style={{
            marginLeft: 16,
            padding: '4px 12px',
            borderRadius: 6,
            fontSize: 12,
            color: colors.text,
            opacity: 0.6,
            fontFamily,
            letterSpacing: 0.5,
          }}
        >
          code.tsx
        </div>
      </div>

      <div
        style={{
          overflowX: 'auto',
          padding: '16px 0',
        }}
      >
        <table
          style={{
            borderCollapse: 'collapse',
            width: '100%',
            fontFamily,
            fontSize: 14,
            lineHeight,
          }}
        >
          <tbody>
            {tokenizedLines.map((tokens, idx) => (
              <tr key={idx}>
                <td
                  style={{
                    padding: '0 16px',
                    textAlign: 'right',
                    verticalAlign: 'top',
                    color: colors.lineNumber,
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    fontFamily,
                    fontSize: 12,
                    fontWeight: 500,
                    width: `${lineCountWidth + 3}ch`,
                    minWidth: `${lineCountWidth + 3}ch`,
                    verticalAlign: 'top',
                    paddingRight: 16,
                  }}
                >
                  {idx + 1}
                </td>
                <td
                  style={{
                    whiteSpace: 'pre',
                    color: colors.text,
                    paddingRight: 24,
                    minWidth: '100%',
                    verticalAlign: 'top',
                  }}
                >
                  {tokens.length === 0 ? (
                    <span>&nbsp;</span>
                  ) : (
                    tokens.map((token, tIdx) => (
                      <span
                        key={tIdx}
                        style={{
                          color: getTokenColor(token.type, colors),
                          transition: 'color 0.4s ease',
                          whiteSpace: 'pre',
                        }}
                      >
                        {token.value}
                      </span>
                    ))
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

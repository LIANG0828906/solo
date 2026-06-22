import React from 'react';
import { calculateContrastRatio, suggestAdjustedColor } from '../utils/contrastCalculator';

interface DetailPanelProps {
  fgHex: string;
  bgHex: string;
}

function CheckIcon({ pass }: { pass: boolean }) {
  const color = pass ? '#22C55E' : '#EF4444';
  const size = 20;
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      {pass ? (
        <circle cx="10" cy="10" r="10" fill={color} opacity="0.15" />
      ) : (
        <circle cx="10" cy="10" r="10" fill={color} opacity="0.15" />
      )}
      {pass ? (
        <path
          d="M6 10.5L8.5 13L14 7.5"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M7 7L13 13M13 7L7 13"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

const DetailPanel: React.FC<DetailPanelProps> = ({ fgHex, bgHex }) => {
  const ratio = calculateContrastRatio(fgHex, bgHex);
  const aaNormal = ratio >= 4.5;
  const aaLarge = ratio >= 3.0;
  const aaaNormal = ratio >= 7.0;
  const aaaLarge = ratio >= 4.5;

  const suggestions = [];
  if (!aaNormal) {
    const s = suggestAdjustedColor(fgHex, bgHex, 4.5);
    suggestions.push({ label: 'AA 正常文本 (4.5:1)', ...s });
  }
  if (!aaLarge) {
    const s = suggestAdjustedColor(fgHex, bgHex, 3.0);
    suggestions.push({ label: 'AA 大文本 (3:1)', ...s });
  }
  if (!aaaNormal) {
    const s = suggestAdjustedColor(fgHex, bgHex, 7.0);
    suggestions.push({ label: 'AAA 正常文本 (7:1)', ...s });
  }
  if (!aaaLarge) {
    const s = suggestAdjustedColor(fgHex, bgHex, 4.5);
    suggestions.push({ label: 'AAA 大文本 (4.5:1)', ...s });
  }

  const uniqueSuggestions = suggestions.filter(
    (s, i, arr) => arr.findIndex((x) => x.label === s.label) === i
  );

  return (
    <div
      style={{
        padding: 20,
        height: '100%',
        overflowY: 'auto',
        boxSizing: 'border-box',
      }}
    >
      <h3 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 600, color: '#E0E0F0' }}>
        对比详情
      </h3>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0,
          marginBottom: 20,
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '12px 0 0 12px',
            background: fgHex,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 600,
            color: bgHex,
          }}
        >
          Aa
        </div>
        <div
          style={{
            width: 2,
            height: 80,
            background: '#3B3B55',
          }}
        />
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '0 12px 12px 0',
            background: bgHex,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 600,
            color: fgHex,
          }}
        >
          Aa
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 6,
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: 12, color: '#8888A0' }}>前景 {fgHex}</span>
        <span style={{ fontSize: 12, color: '#8888A0' }}>|</span>
        <span style={{ fontSize: 12, color: '#8888A0' }}>背景 {bgHex}</span>
      </div>

      <div
        style={{
          textAlign: 'center',
          fontSize: 28,
          fontWeight: 700,
          color: '#E0E0F0',
          marginBottom: 20,
        }}
      >
        {ratio.toFixed(1)} : 1
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 12px',
            background: '#1E1E2E',
            borderRadius: 8,
          }}
        >
          <CheckIcon pass={aaNormal} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: '#E0E0F0', fontWeight: 500 }}>AA 正常文本</div>
            <div style={{ fontSize: 11, color: '#8888A0' }}>≥ 4.5:1</div>
          </div>
          <span style={{ fontSize: 12, color: aaNormal ? '#22C55E' : '#EF4444', fontWeight: 600 }}>
            {aaNormal ? '通过' : '未通过'}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 12px',
            background: '#1E1E2E',
            borderRadius: 8,
          }}
        >
          <CheckIcon pass={aaLarge} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: '#E0E0F0', fontWeight: 500 }}>AA 大文本</div>
            <div style={{ fontSize: 11, color: '#8888A0' }}>≥ 3:1</div>
          </div>
          <span style={{ fontSize: 12, color: aaLarge ? '#22C55E' : '#EF4444', fontWeight: 600 }}>
            {aaLarge ? '通过' : '未通过'}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 12px',
            background: '#1E1E2E',
            borderRadius: 8,
          }}
        >
          <CheckIcon pass={aaaNormal} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: '#E0E0F0', fontWeight: 500 }}>AAA 正常文本</div>
            <div style={{ fontSize: 11, color: '#8888A0' }}>≥ 7:1</div>
          </div>
          <span style={{ fontSize: 12, color: aaaNormal ? '#22C55E' : '#EF4444', fontWeight: 600 }}>
            {aaaNormal ? '通过' : '未通过'}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 12px',
            background: '#1E1E2E',
            borderRadius: 8,
          }}
        >
          <CheckIcon pass={aaaLarge} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: '#E0E0F0', fontWeight: 500 }}>AAA 大文本</div>
            <div style={{ fontSize: 11, color: '#8888A0' }}>≥ 4.5:1</div>
          </div>
          <span style={{ fontSize: 12, color: aaaLarge ? '#22C55E' : '#EF4444', fontWeight: 600 }}>
            {aaaLarge ? '通过' : '未通过'}
          </span>
        </div>
      </div>

      {uniqueSuggestions.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: '#E0E0F0' }}>
            调整建议
          </h4>
          {uniqueSuggestions.map((s, i) => (
            <div
              key={i}
              style={{
                padding: '10px 12px',
                background: '#1E1E2E',
                borderRadius: 8,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: '#8888A0',
                  marginBottom: 4,
                }}
              >
                {s.label}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    background: s.hex,
                    border: '1px solid #3B3B55',
                  }}
                />
                <span style={{ fontSize: 13, color: '#E0E0F0', fontFamily: 'monospace' }}>
                  {s.hex}
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#A0A0C0', lineHeight: 1.5 }}>{s.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DetailPanel;

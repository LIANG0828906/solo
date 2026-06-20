import type { MatchResult } from '../types';

interface KeywordComparisonProps {
  result: Pick<MatchResult, 'matchedKeywords' | 'missingKeywords'>;
}

export function KeywordComparison({ result }: KeywordComparisonProps) {
  return (
    <div className="keywords-wrap">
      <div className="keywords-box matched">
        <h4>
          <span>✓</span> 已命中关键词
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 12,
              fontWeight: 400,
              color: '#90a4ae'
            }}
          >
            {result.matchedKeywords.length} 个
          </span>
        </h4>
        <div className="keywords-tags">
          {result.matchedKeywords.length === 0 && (
            <span
              style={{
                fontSize: 12,
                color: '#90a4ae',
                padding: '4px 0'
              }}
            >
              未命中任何岗位关键词，建议补充相关技能描述
            </span>
          )}
          {result.matchedKeywords.map((kw) => (
            <span key={kw} className="kw-tag matched">
              {kw}
            </span>
          ))}
        </div>
      </div>

      <div className="keywords-box missing">
        <h4>
          <span>✕</span> 缺失关键词
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 12,
              fontWeight: 400,
              color: '#90a4ae'
            }}
          >
            {result.missingKeywords.length} 个 · 建议重点补齐
          </span>
        </h4>
        <div className="keywords-tags">
          {result.missingKeywords.length === 0 && (
            <span
              style={{
                fontSize: 12,
                color: '#90a4ae',
                padding: '4px 0'
              }}
            >
              太棒了！覆盖了该岗位全部核心关键词
            </span>
          )}
          {result.missingKeywords.map((kw) => (
            <span key={kw} className="kw-tag missing">
              {kw}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default KeywordComparison;

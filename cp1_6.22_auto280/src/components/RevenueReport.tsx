import { useState, useMemo, useCallback } from 'react';
import { Contract, SongSummary } from '../types';
import {
  calculateRevenueReport,
  formatCurrency,
  formatNumber,
  generateReportCSV,
  downloadCSV,
} from '../utils/revenueCalculator';

interface RevenueReportProps {
  contracts: Contract[];
  playCountWeight: number;
  durationWeight: number;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function ExportButton({
  onClick,
}: {
  onClick: () => void;
}) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: 'rgba(108, 99, 255, 0.15)',
        border: '1px solid rgba(108, 99, 255, 0.3)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s ease',
        transform: isPressed ? 'scale(0.92)' : 'scale(1)',
        opacity: isPressed ? 0.8 : 1,
      }}
      title="导出该歌曲数据"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#6C63FF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    </button>
  );
}

function RevenueReport({
  contracts,
  playCountWeight,
  durationWeight,
}: RevenueReportProps) {
  const [reportData, setReportData] = useState<SongSummary[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateTime, setGenerateTime] = useState<number | null>(null);

  const handleGenerateReport = useCallback(() => {
    setIsGenerating(true);

    const startTime = performance.now();

    requestAnimationFrame(() => {
      const data = calculateRevenueReport(
        contracts,
        playCountWeight,
        durationWeight
      );
      const endTime = performance.now();
      const elapsed = endTime - startTime;

      setReportData(data);
      setHasGenerated(true);
      setGenerateTime(elapsed);
      setIsGenerating(false);
    });
  }, [contracts, playCountWeight, durationWeight]);

  const handleExportAll = () => {
    if (reportData.length === 0) return;
    const csv = generateReportCSV(reportData);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCSV(csv, `版税报表_${dateStr}.csv`);
  };

  const handleExportSingle = (summary: SongSummary) => {
    const headers = ['歌曲名称', '版税总收入(元)', '总播放次数', '总时长(秒)', '演出场次'];
    const rows = [
      [
        summary.songName,
        summary.totalRevenue.toFixed(2),
        summary.totalPlayCount.toString(),
        summary.totalDuration.toString(),
        summary.performanceCount.toString(),
      ],
    ];

    const csvContent =
      '\uFEFF' +
      [headers, ...rows]
        .map((row) =>
          row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
        )
        .join('\n');

    downloadCSV(csvContent, `${summary.songName}_版税明细.csv`);
  };

  const totals = useMemo(() => {
    return reportData.reduce(
      (acc, item) => ({
        revenue: acc.revenue + item.totalRevenue,
        playCount: acc.playCount + item.totalPlayCount,
        duration: acc.duration + item.totalDuration,
        performances: acc.performances + item.performanceCount,
      }),
      { revenue: 0, playCount: 0, duration: 0, performances: 0 }
    );
  }, [reportData]);

  const [buttonPressed, setButtonPressed] = useState(false);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#FFFFFF',
            marginBottom: 8,
          }}
        >
          版税收入报表
        </h1>
        <p style={{ fontSize: 14, color: '#808098', marginBottom: 24 }}>
          按歌曲汇总所有巡演场次的版税收入、播放次数和演出数据
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button
            onClick={handleGenerateReport}
            onMouseDown={() => setButtonPressed(true)}
            onMouseUp={() => setButtonPressed(false)}
            onMouseLeave={() => setButtonPressed(false)}
            disabled={isGenerating || contracts.length === 0}
            style={{
              backgroundColor: buttonPressed ? '#5A52D5' : '#6C63FF',
              color: '#FFFFFF',
              borderRadius: 8,
              padding: '12px 24px',
              border: 'none',
              fontSize: 14,
              fontWeight: 600,
              cursor: isGenerating || contracts.length === 0 ? 'not-allowed' : 'pointer',
              opacity: isGenerating || contracts.length === 0 ? 0.6 : 1,
              transform: buttonPressed ? 'scale(0.95)' : 'scale(1)',
              transition: 'all 0.12s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: buttonPressed
                ? '0 2px 8px rgba(108, 99, 255, 0.3)'
                : '0 4px 16px rgba(108, 99, 255, 0.4)',
            }}
          >
            {isGenerating ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                生成中...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                生成报表
              </>
            )}
          </button>

          {hasGenerated && reportData.length > 0 && (
            <>
              <button
                onClick={handleExportAll}
                style={{
                  backgroundColor: 'rgba(78, 205, 196, 0.15)',
                  color: '#4ECDC4',
                  borderRadius: 8,
                  padding: '12px 24px',
                  border: '1px solid rgba(78, 205, 196, 0.3)',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    'rgba(78, 205, 196, 0.25)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    'rgba(78, 205, 196, 0.15)';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                导出全部 (CSV)
              </button>

              <div
                style={{
                  fontSize: 12,
                  color: '#606078',
                  marginLeft: 8,
                }}
              >
                {reportData.length} 首歌曲 · 生成耗时 {generateTime?.toFixed(1)}ms
              </div>
            </>
          )}
        </div>
      </div>

      {hasGenerated && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginBottom: 28,
          }}
        >
          {[
            {
              label: '版税总收入',
              value: formatCurrency(totals.revenue),
              color: '#6C63FF',
              bg: 'rgba(108, 99, 255, 0.1)',
              border: '1px solid rgba(108, 99, 255, 0.2)',
            },
            {
              label: '总播放次数',
              value: formatNumber(totals.playCount),
              color: '#FF6B6B',
              bg: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid rgba(255, 107, 107, 0.2)',
            },
            {
              label: '总播放时长',
              value: formatDuration(totals.duration),
              color: '#4ECDC4',
              bg: 'rgba(78, 205, 196, 0.1)',
              border: '1px solid rgba(78, 205, 196, 0.2)',
            },
            {
              label: '歌曲数/演出场次',
              value: `${reportData.length} / ${totals.performances}`,
              color: '#FFB84D',
              bg: 'rgba(255, 184, 77, 0.1)',
              border: '1px solid rgba(255, 184, 77, 0.2)',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                borderRadius: 12,
                padding: '16px 20px',
                background: stat.bg,
                border: stat.border,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: '#808098',
                  marginBottom: 6,
                }}
              >
                {stat.label}
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: stat.color,
                }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {!hasGenerated ? (
        <div
          style={{
            background: 'linear-gradient(145deg, #1E1E2E 0%, #2B2B3D 100%)',
            borderRadius: 16,
            border: '1px solid #3A3A50',
            padding: '80px 40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: 'rgba(108, 99, 255, 0.1)',
              border: '1px solid rgba(108, 99, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#FFFFFF', marginBottom: 8 }}>
            点击上方「生成报表」按钮
          </h3>
          <p style={{ fontSize: 14, color: '#808098', maxWidth: 420 }}>
            系统将根据当前权重设置（播放次数 {(playCountWeight * 100).toFixed(0)}% + 时长 {(durationWeight * 100).toFixed(0)}%）汇总所有 {contracts.length} 场巡演数据
          </p>
        </div>
      ) : reportData.length === 0 ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '40vh',
            color: '#606078',
            fontSize: 16,
          }}
        >
          暂无数据
        </div>
      ) : (
        <div
          style={{
            background: 'linear-gradient(145deg, #1E1E2E 0%, #2B2B3D 100%)',
            borderRadius: 16,
            border: '1px solid #3A3A50',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 16,
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#2D2D44' }}>
                  <th
                    style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      color: '#E0E0E0',
                      fontWeight: 600,
                      fontSize: 14,
                      borderBottom: '1px solid #3A3A50',
                    }}
                  >
                    排名
                  </th>
                  <th
                    style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      color: '#E0E0E0',
                      fontWeight: 600,
                      fontSize: 14,
                      borderBottom: '1px solid #3A3A50',
                    }}
                  >
                    歌曲名称
                  </th>
                  <th
                    style={{
                      padding: '16px 20px',
                      textAlign: 'right',
                      color: '#E0E0E0',
                      fontWeight: 600,
                      fontSize: 14,
                      borderBottom: '1px solid #3A3A50',
                    }}
                  >
                    版税总收入
                  </th>
                  <th
                    style={{
                      padding: '16px 20px',
                      textAlign: 'right',
                      color: '#E0E0E0',
                      fontWeight: 600,
                      fontSize: 14,
                      borderBottom: '1px solid #3A3A50',
                    }}
                  >
                    占比
                  </th>
                  <th
                    style={{
                      padding: '16px 20px',
                      textAlign: 'right',
                      color: '#E0E0E0',
                      fontWeight: 600,
                      fontSize: 14,
                      borderBottom: '1px solid #3A3A50',
                    }}
                  >
                    总播放次数
                  </th>
                  <th
                    style={{
                      padding: '16px 20px',
                      textAlign: 'right',
                      color: '#E0E0E0',
                      fontWeight: 600,
                      fontSize: 14,
                      borderBottom: '1px solid #3A3A50',
                    }}
                  >
                    总时长
                  </th>
                  <th
                    style={{
                      padding: '16px 20px',
                      textAlign: 'right',
                      color: '#E0E0E0',
                      fontWeight: 600,
                      fontSize: 14,
                      borderBottom: '1px solid #3A3A50',
                    }}
                  >
                    演出场次
                  </th>
                  <th
                    style={{
                      padding: '16px 20px',
                      textAlign: 'center',
                      color: '#E0E0E0',
                      fontWeight: 600,
                      fontSize: 14,
                      borderBottom: '1px solid #3A3A50',
                      width: 80,
                    }}
                  >
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((item, index) => {
                  const percentage =
                    totals.revenue > 0
                      ? (item.totalRevenue / totals.revenue) * 100
                      : 0;
                  const isEven = index % 2 === 0;
                  const rankColor =
                    index === 0
                      ? '#FFD700'
                      : index === 1
                      ? '#C0C0C0'
                      : index === 2
                      ? '#CD7F32'
                      : '#808098';
                  return (
                    <tr
                      key={item.songId}
                      style={{
                        backgroundColor: isEven ? '#1E1E2E' : '#25253A',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                          'rgba(108, 99, 255, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                          isEven ? '#1E1E2E' : '#25253A';
                      }}
                    >
                      <td
                        style={{
                          padding: '14px 20px',
                          fontSize: 14,
                          color: rankColor,
                          fontWeight: index < 3 ? 700 : 400,
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        }}
                      >
                        {index < 3 ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 26,
                              height: 26,
                              borderRadius: '50%',
                              backgroundColor: `${rankColor}20`,
                              fontSize: 13,
                            }}
                          >
                            {index + 1}
                          </span>
                        ) : (
                          index + 1
                        )}
                      </td>
                      <td
                        style={{
                          padding: '14px 20px',
                          fontSize: 15,
                          color: '#FFFFFF',
                          fontWeight: 500,
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        }}
                      >
                        {item.songName}
                      </td>
                      <td
                        style={{
                          padding: '14px 20px',
                          fontSize: 15,
                          color: '#6C63FF',
                          fontWeight: 600,
                          textAlign: 'right',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          fontFamily:
                            '-apple-system, BlinkMacSystemFont, monospace',
                        }}
                      >
                        {formatCurrency(item.totalRevenue)}
                      </td>
                      <td
                        style={{
                          padding: '14px 20px',
                          textAlign: 'right',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          width: 180,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            justifyContent: 'flex-end',
                          }}
                        >
                          <div
                            style={{
                              flex: 1,
                              maxWidth: 100,
                              height: 6,
                              backgroundColor: 'rgba(255, 255, 255, 0.06)',
                              borderRadius: 3,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${Math.min(percentage, 100)}%`,
                                background:
                                  'linear-gradient(90deg, #6C63FF, #4ECDC4)',
                                borderRadius: 3,
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: 13,
                              color: '#B0B0C0',
                              fontWeight: 500,
                              minWidth: 48,
                            }}
                          >
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '14px 20px',
                          fontSize: 14,
                          color: '#E0E0E0',
                          textAlign: 'right',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          fontFamily:
                            '-apple-system, BlinkMacSystemFont, monospace',
                        }}
                      >
                        {formatNumber(item.totalPlayCount)}
                      </td>
                      <td
                        style={{
                          padding: '14px 20px',
                          fontSize: 14,
                          color: '#E0E0E0',
                          textAlign: 'right',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          fontFamily:
                            '-apple-system, BlinkMacSystemFont, monospace',
                        }}
                      >
                        {formatDuration(item.totalDuration)}
                      </td>
                      <td
                        style={{
                          padding: '14px 20px',
                          fontSize: 14,
                          color: '#E0E0E0',
                          textAlign: 'right',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          fontFamily:
                            '-apple-system, BlinkMacSystemFont, monospace',
                        }}
                      >
                        {item.performanceCount}
                      </td>
                      <td
                        style={{
                          padding: '14px 20px',
                          textAlign: 'center',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                          }}
                        >
                          <ExportButton
                            onClick={() => handleExportSingle(item)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr
                  style={{
                    backgroundColor: '#2D2D44',
                  }}
                >
                  <td
                    style={{
                      padding: '16px 20px',
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#FFFFFF',
                      borderTop: '2px solid #3A3A50',
                    }}
                    colSpan={2}
                  >
                    合计
                  </td>
                  <td
                    style={{
                      padding: '16px 20px',
                      fontSize: 15,
                      fontWeight: 700,
                      color: '#6C63FF',
                      textAlign: 'right',
                      borderTop: '2px solid #3A3A50',
                      fontFamily:
                        '-apple-system, BlinkMacSystemFont, monospace',
                    }}
                  >
                    {formatCurrency(totals.revenue)}
                  </td>
                  <td
                    style={{
                      padding: '16px 20px',
                      textAlign: 'right',
                      borderTop: '2px solid #3A3A50',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color: '#FFFFFF',
                        fontWeight: 600,
                      }}
                    >
                      100.0%
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '16px 20px',
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#FFFFFF',
                      textAlign: 'right',
                      borderTop: '2px solid #3A3A50',
                      fontFamily:
                        '-apple-system, BlinkMacSystemFont, monospace',
                    }}
                  >
                    {formatNumber(totals.playCount)}
                  </td>
                  <td
                    style={{
                      padding: '16px 20px',
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#FFFFFF',
                      textAlign: 'right',
                      borderTop: '2px solid #3A3A50',
                      fontFamily:
                        '-apple-system, BlinkMacSystemFont, monospace',
                    }}
                  >
                    {formatDuration(totals.duration)}
                  </td>
                  <td
                    style={{
                      padding: '16px 20px',
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#FFFFFF',
                      textAlign: 'right',
                      borderTop: '2px solid #3A3A50',
                      fontFamily:
                        '-apple-system, BlinkMacSystemFont, monospace',
                    }}
                  >
                    {totals.performances}
                  </td>
                  <td
                    style={{
                      padding: '16px 20px',
                      textAlign: 'center',
                      borderTop: '2px solid #3A3A50',
                    }}
                  />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default RevenueReport;

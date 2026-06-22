import React, { useRef } from 'react';
import { Upload, Select, Button, message } from 'antd';
import type { UploadProps } from 'antd';
import {
  UploadOutlined,
  DatabaseOutlined,
  PlusOutlined,
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  CloseOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { DataRow, ChartType } from '../types';

interface DataPanelProps {
  open: boolean;
  onClose: () => void;
  data: DataRow[];
  columns: string[];
  labelColumn: string;
  valueColumn: string;
  onDataChange: (rows: DataRow[], columns: string[]) => void;
  onLabelColumnChange: (col: string) => void;
  onValueColumnChange: (col: string) => void;
}

const parseCSV = (text: string): { rows: DataRow[]; columns: string[] } => {
  const lines = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return { rows: [], columns: [] };

  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQuote) {
        if (c === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (c === '"') {
          inQuote = false;
        } else {
          cur += c;
        }
      } else if (c === '"') {
        inQuote = true;
      } else if (c === ',') {
        out.push(cur);
        cur = '';
      } else {
        cur += c;
      }
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };

  const header = parseLine(lines[0]);
  const columns = header.map((h, i) => (h && h.length > 0 ? h : `列${i + 1}`));
  const rows: DataRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseLine(lines[i]);
    const row: DataRow = {};
    columns.forEach((col, idx) => {
      const raw = vals[idx] ?? '';
      if (raw !== '' && !isNaN(Number(raw)) && isFinite(Number(raw))) {
        row[col] = Number(raw);
      } else {
        row[col] = raw;
      }
    });
    rows.push(row);
  }
  return { rows, columns };
};

const CHART_TYPE_ICONS: Record<ChartType, React.ReactNode> = {
  line: <LineChartOutlined />,
  bar: <BarChartOutlined />,
  pie: <PieChartOutlined />,
};

const CHART_TYPE_LABELS: Record<ChartType, string> = {
  line: '折线图',
  bar: '柱状图',
  pie: '饼图',
};

const DataPanel: React.FC<DataPanelProps> = ({
  open,
  onClose,
  data,
  columns,
  labelColumn,
  valueColumn,
  onDataChange,
  onLabelColumnChange,
  onValueColumnChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadProps: UploadProps = {
    accept: '.csv,text/csv',
    showUploadList: false,
    beforeUpload: (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = String(e.target?.result ?? '');
          const { rows, columns: cols } = parseCSV(text);
          if (cols.length === 0) {
            message.error('CSV文件为空或格式不正确');
            return;
          }
          onDataChange(rows, cols);
          message.success(`已导入 ${rows.length} 行数据，共 ${cols.length} 列`);
        } catch {
          message.error('CSV文件解析失败');
        }
      };
      reader.readAsText(file, 'UTF-8');
      return false;
    },
  };

  const handleAddRow = () => {
    const row: DataRow = {};
    columns.forEach((col) => {
      row[col] = '';
    });
    onDataChange([...data, row], columns);
  };

  const handleDeleteRow = (idx: number) => {
    const next = data.filter((_, i) => i !== idx);
    onDataChange(next, columns);
  };

  const handleCellChange = (rowIdx: number, col: string, value: string) => {
    const next = data.map((row, idx) => {
      if (idx !== rowIdx) return row;
      const newRow = { ...row };
      if (value !== '' && !isNaN(Number(value)) && isFinite(Number(value))) {
        newRow[col] = Number(value);
      } else {
        newRow[col] = value;
      }
      return newRow;
    });
    onDataChange(next, columns);
  };

  const handleResetToSample = () => {
    const cols = ['标签', '数值'];
    const sample: DataRow[] = [
      { 标签: '一月', 数值: 120 },
      { 标签: '二月', 数值: 182 },
      { 标签: '三月', 数值: 149 },
      { 标签: '四月', 数值: 210 },
      { 标签: '五月', 数值: 175 },
      { 标签: '六月', 数值: 268 },
      { 标签: '七月', 数值: 312 },
      { 标签: '八月', 数值: 285 },
      { 标签: '九月', 数值: 236 },
      { 标签: '十月', 数值: 304 },
      { 标签: '十一月', 数值: 267 },
      { 标签: '十二月', 数值: 345 },
    ];
    onDataChange(sample, cols);
    message.info('已加载示例数据');
  };

  return (
    <aside className={`drawer-panel ${open ? '' : 'collapsed'}`}>
      <div className="panel-header">
        <div className="panel-title">
          <DatabaseOutlined />
          数据面板
        </div>
        <button type="button" className="btn-icon" onClick={onClose} aria-label="关闭面板">
          <CloseOutlined />
        </button>
      </div>
      <div className="panel-body">
        <div className="field-group">
          <div className="field-label">上传CSV文件</div>
          <Upload {...uploadProps}>
            <div className="upload-zone">
              <div className="upload-icon"><UploadOutlined /></div>
              <div className="upload-title">点击或拖拽CSV到此处</div>
              <div className="upload-hint">首行需包含列名，逗号分隔</div>
            </div>
          </Upload>
        </div>

        <div className="field-group">
          <div className="field-label">列映射</div>
          <Select
            value={labelColumn}
            onChange={onLabelColumnChange}
            options={columns.map((c) => ({ value: c, label: c }))}
            placeholder="选择标签列"
            style={{ width: '100%' }}
            size="small"
          />
          <Select
            value={valueColumn}
            onChange={onValueColumnChange}
            options={columns.map((c) => ({ value: c, label: c }))}
            placeholder="选择数值列"
            style={{ width: '100%' }}
            size="small"
          />
        </div>

        <div className="field-group">
          <div className="field-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>数据预览 ({data.length} 行)</span>
            <Button type="link" size="small" icon={<FileTextOutlined />} onClick={handleResetToSample} style={{ padding: 0, height: 'auto' }}>
              示例数据
            </Button>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  {columns.length === 0 && <th style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>暂无数据</th>}
                  {columns.map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                  {columns.length > 0 && <th className="col-actions">#</th>}
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx}>
                    {columns.map((col) => (
                      <td key={col}>
                        <input
                          value={row[col] === undefined || row[col] === null ? '' : String(row[col])}
                          onChange={(e) => handleCellChange(idx, col, e.target.value)}
                          placeholder="请输入"
                        />
                      </td>
                    ))}
                    {columns.length > 0 && (
                      <td className="col-actions">
                        <button
                          type="button"
                          className="btn-delete"
                          onClick={() => handleDeleteRow(idx)}
                          aria-label="删除行"
                        >
                          <DeleteOutlined />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className="btn-add-row" onClick={handleAddRow}>
            <PlusOutlined /> 添加一行
          </button>
        </div>

        <div className="field-group">
          <div className="field-label">图表类型说明</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(Object.keys(CHART_TYPE_LABELS) as ChartType[]).map((t) => (
              <div
                key={t}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '7px 10px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid var(--border-color)',
                  fontSize: 12,
                }}
              >
                <span style={{ color: 'var(--accent)' }}>{CHART_TYPE_ICONS[t]}</span>
                <span style={{ fontWeight: 500 }}>{CHART_TYPE_LABELS[t]}</span>
                <span style={{ color: 'var(--text-tertiary)', fontSize: 11, marginLeft: 'auto' }}>
                  {t === 'line' && '趋势变化'}
                  {t === 'bar' && '对比分析'}
                  {t === 'pie' && '占比分布'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }} />
      </div>
    </aside>
  );
};

export default DataPanel;

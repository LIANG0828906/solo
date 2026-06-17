import React, { useState, useMemo, useEffect } from 'react';
import { Table, DatePicker, Select, Button, Progress } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { Stats, Task } from '../types';
import { useTaskStore } from '../store/useTaskStore';

const { RangePicker } = DatePicker;
const { Option } = Select;

const getOvertimeColor = (ratio: number): string => {
  if (ratio < 0.1) return '#52C41A';
  if (ratio < 0.3) return '#FAAD14';
  return '#FF4D4F';
};

const getStatusText = (status: Task['status']): string => {
  const map = {
    todo: '待办',
    'in-progress': '进行中',
    done: '完成',
  };
  return map[status];
};

const getStatusColor = (status: Task['status']): string => {
  const map = {
    todo: '#FAAD14',
    'in-progress': '#52C41A',
    done: '#1890FF',
  };
  return map[status];
};

interface ExpandedRowProps {
  tasks: Task[];
}

const ExpandedRow: React.FC<ExpandedRowProps> = ({ tasks }) => {
  const innerColumns: ColumnsType<Task> = [
    {
      title: '任务标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <span style={{ fontSize: 13 }}>{text}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: Task['status']) => (
        <span
          style={{
            fontSize: 12,
            padding: '2px 8px',
            borderRadius: 4,
            backgroundColor: `${getStatusColor(status)}20`,
            color: getStatusColor(status),
          }}
        >
          {getStatusText(status)}
        </span>
      ),
    },
    {
      title: '预估工时',
      dataIndex: 'estimatedHours',
      key: 'estimatedHours',
      width: 80,
      render: (val: number) => `${val}h`,
    },
    {
      title: '实际工时',
      dataIndex: 'actualHours',
      key: 'actualHours',
      width: 80,
      render: (val: number) => `${val}h`,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD'),
    },
  ];

  return (
    <Table
      columns={innerColumns}
      dataSource={tasks}
      rowKey="id"
      pagination={false}
      size="small"
      showHeader={false}
    />
  );
};

export const StatsPanel: React.FC = () => {
  const stats = useTaskStore((state) => state.stats);
  const tasks = useTaskStore((state) => state.tasks);
  const fetchStats = useTaskStore((state) => state.fetchStats);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<string | undefined>(undefined);
  const [isSearching, setIsSearching] = useState(false);

  const uniqueAssignees = useMemo(() => {
    const assignees = new Set(tasks.map((t) => t.assignee));
    return Array.from(assignees);
  }, [tasks]);

  useEffect(() => {
    const now = dayjs();
    const startOfWeek = now.startOf('week');
    const endOfWeek = now.endOf('week');
    setDateRange([startOfWeek, endOfWeek]);
    fetchStats({
      startDate: startOfWeek.format('YYYY-MM-DD'),
      endDate: endOfWeek.format('YYYY-MM-DD'),
    });
  }, [fetchStats]);

  const handleSearch = () => {
    setIsSearching(true);
    const params = {
      startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
      endDate: dateRange?.[1]?.format('YYYY-MM-DD'),
      person: selectedPerson,
    };
    fetchStats(params).finally(() => setIsSearching(false));
  };

  const handleWeekSelect = () => {
    const now = dayjs();
    setDateRange([now.startOf('week'), now.endOf('week')]);
  };

  const handleMonthSelect = () => {
    const now = dayjs();
    setDateRange([now.startOf('month'), now.endOf('month')]);
  };

  const columns: ColumnsType<Stats> = [
    {
      title: '姓名',
      dataIndex: 'person',
      key: 'person',
      width: 80,
      render: (text: string) => (
        <span style={{ fontWeight: 500 }}>{text}</span>
      ),
    },
    {
      title: '任务数',
      dataIndex: 'taskCount',
      key: 'taskCount',
      width: 60,
      align: 'center',
    },
    {
      title: '总预估工时',
      dataIndex: 'totalEstimatedHours',
      key: 'totalEstimatedHours',
      width: 90,
      align: 'center',
      render: (val: number) => `${val}h`,
    },
    {
      title: '总实际工时',
      dataIndex: 'totalActualHours',
      key: 'totalActualHours',
      width: 90,
      align: 'center',
      render: (val: number) => `${val}h`,
    },
    {
      title: '工时超支比例',
      key: 'overtimeRatio',
      width: 140,
      render: (_: unknown, record: Stats) => {
        const ratio = record.totalEstimatedHours > 0
          ? record.totalActualHours / record.totalEstimatedHours - 1
          : 0;
        const percent = Math.max(0, Math.min(ratio * 100, 100));
        const color = getOvertimeColor(Math.abs(ratio));

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Progress
              percent={percent}
              showInfo={false}
              strokeColor={color}
              size="small"
              style={{ flex: 1, minWidth: 60 }}
            />
            <span style={{ fontSize: 12, color: '#595959' }}>
              {(ratio * 100).toFixed(1)}%
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <div
      style={{
        height: '100%',
        backgroundColor: '#FFFFFF',
        borderLeft: '4px solid #1890FF',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #E8E8E8',
        }}
      >
        <h3
          style={{
            margin: '0 0 16px 0',
            fontSize: 18,
            fontWeight: 600,
            color: '#262626',
          }}
        >
          工时统计
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button size="small" onClick={handleWeekSelect}>
              本周
            </Button>
            <Button size="small" onClick={handleMonthSelect}>
              本月
            </Button>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <RangePicker
              size="small"
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
              style={{ flex: 1, minWidth: 180 }}
            />
            <Select
              size="small"
              placeholder="选择人员"
              value={selectedPerson}
              onChange={setSelectedPerson}
              allowClear
              style={{ width: 100 }}
            >
              {uniqueAssignees.map((name) => (
                <Option key={name} value={name}>
                  {name}
                </Option>
              ))}
            </Select>
            <Button
              type="primary"
              size="small"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              loading={isSearching}
              style={{ backgroundColor: '#1890FF' }}
            >
              搜索
            </Button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <Table
          columns={columns}
          dataSource={stats}
          rowKey="person"
          pagination={false}
          size="middle"
          expandable={{
            expandedRowRender: (record) => <ExpandedRow tasks={record.tasks} />,
            rowExpandable: (record) => record.tasks.length > 0,
          }}
          onRow={() => ({
            style: {
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
            },
            onMouseEnter: (e) => {
              (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#F0F5FF';
            },
            onMouseLeave: (e) => {
              (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '';
            },
          })}
        />
      </div>
    </div>
  );
};

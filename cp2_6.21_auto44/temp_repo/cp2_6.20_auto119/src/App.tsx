import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import {
  Layout,
  Card,
  Input,
  Button,
  List,
  Dropdown,
  Modal,
  Spin,
  message,
  Tag,
  Space,
  Typography,
  Grid,
  Drawer,
  Row,
  Col,
  Checkbox,
  Tooltip,
  Select,
  Switch,
  Empty,
} from 'antd';
import {
  CheckOutlined,
  PlusOutlined,
  MoreOutlined,
  DeleteOutlined,
  EditOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { useHabits } from './hooks/useHabits';
import { useHabitsStore } from './store/useHabitsStore';
import { getHabitColor, getHeatmapColor, getHeatmapPalette, HEATMAP_THEME_LABELS } from './utils/habitColors';
import type { MenuProps } from 'antd';
import type { Habit, HabitRecord, HeatmapDataItem, DailyStats } from './types';
import type { HeatmapTheme } from './utils/habitColors';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const CalendarHeatmap: React.FC<{
  data: HeatmapDataItem[];
  habits: { name: string; color: string }[];
  selectedHabits: string[];
  onSelectedHabitsChange: (habits: string[]) => void;
  onDateClick: (date: string, habitDetails?: Record<string, boolean>) => void;
  theme: HeatmapTheme;
  year: number;
  onYearChange: (year: number) => void;
  onThemeChange: (theme: HeatmapTheme) => void;
}> = ({ data, habits, selectedHabits, onSelectedHabitsChange, onDateClick, theme, year, onYearChange, onThemeChange }) => {
  const startDate = dayjs(`${year}-01-01`);
  const endDate = dayjs(`${year}-12-31`);
  const totalDays = endDate.diff(startDate, 'day') + 1;

  const [hoveredDay, setHoveredDay] = useState<{ item: HeatmapDataItem; x: number; y: number } | null>(null);

  const years = useMemo(() => {
    const current = dayjs().year();
    return Array.from({ length: 5 }, (_, i) => current - 4 + i);
  }, []);

  const handleCheckboxChange = (checkedValues: string[]) => {
    if (checkedValues.length === 0) {
      if (habits.length > 0) {
        onSelectedHabitsChange([habits[0].name]);
      }
      return;
    }
    if (checkedValues.length > 3) {
      message.warning('最多可选择3个习惯进行对比');
      return;
    }
    onSelectedHabitsChange(checkedValues);
  };

  const effectiveSelected = selectedHabits.length > 0 ? selectedHabits : (habits.length > 0 ? [habits[0].name] : []);

  const weeks = useMemo(() => {
    const result: (HeatmapDataItem | null)[][] = [];
    let currentWeek: (HeatmapDataItem | null)[] = [];

    const firstDayOfWeek = startDate.day();
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null);
    }

    for (let i = 0; i < totalDays; i++) {
      const date = startDate.add(i, 'day').format('YYYY-MM-DD');
      const dataItem = data.find((d) => d.date === date) || null;
      currentWeek.push(dataItem);

      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      result.push(currentWeek);
    }

    return result;
  }, [data, startDate, totalDays]);

  const monthLabels = useMemo(() => {
    const months: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, weekIndex) => {
      const firstValidDay = week.find((d) => d !== null);
      if (firstValidDay) {
        const month = dayjs(firstValidDay.date).month();
        if (month !== lastMonth) {
          months.push({ label: dayjs(firstValidDay.date).format('M月'), weekIndex });
          lastMonth = month;
        }
      }
    });
    return months;
  }, [weeks]);

  const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六'];
  const palette = getHeatmapPalette(theme);

  const buildTooltipContent = (item: HeatmapDataItem) => {
    const dateStr = dayjs(item.date).format('YYYY年M月D日');
    const lines: string[] = [dateStr];
    if (item.habitDetails && effectiveSelected.length > 0) {
      effectiveSelected.forEach((name) => {
        const done = item.habitDetails?.[name];
        const icon = done ? '✓' : '✗';
        lines.push(`${icon} ${name}`);
      });
      const completedCount = effectiveSelected.filter((n) => item.habitDetails?.[n]).length;
      lines.push(`完成 ${completedCount}/${effectiveSelected.length}`);
    } else {
      lines.push(`完成 ${item.count}/${item.total}`);
    }
    lines.push('点击编辑');
    return lines.join('\n');
  };

  return (
    <div style={{ padding: '16px 0' }}>
      <Row gutter={[12, 12]} style={{ marginBottom: '16px' }}>
        <Col xs={24} sm={12} md={6}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text style={{ fontSize: '13px', color: '#6b7280', whiteSpace: 'nowrap' }}>年份:</Text>
            <Select
              value={year}
              onChange={onYearChange}
              style={{ flex: 1 }}
              size="small"
            >
              {years.map((y) => (
                <Select.Option key={y} value={y}>{y}年</Select.Option>
              ))}
            </Select>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text style={{ fontSize: '13px', color: '#6b7280', whiteSpace: 'nowrap' }}>主题:</Text>
            <Select
              value={theme}
              onChange={onThemeChange}
              style={{ flex: 1 }}
              size="small"
            >
              {(['green', 'blue', 'red'] as HeatmapTheme[]).map((t) => (
                <Select.Option key={t} value={t}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '10px',
                        height: '10px',
                        borderRadius: '2px',
                        background: `linear-gradient(90deg, ${getHeatmapPalette(t)[1]}, ${getHeatmapPalette(t)[4]})`,
                      }}
                    />
                    {HEATMAP_THEME_LABELS[t]}
                  </span>
                </Select.Option>
              ))}
            </Select>
          </div>
        </Col>
        <Col xs={24} md={12}>
          {habits.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <Text style={{ fontSize: '13px', color: '#6b7280' }}>筛选习惯:</Text>
              <Checkbox.Group
                value={effectiveSelected}
                onChange={(vals) => handleCheckboxChange(vals as string[])}
                style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '8px' }}
              >
                {habits.map((habit) => (
                  <Checkbox key={habit.name} value={habit.name}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: habit.color,
                        }}
                      />
                      <span style={{ fontSize: '13px' }}>{habit.name}</span>
                    </span>
                  </Checkbox>
                ))}
              </Checkbox.Group>
            </div>
          )}
        </Col>
      </Row>

      {habits.length === 0 ? (
        <Empty description="暂无习惯，请先添加习惯" style={{ padding: '40px 0' }} />
      ) : (
        <div style={{ position: 'relative', overflowX: 'auto' }}>
          <div style={{ display: 'flex', marginBottom: '8px', paddingLeft: '40px', minWidth: `${40 + weeks.length * 14}px` }}>
            {monthLabels.map((month, idx) => (
              <span
                key={idx}
                style={{
                  position: 'absolute',
                  left: `${40 + month.weekIndex * 14}px`,
                  fontSize: '12px',
                  color: '#6b7280',
                }}
              >
                {month.label}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', marginTop: '20px', minWidth: `${40 + weeks.length * 14}px` }}>
            <div style={{ width: '30px', flexShrink: 0 }}>
              {weekdayLabels.map((day, idx) => (
                <div
                  key={idx}
                  style={{
                    height: '12px',
                    marginBottom: '2px',
                    fontSize: '10px',
                    color: '#6b7280',
                    lineHeight: '12px',
                  }}
                >
                  {idx % 2 === 1 ? day : ''}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '2px' }}>
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {week.map((day, dayIdx) => (
                    <div
                      key={dayIdx}
                      onClick={() => day && onDateClick(day.date, day.habitDetails)}
                      onMouseEnter={(e) => {
                        if (day) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredDay({ item: day, x: rect.left + rect.width / 2, y: rect.top });
                        }
                      }}
                      onMouseLeave={() => setHoveredDay(null)}
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '2px',
                        backgroundColor: day
                          ? getHeatmapColor(day.count, day.total, theme)
                          : 'transparent',
                        cursor: day ? 'pointer' : 'default',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {hoveredDay && (
            <div
              style={{
                position: 'fixed',
                left: hoveredDay.x,
                top: hoveredDay.y - 8,
                transform: 'translate(-50%, -100%)',
                backgroundColor: 'rgba(0,0,0,0.8)',
                color: '#fff',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                lineHeight: '1.6',
                whiteSpace: 'pre-line',
                zIndex: 1000,
                pointerEvents: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              {buildTooltipContent(hoveredDay.item)}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '12px', gap: '8px' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>少</Text>
        {palette.map((color, idx) => (
          <div
            key={idx}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '2px',
              backgroundColor: color,
            }}
          />
        ))}
        <Text type="secondary" style={{ fontSize: '12px' }}>多</Text>
      </div>
    </div>
  );
};

const StatsChart: React.FC<{
  dailyStats: DailyStats[];
}> = ({ dailyStats }) => {
  const maxPercentage = 100;

  return (
    <div style={{ padding: '16px 0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {dailyStats.slice(-14).map((day, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Text style={{ width: '50px', fontSize: '12px', color: '#6b7280' }}>
              {dayjs(day.date).format('MM-DD')}
            </Text>
            <div style={{ flex: 1, height: '24px', backgroundColor: '#f3f4f6', borderRadius: '12px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${day.percentage}%`,
                  maxWidth: '100%',
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                  transition: 'width 0.5s ease',
                  minWidth: day.percentage > 0 ? '8px' : '0',
                }}
              />
            </div>
            <Text style={{ width: '50px', textAlign: 'right', fontSize: '12px', fontWeight: 500 }}>
              {day.percentage.toFixed(0)}%
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
};

const HabitCard: React.FC<{
  habit: Habit;
  isCompleted: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ habit, isCompleted, onToggle, onEdit, onDelete }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const color = getHabitColor(habit.name);

  const handleToggle = () => {
    setIsAnimating(true);
    onToggle();
    setTimeout(() => setIsAnimating(false), 200);
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: '编辑',
      onClick: onEdit,
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除',
      danger: true,
      onClick: onDelete,
    },
  ];

  return (
    <div
      style={{
        position: 'relative',
        padding: '12px 16px',
        paddingLeft: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid #f3f4f6',
      }}
      className="habit-card"
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.backgroundColor = '#f9fafb';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.backgroundColor = '#ffffff';
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '0',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '4px',
          height: '32px',
          borderRadius: '0 4px 4px 0',
          backgroundColor: color,
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
        <div
          onClick={handleToggle}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: isCompleted ? '2px solid ' + color : '2px solid #d1d5db',
            backgroundColor: isCompleted ? color : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            transform: isAnimating ? 'rotateY(180deg) scale(1.2)' : 'rotateY(0) scale(1)',
            flexShrink: 0,
          }}
        >
          {isCompleted && <CheckOutlined style={{ color: '#ffffff', fontSize: '12px' }} />}
        </div>
        <Text style={{ fontSize: '14px', color: '#1f2937', flex: 1 }}>{habit.name}</Text>
      </div>
      <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
        <Button
          type="text"
          icon={<MoreOutlined />}
          size="small"
          style={{ color: '#9ca3af' }}
          onClick={(e) => e.stopPropagation()}
        />
      </Dropdown>
    </div>
  );
};

const QuickCheckButton: React.FC<{
  habit: Habit;
  isCompleted: boolean;
  onToggle: () => void;
}> = ({ habit, isCompleted, onToggle }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const color = getHabitColor(habit.name);

  const handleToggle = () => {
    setIsAnimating(true);
    onToggle();
    setTimeout(() => setIsAnimating(false), 200);
  };

  return (
    <div
      onClick={handleToggle}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '16px',
        borderRadius: '12px',
        backgroundColor: '#ffffff',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: '1px solid #f3f4f6',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: isCompleted ? '2px solid ' + color : '2px solid #d1d5db',
          backgroundColor: isCompleted ? color : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          transform: isAnimating ? 'rotateY(180deg) scale(1.2)' : 'rotateY(0) scale(1)',
        }}
      >
        {isCompleted && <CheckOutlined style={{ color: '#ffffff', fontSize: '20px' }} />}
      </div>
      <Text style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>{habit.name}</Text>
    </div>
  );
};

export default function App() {
  const { refreshAll, toggleHabit, addHabit, deleteHabit, fetchHeatmap, deleteRecord } = useHabits();
  const {
    habits,
    records,
    heatmapData,
    stats,
    loading,
    heatmapTheme,
    heatmapYear,
    setHeatmapTheme,
    setHeatmapYear,
    selectedHabits,
    setSelectedHabits,
  } = useHabitsStore();
  const { md } = useBreakpoint();

  const [inputValue, setInputValue] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDateHabitDetails, setSelectedDateHabitDetails] = useState<Record<string, boolean> | undefined>(undefined);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [editValue, setEditValue] = useState('');
  const [dateEditorStates, setDateEditorStates] = useState<Record<string, boolean>>({});

  const today = dayjs().format('YYYY-MM-DD');

  const habitsWithColors = useMemo(
    () => habits.map((h) => ({ name: h.name, color: getHabitColor(h.name) })),
    [habits]
  );

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (habits.length > 0 && selectedHabits.length === 0) {
      setSelectedHabits([habits[0].name]);
    }
  }, [habits, selectedHabits.length, setSelectedHabits]);

  useEffect(() => {
    if (selectedHabits.length > 0) {
      fetchHeatmap(heatmapYear, selectedHabits);
    }
  }, [selectedHabits, heatmapYear, fetchHeatmap]);

  const handleHeatmapThemeChange = useCallback((theme: HeatmapTheme) => {
    setHeatmapTheme(theme);
  }, [setHeatmapTheme]);

  const handleHeatmapYearChange = useCallback((year: number) => {
    setHeatmapYear(year);
  }, [setHeatmapYear]);

  const isHabitCompletedToday = useCallback(
    (habitName: string) => {
      const record = records.find((r) => r.habitName === habitName && r.date === today);
      return record?.completed || false;
    },
    [records, today]
  );

  const getDateRecords = useCallback(
    (date: string) => {
      return habits.map((habit) => {
        const record = records.find((r) => r.habitName === habit.name && r.date === date);
        return {
          habit,
          completed: record?.completed || false,
        };
      });
    },
    [habits, records]
  );

  const handleAddHabit = async () => {
    if (!inputValue.trim()) {
      message.warning('请输入习惯名称');
      return;
    }
    if (habits.length >= 10) {
      message.warning('最多只能添加10个习惯');
      return;
    }
    await addHabit(inputValue.trim());
    setInputValue('');
  };

  const handleToggleHabit = async (habitName: string) => {
    try {
      await toggleHabit(habitName, today);
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleToggleHabitByDate = async (habitName: string, date: string) => {
    try {
      await toggleHabit(habitName, date);
      setDateEditorStates((prev) => ({
        ...prev,
        [`${date}-${habitName}`]: !(prev[`${date}-${habitName}`] ?? false),
      }));
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleDeleteRecord = async (habitName: string, date: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除 ${dayjs(date).format('YYYY年M月D日')} "${habitName}" 的记录吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteRecord(habitName, date);
        } catch (err) {
          // Error handled in hook
        }
      },
    });
  };

  const handleDeleteHabit = (habitName: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除习惯"${habitName}"吗？相关的打卡记录也会被删除。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        await deleteHabit(habitName);
      },
    });
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setEditValue(habit.name);
    setEditModalVisible(true);
  };

  const handleDateClick = useCallback((date: string, habitDetails?: Record<string, boolean>) => {
    setSelectedDate(date);
    setSelectedDateHabitDetails(habitDetails);
    setModalVisible(true);
  }, []);

  const selectedDateRecords = useMemo(
    () => (selectedDate ? getDateRecords(selectedDate) : []),
    [selectedDate, getDateRecords]
  );

  const HabitPanel = () => (
    <div
      style={{
        height: '100%',
        backgroundColor: '#ffffff',
        borderRadius: md ? '12px' : '0',
        boxShadow: md ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Title level={4} style={{ margin: '0 0 16px 0', color: '#1f2937' }}>
        我的习惯
      </Title>
      <div style={{ marginBottom: '16px' }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="添加新习惯..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={handleAddHabit}
            disabled={habits.length >= 10}
            maxLength={20}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddHabit}
            disabled={habits.length >= 10}
          >
            添加
          </Button>
        </Space.Compact>
        {habits.length >= 10 && (
          <Text type="warning" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
            最多只能添加10个习惯
          </Text>
        )}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {habits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
            <Text type="secondary">暂无习惯，添加一个开始吧~</Text>
          </div>
        ) : (
          habits.map((habit) => (
            <HabitCard
              key={habit.name}
              habit={habit}
              isCompleted={isHabitCompletedToday(habit.name)}
              onToggle={() => handleToggleHabit(habit.name)}
              onEdit={() => handleEditHabit(habit)}
              onDelete={() => handleDeleteHabit(habit.name)}
            />
          ))
        )}
      </div>
    </div>
  );

  return (
    <Spin spinning={loading} tip="加载中...">
      <Layout style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        {md ? (
          <Layout style={{ backgroundColor: '#f9fafb' }}>
            <Sider
              width={320}
              style={{
                backgroundColor: '#f9fafb',
                padding: '20px',
                height: '100vh',
                position: 'fixed',
                left: 0,
                top: 0,
                overflow: 'hidden',
              }}
            >
              <HabitPanel />
            </Sider>
            <Layout style={{ marginLeft: 320, backgroundColor: '#f9fafb' }}>
              <Content style={{ padding: '20px', maxWidth: '1200px', width: '100%' }}>
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <Card
                    style={{
                      borderRadius: '12px',
                      marginBottom: '20px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div>
                        <Title level={3} style={{ margin: 0, color: '#1f2937' }}>
                          {dayjs().format('YYYY年MM月DD日')}
                        </Title>
                        <Text type="secondary">{dayjs().format('dddd')}</Text>
                      </div>
                      <Tag color="blue">{habits.length} 个习惯</Tag>
                    </div>
                    <Title level={5} style={{ marginBottom: '16px', color: '#374151' }}>
                      今日快速记录
                    </Title>
                    {habits.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af' }}>
                        <Text type="secondary">还没有添加习惯</Text>
                      </div>
                    ) : (
                      <Row gutter={[16, 16]}>
                        {habits.map((habit) => (
                          <Col xs={12} sm={8} md={6} lg={4} key={habit.name}>
                            <QuickCheckButton
                              habit={habit}
                              isCompleted={isHabitCompletedToday(habit.name)}
                              onToggle={() => handleToggleHabit(habit.name)}
                            />
                          </Col>
                        ))}
                      </Row>
                    )}
                  </Card>

                  <Card
                    title={<Title level={5} style={{ margin: 0 }}>年度热力图</Title>}
                    style={{
                      borderRadius: '12px',
                      marginBottom: '20px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    }}
                  >
                    <CalendarHeatmap
                      data={heatmapData}
                      habits={habitsWithColors}
                      selectedHabits={selectedHabits}
                      onSelectedHabitsChange={setSelectedHabits}
                      onDateClick={handleDateClick}
                      theme={heatmapTheme}
                      year={heatmapYear}
                      onYearChange={handleHeatmapYearChange}
                      onThemeChange={handleHeatmapThemeChange}
                    />
                  </Card>

                  <Card
                    title={<Title level={5} style={{ margin: 0 }}>近14天完成率</Title>}
                    style={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    }}
                  >
                    {stats?.daily ? (
                      <StatsChart dailyStats={stats.daily} />
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                        <Text type="secondary">暂无统计数据</Text>
                      </div>
                    )}
                  </Card>
                </div>
              </Content>
            </Layout>
          </Layout>
        ) : (
          <Layout style={{ backgroundColor: '#f9fafb' }}>
            <Header
              style={{
                backgroundColor: '#ffffff',
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                position: 'sticky',
                top: 0,
                zIndex: 100,
              }}
            >
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setDrawerVisible(true)}
              />
              <Title level={5} style={{ margin: '0 0 0 12px', color: '#1f2937' }}>
                习惯追踪
              </Title>
            </Header>
            <Content style={{ padding: '16px' }}>
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <Card
                  style={{
                    borderRadius: '12px',
                    marginBottom: '16px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <Title level={4} style={{ margin: 0, color: '#1f2937' }}>
                        {dayjs().format('MM月DD日')}
                      </Title>
                      <Text type="secondary">{dayjs().format('dddd')}</Text>
                    </div>
                    <Tag color="blue">{habits.length} 个习惯</Tag>
                  </div>
                  <Title level={5} style={{ marginBottom: '12px', color: '#374151' }}>
                    今日快速记录
                  </Title>
                  {habits.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af' }}>
                      <Text type="secondary">还没有添加习惯</Text>
                    </div>
                  ) : (
                    <Row gutter={[12, 12]}>
                      {habits.map((habit) => (
                        <Col span={12} key={habit.name}>
                          <QuickCheckButton
                            habit={habit}
                            isCompleted={isHabitCompletedToday(habit.name)}
                            onToggle={() => handleToggleHabit(habit.name)}
                          />
                        </Col>
                      ))}
                    </Row>
                  )}
                </Card>

                <Card
                  title={<Title level={5} style={{ margin: 0 }}>年度热力图</Title>}
                  style={{
                    borderRadius: '12px',
                    marginBottom: '16px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    overflow: 'auto',
                  }}
                >
                  <CalendarHeatmap
                    data={heatmapData}
                    habits={habitsWithColors}
                    selectedHabits={selectedHabits}
                    onSelectedHabitsChange={setSelectedHabits}
                    onDateClick={handleDateClick}
                    theme={heatmapTheme}
                    year={heatmapYear}
                    onYearChange={handleHeatmapYearChange}
                    onThemeChange={handleHeatmapThemeChange}
                  />
                </Card>

                <Card
                  title={<Title level={5} style={{ margin: 0 }}>近14天完成率</Title>}
                  style={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  }}
                >
                  {stats?.daily ? (
                    <StatsChart dailyStats={stats.daily} />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                      <Text type="secondary">暂无统计数据</Text>
                    </div>
                  )}
                </Card>
              </div>
            </Content>
          </Layout>
        )}

        <Drawer
          title="我的习惯"
          placement="left"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          width={300}
          styles={{ body: { padding: 0 } }}
        >
          <HabitPanel />
        </Drawer>

        <Modal
          title={`${dayjs(selectedDate).format('YYYY年M月D日')} 记录编辑`}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={[
            <Button key="close" type="primary" onClick={() => setModalVisible(false)}>
              完成
            </Button>,
          ]}
          width={420}
        >
          {selectedDateRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Text type="secondary">暂无记录</Text>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedDateRecords.map((item) => {
                const key = `${selectedDate}-${item.habit.name}`;
                const isCompleted = dateEditorStates[key] !== undefined ? dateEditorStates[key] : item.completed;
                const color = getHabitColor(item.habit.name);
                return (
                  <div
                    key={item.habit.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      backgroundColor: '#f9fafb',
                      border: '1px solid #f0f0f0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: color,
                        }}
                      />
                      <Text style={{ fontSize: '14px', color: '#1f2937' }}>{item.habit.name}</Text>
                    </div>
                    <Space size="middle">
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <Switch
                          checked={isCompleted}
                          onChange={() => handleToggleHabitByDate(item.habit.name, selectedDate)}
                          checkedChildren="已完成"
                          unCheckedChildren="未完成"
                        />
                      </div>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                        onClick={() => handleDeleteRecord(item.habit.name, selectedDate)}
                      />
                    </Space>
                  </div>
                );
              })}
              <div
                style={{
                  marginTop: '4px',
                  padding: '10px 12px',
                  backgroundColor: '#f0f7ff',
                  borderRadius: '8px',
                  border: '1px solid #d6e4ff',
                }}
              >
                <Text style={{ fontSize: '12px', color: '#597ef7' }}>
                  💡 提示：使用开关可快速切换完成状态，垃圾桶图标删除该日记录。
                </Text>
              </div>
            </div>
          )}
        </Modal>

        <Modal
          title="编辑习惯"
          open={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          footer={null}
        >
          <div style={{ marginTop: '16px' }}>
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="请输入习惯名称"
              maxLength={20}
            />
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button onClick={() => setEditModalVisible(false)}>取消</Button>
              <Button
                type="primary"
                onClick={async () => {
                  if (!editValue.trim()) {
                    message.warning('请输入习惯名称');
                    return;
                  }
                  message.info('编辑功能开发中');
                  setEditModalVisible(false);
                }}
              >
                确定
              </Button>
            </div>
          </div>
        </Modal>
      </Layout>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .habit-card:hover {
          transform: scale(1.05);
          background-color: #f9fafb;
        }
      `}</style>
    </Spin>
  );
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrewRecord, FlavorRatings, FilterParams, FLAVOR_KEYS } from './types';
import { getRecords, submitRecord, searchRecords } from './api';
import FormPanel from './FormPanel';
import RadarChart from './RadarChart';
import RecordList from './RecordList';

const App: React.FC = () => {
  const [records, setRecords] = useState<BrewRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [currentRatings, setCurrentRatings] = useState<FlavorRatings>({
    acidity: 5,
    sweetness: 5,
    bitterness: 5,
    thickness: 5,
    aftertaste: 5,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [filter, setFilter] = useState<FilterParams>({
    keyword: '',
    startDate: '',
    endDate: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 12,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchStartDate, setSearchStartDate] = useState('');
  const [searchEndDate, setSearchEndDate] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const dragTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFilter = filter.keyword || filter.startDate || filter.endDate;

  const fetchRecords = useCallback(async (page: number, isRefresh = false) => {
    setLoading(true);
    try {
      let response;
      if (hasFilter) {
        const params: FilterParams = {
          keyword: filter.keyword || undefined,
          startDate: filter.startDate || undefined,
          endDate: filter.endDate || undefined,
          page,
          pageSize: pagination.pageSize,
        };
        response = await searchRecords(params);
      } else {
        response = await getRecords(page, pagination.pageSize);
      }

      if (isRefresh) {
        setRecords(response.data);
      } else {
        setRecords((prev) => [...prev, ...response.data]);
      }
      setPagination((prev) => ({
        ...prev,
        page,
        total: response.total,
      }));
    } catch (error) {
      console.error('Failed to fetch records:', error);
    } finally {
      setLoading(false);
    }
  }, [hasFilter, filter, pagination.pageSize]);

  useEffect(() => {
    fetchRecords(1, true);
  }, [filter]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleRatingChange = useCallback((key: string, value: number) => {
    setCurrentRatings((prev) => ({ ...prev, [key as keyof FlavorRatings]: value }));
    if (dragTimerRef.current) {
      clearTimeout(dragTimerRef.current);
    }
    setIsDragging(true);
    dragTimerRef.current = setTimeout(() => {
      setIsDragging(false);
    }, 150);
  }, []);

  const handleSubmit = async (params: {
    beanName: string;
    grindSize: string;
    waterTemp: number;
    brewTime: number;
    ratio: string;
    ratings: FlavorRatings;
  }) => {
    setLoading(true);
    try {
      await submitRecord(params);
      setCurrentRatings({
        acidity: 5,
        sweetness: 5,
        bitterness: 5,
        thickness: 5,
        aftertaste: 5,
      });
      fetchRecords(1, true);
    } catch (error) {
      console.error('Failed to submit record:', error);
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilter({
      keyword: searchKeyword,
      startDate: searchStartDate,
      endDate: searchEndDate,
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleLoadMore = () => {
    if (!loading && pagination.page * pagination.pageSize < pagination.total) {
      fetchRecords(pagination.page + 1, false);
    }
  };

  const handleSelect = (id: string | null) => {
    setSelectedRecordId(id);
  };

  const hasMore = pagination.page * pagination.pageSize < pagination.total;
  const ratingsArray = FLAVOR_KEYS.map((key) => currentRatings[key]);

  return (
    <div style={styles.app}>
      <div style={styles.container}>
        <h1 style={styles.header}>☕ 咖啡冲煮日志</h1>

        <div style={styles.searchBar}>
          <div style={styles.searchField}>
            <label style={styles.searchLabel}>关键词</label>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="按豆子名称搜索"
              style={styles.searchInput}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#374151'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0F172A'; }}
            />
          </div>
          <div style={styles.searchField}>
            <label style={styles.searchLabel}>开始日期</label>
            <input
              type="date"
              value={searchStartDate}
              onChange={(e) => setSearchStartDate(e.target.value)}
              style={styles.searchInput}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#374151'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0F172A'; }}
            />
          </div>
          <div style={styles.searchField}>
            <label style={styles.searchLabel}>结束日期</label>
            <input
              type="date"
              value={searchEndDate}
              onChange={(e) => setSearchEndDate(e.target.value)}
              style={styles.searchInput}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#374151'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0F172A'; }}
            />
          </div>
          <button
            onClick={handleSearch}
            style={styles.searchButton}
            disabled={loading}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
              setTimeout(() => { e.currentTarget.style.transform = 'scale(1)'; }, 100);
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#374151'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1E293B'; }}
          >
            搜索
          </button>
        </div>

        <div style={{
          ...styles.mainContent,
          ...(isMobile ? { flexDirection: 'column' as const } : {}),
        }}>
          <div style={styles.leftPanel}>
            <FormPanel
              onSubmit={handleSubmit}
              onRatingChange={handleRatingChange}
              initialRatings={currentRatings}
            />
          </div>
          <div style={styles.rightPanel}>
            <div style={styles.radarContainer}>
              <div style={styles.radarTitle}>风味雷达图</div>
              <div style={styles.radarWrapper}>
                <RadarChart
                  ratings={ratingsArray}
                  size={320}
                  isAnimating={isDragging}
                />
              </div>
            </div>
          </div>
        </div>

        <div style={styles.recordSection}>
          <div style={styles.sectionTitle}>历史记录</div>
          <RecordList
            records={records}
            selectedId={selectedRecordId}
            onSelect={handleSelect}
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#0F172A',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  header: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 700,
    color: '#F3F4F6',
    textAlign: 'center' as const,
  },
  searchBar: {
    backgroundColor: '#1E293B',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '16px',
    alignItems: 'flex-end',
  },
  searchField: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    flex: 1,
    minWidth: '160px',
  },
  searchLabel: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#94A3B8',
  },
  searchInput: {
    padding: '10px 12px',
    backgroundColor: '#0F172A',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#E2E8F0',
    fontSize: '14px',
    outline: 'none',
    transition: 'background-color 0.2s ease, border-color 0.2s ease',
  },
  searchButton: {
    padding: '10px 24px',
    backgroundColor: '#1E293B',
    color: '#F3F4F6',
    border: '1px solid #334155',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, transform 0.1s ease',
    height: '40px',
  },
  mainContent: {
    display: 'flex',
    gap: '24px',
  },
  leftPanel: {
    flex: 1,
    minWidth: 0,
  },
  rightPanel: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  radarContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '16px',
  },
  radarTitle: {
    color: '#E2E8F0',
    fontSize: '16px',
    fontWeight: 600,
  },
  radarWrapper: {
    backgroundColor: '#0F172A',
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  sectionTitle: {
    color: '#E2E8F0',
    fontSize: '18px',
    fontWeight: 600,
    paddingLeft: '16px',
  },
};

export default App;

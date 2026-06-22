import React, { useCallback, useEffect, useState } from 'react';
import { getMetadataList } from './api';
import type { MaterialMeta, SearchParams, ViewMode } from './types';
import MetadataForm from './components/MetadataForm';
import MetadataGrid from './components/MetadataGrid';
import MetadataTable from './components/MetadataTable';
import SearchBar from './components/SearchBar';
import DetailModal from './components/DetailModal';

const GridIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </svg>
);

const ListIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const App: React.FC = () => {
  const [metadata, setMetadata] = useState<MaterialMeta[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [keyword, setKeyword] = useState('');
  const [filterField, setFilterField] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [sortField, setSortField] = useState('createTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedItem, setSelectedItem] = useState<MaterialMeta | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: SearchParams = {
        keyword: keyword || undefined,
        field: filterField || undefined,
        fieldValue: filterValue || undefined,
        sortField,
        sortOrder,
        page: 1,
        pageSize: 1000
      };
      const result = await getMetadataList(params);
      setMetadata(result.list);
      setTotalCount(result.total);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  }, [keyword, filterField, filterValue, sortField, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDeleted = () => {
    setSelectedItem(null);
    fetchData();
  };

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-title">影视素材元数据管理系统</div>
        <div className="navbar-actions">
          <div className="view-toggle">
            <button
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
              title="卡片视图"
            >
              <GridIcon active={viewMode === 'grid'} />
            </button>
            <button
              className={viewMode === 'table' ? 'active' : ''}
              onClick={() => setViewMode('table')}
              title="表格视图"
            >
              <ListIcon active={viewMode === 'table'} />
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <MetadataForm onSuccess={fetchData} />

        <SearchBar
          keyword={keyword}
          filterField={filterField}
          filterValue={filterValue}
          resultCount={totalCount}
          onKeywordChange={setKeyword}
          onFilterFieldChange={setFilterField}
          onFilterValueChange={setFilterValue}
        />

        {loading ? (
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <div className="empty-state-text">加载中...</div>
          </div>
        ) : viewMode === 'grid' ? (
          <MetadataGrid
            metadata={metadata}
            searchKeyword={keyword}
            onItemClick={setSelectedItem}
          />
        ) : (
          <MetadataTable
            metadata={metadata}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
            onItemClick={setSelectedItem}
          />
        )}
      </main>

      {selectedItem && (
        <DetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
};

export default App;

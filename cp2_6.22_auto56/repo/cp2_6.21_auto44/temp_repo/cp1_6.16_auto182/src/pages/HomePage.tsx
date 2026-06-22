import { useEffect, useState, useMemo } from 'react';
import {
  Row,
  Col,
  Input,
  Select,
  Slider,
  Pagination,
  Spin,
  Empty as AntEmpty,
  Flex
} from 'antd';
import { SearchOutlined, FireOutlined } from '@ant-design/icons';
import { useMarketplaceStore } from '../store/useMarketplaceStore';
import ItemCard from '../components/ItemCard';
import HeatMap from '../components/HeatMap';
import ItemDetailModal from '../components/ItemDetailModal';
import type { Item, ItemCategory } from '../types';

const { Search } = Input;

const categoryOptions: { value: ItemCategory | '全部'; label: string }[] = [
  { value: '全部', label: '全部' },
  { value: '家具', label: '家具' },
  { value: '电器', label: '电器' },
  { value: '书籍', label: '书籍' },
  { value: '服装', label: '服装' },
  { value: '其他', label: '其他' }
];

export default function HomePage() {
  const {
    items,
    heatMapData,
    filters,
    isLoading,
    currentPage,
    pageSize,
    setFilters,
    loadItems,
    loadHeatMapData,
    setPage
  } = useMarketplaceStore();

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState(filters.keyword);

  useEffect(() => {
    loadItems();
    loadHeatMapData();
  }, [loadItems, loadHeatMapData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ keyword: searchKeyword });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchKeyword, setFilters]);

  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
  };

  const handlePriceChange = (value: number[]) => {
    setFilters({ minPrice: value[0], maxPrice: value[1] });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div
        style={{
          background: '#FFFFFF',
          padding: 24,
          borderRadius: 12,
          border: '1px solid #D7CCC8',
          boxShadow: '0 2px 8px rgba(93, 64, 55, 0.08)'
        }}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索物品名称..."
              prefix={<SearchOutlined style={{ color: '#8D6E63' }} />}
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              allowClear
              size="large"
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              value={filters.category}
              onChange={value => setFilters({ category: value })}
              options={categoryOptions}
              size="large"
              style={{ width: '100%' }}
              placeholder="选择类别"
            />
          </Col>
          <Col xs={24} md={10}>
            <Flex vertical gap={8}>
              <span style={{ fontSize: 13, color: '#5D4037', fontWeight: 500 }}>
                价格范围：¥{filters.minPrice} - ¥{filters.maxPrice}
              </span>
              <Slider
                range
                min={0}
                max={10000}
                step={100}
                value={[filters.minPrice, filters.maxPrice]}
                onChange={handlePriceChange}
                tooltip={{
                  formatter: (value: number | undefined) => (value !== undefined ? `¥${value}` : '')
                }}
                styles={{
                  track: { background: '#8D6E63' },
                  rail: { background: '#D7CCC8' }
                }}
              />
            </Flex>
          </Col>
        </Row>
      </div>

      <Spin spinning={isLoading} tip="加载中..." size="large">
        {pagedItems.length > 0 ? (
          <div className="grid-container" style={{ padding: 0 }}>
            {pagedItems.map((item, index) => (
              <ItemCard
                key={item.id}
                item={item}
                index={index}
                onClick={() => handleItemClick(item)}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              padding: '80px 0',
              border: '1px solid #D7CCC8'
            }}
          >
            <AntEmpty description="暂无物品" />
          </div>
        )}
      </Spin>

      {items.length > 0 && (
        <Flex justify="center" style={{ padding: '16px 0' }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={items.length}
            onChange={setPage}
            showSizeChanger={false}
            showQuickJumper
            showTotal={total => `共 ${total} 件物品`}
          />
        </Flex>
      )}

      <div
        style={{
          background: '#FFFFFF',
          padding: 24,
          borderRadius: 12,
          border: '1px solid #D7CCC8',
          boxShadow: '0 2px 8px rgba(93, 64, 55, 0.08)'
        }}
      >
        <Flex align="center" gap={8} style={{ marginBottom: 16 }}>
          <FireOutlined style={{ fontSize: 22, color: '#E53935' }} />
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#5D4037', margin: 0 }}>
            社区交易热力图
          </h2>
        </Flex>
        <HeatMap data={heatMapData} />
      </div>

      <ItemDetailModal
        visible={modalVisible}
        item={selectedItem}
        onClose={handleCloseModal}
      />
    </div>
  );
}

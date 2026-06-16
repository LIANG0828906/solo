import React, { useState, useEffect } from 'react';
import { Layout, Menu, Badge } from 'antd';
import {
  FormOutlined,
  EditOutlined,
  BarChartOutlined,
  TableOutlined,
} from '@ant-design/icons';
import { useAppStore } from './store';
import QuestionnaireDesigner from './modules/questionnaire/QuestionnaireDesigner';
import CollectionPortal from './modules/questionnaire/CollectionPortal';
import DataAnalyzer from './modules/analysis/DataAnalyzer';
import ResponseTable from './modules/analysis/ResponseTable';

const { Sider, Content } = Layout;

const App: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState('designer');
  const { pendingCount, responses, setPendingCount } = useAppStore();

  useEffect(() => {
    setPendingCount(responses.length);
  }, [responses.length, setPendingCount]);

  const menuItems = [
    {
      key: 'designer',
      icon: <EditOutlined />,
      label: '问卷设计',
    },
    {
      key: 'collector',
      icon: <FormOutlined />,
      label: (
        <Badge count={pendingCount} size="small" offset={[10, 0]}>
          答卷收集
        </Badge>
      ),
    },
    {
      key: 'analyzer',
      icon: <BarChartOutlined />,
      label: '数据分析',
    },
    {
      key: 'table',
      icon: <TableOutlined />,
      label: '数据表格',
    },
  ];

  const renderContent = () => {
    const contentClass = 'page-transition';
    switch (selectedKey) {
      case 'designer':
        return <div className={contentClass}><QuestionnaireDesigner /></div>;
      case 'collector':
        return <div className={contentClass}><CollectionPortal /></div>;
      case 'analyzer':
        return <div className={contentClass}><DataAnalyzer /></div>;
      case 'table':
        return <div className={contentClass}><ResponseTable /></div>;
      default:
        return null;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220}>
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 18,
            fontWeight: 600,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          问卷调研系统
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => setSelectedKey(key)}
          style={{ borderRight: 'none', marginTop: 16 }}
        />
      </Sider>
      <Layout style={{ background: '#F0F2F5' }}>
        <Content
          style={{
            padding: 24,
            minHeight: 280,
            minWidth: 800,
          }}
        >
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;

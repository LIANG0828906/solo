import React from 'react';
import { Link } from 'react-router-dom';
import DataInputForm from '../components/DataInputForm';

const HomePage: React.FC = function HomePage() {
  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>🏥 员工健康体检智能分析平台</h1>
          <div style={{ marginTop: 4, color: '#718096', fontSize: 14 }}>
            上传体检数据，获取个性化健康分析报告
          </div>
        </div>
        <div className="page-links">
          <Link to="/hr">HR 管理后台</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 24 }}>
        <div className="card">
          <h3 className="section-title">📋 使用说明</h3>
          <div style={{ fontSize: 14, color: '#4a5568', lineHeight: 2 }}>
            <p>1. 填写<strong>基本信息</strong>，包括员工编号、姓名、部门、年龄、性别、身高体重。</p>
            <p>2. 输入<strong>血液指标</strong>：空腹血糖、总胆固醇、甘油三酯、HDL、LDL、血压。</p>
            <p>3. 记录<strong>生活习惯</strong>：运动频率、睡眠时长、吸烟饮酒状态。</p>
            <p>4. 提交后系统自动生成健康分析报告，包括：</p>
            <ul style={{ paddingLeft: 24, marginTop: 8 }}>
              <li>综合健康评分（环形进度条）</li>
              <li>5维度健康风险雷达图</li>
              <li>关键指标历史趋势图</li>
              <li>个性化改善建议</li>
            </ul>
          </div>
          <div
            style={{
              marginTop: 20,
              padding: 16,
              background: '#ebf8ff',
              borderRadius: 8,
              borderLeft: '4px solid #2b6cb0',
              fontSize: 13,
              color: '#2c5282',
            }}
          >
            💡 提示：也可直接拖拽上传 JSON 格式的体检数据文件快速导入
          </div>
        </div>
        <DataInputForm />
      </div>
    </div>
  );
};

export default HomePage;

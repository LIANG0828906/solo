import React from 'react';
import AssetEntryForm from '@/modules/asset/AssetEntryForm';
import AssetList from '@/modules/asset/AssetList';

const AssetPage: React.FC = () => {
  return (
    <div className="page-enter">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary mb-2">资产录入</h2>
        <p className="text-text-secondary">管理您的投资资产，添加、编辑或删除资产记录</p>
      </div>

      <AssetEntryForm />
      <AssetList />
    </div>
  );
};

export default AssetPage;

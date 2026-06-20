import { MaterialTable } from '@/components/MaterialTable';

export function MaterialsPage() {
  return (
    <div className="materials-page">
      <div className="page-header">
        <h1 className="page-title">材料库存管理</h1>
        <p className="page-subtitle">有条不紊地管理你的每一份材料，不再为找不到材料而发愁</p>
      </div>
      <MaterialTable />
    </div>
  );
}

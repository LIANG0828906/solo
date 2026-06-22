/* ============================================================
 * App.tsx - 主应用组件
 * ============================================================
 *
 * 【职责】
 *   1. 全局状态初始化（从localStorage加载数据）
 *   2. 页面整体布局组合（Header + 操作栏 + 即将到来横幅 + 生日列表 + 弹窗）
 *   3. 路由与弹窗状态管理
 *
 * 【调用关系】
 *   App.tsx
 *     ├─→ UpcomingBanner(people)      ← props: 生日记录数组
 *     │    └─→ BirthdayCard(compact)  ← props: person + compact模式
 *     │
 *     ├─→ BirthdayList(people)        ← props: 生日记录数组
 *     │    └─→ BirthdayCard           ← props: person + isNew标识
 *     │         ├─→ useCountdown()    ← hook: 动态倒计时
 *     │         ├─→ openGiftModal()   ← store action: 打开礼物弹窗
 *     │         ├─→ openEditModal()   ← store action: 打开编辑弹窗
 *     │         └─→ deletePerson()    ← store action: 删除记录
 *     │
 *     ├─→ AddBirthdayForm            ← 条件渲染: isAddModalOpen === true
 *     │    ├─→ validateForm()         ← utils: 表单校验
 *     │    └─→ addPerson()            ← store action: 添加记录 → localStorage
 *     │
 *     ├─→ EditBirthdayModal          ← 条件渲染: isEditModalOpen === true
 *     │    ├─→ validateForm()         ← utils: 表单校验
 *     │    ├─→ updatePerson()         ← store action: 更新记录
 *     │    └─→ deletePerson()         ← store action: 删除记录
 *     │
 *     └─→ GiftFinder(selectedPerson) ← 条件渲染: isGiftModalOpen === true
 *          ├─→ getGiftRecommendations() ← utils: 基于兴趣标签匹配礼物
 *          └─→ GiftCard              ← props: gift + index
 *               └─→ 3D翻转动画 + 飞入动画
 *
 * 【数据流向】
 *   ┌─────────────┐     useEffect      ┌─────────────────┐
 *   │ localStorage │ ────────────────→ │ useBirthdayStore │
 *   └─────────────┘  loadFromStorage() └────────┬────────┘
 *                                                │
 *                       people / selectedPerson   │ state
 *                                                ▼
 *   ┌──────────────────────────────────────────────────────────┐
 *   │                      App.tsx                             │
 *   │  通过 props 分发给: UpcomingBanner, BirthdayList          │
 *   │  通过 props 分发给: GiftFinder, EditBirthdayModal         │
 *   └────────────┬───────────────────────────────┬─────────────┘
 *                │                               │
 *                ▼                               ▼
 *     用户操作(添加/编辑/删除)          用户操作(点击找礼物)
 *                │                               │
 *                ▼                               ▼
 *   ┌─────────────────────────────┐  ┌─────────────────────────┐
 *   │ store.addPerson/update...   │  │ store.openGiftModal()   │
 *   │ → 写入 localStorage         │  │ → selectedPerson = person│
 *   └─────────────────────────────┘  └─────────────────────────┘
 * ============================================================ */

import { useEffect } from 'react';
import { Plus, Download, CalendarHeart, AlertCircle } from 'lucide-react';

import { BirthdayList } from '@/components/BirthdayList';
import { GiftFinder } from '@/components/GiftFinder';
import { AddBirthdayForm } from '@/components/AddBirthdayForm';
import { EditBirthdayModal } from '@/components/EditBirthdayModal';
import { UpcomingBanner } from '@/components/UpcomingBanner';
import { useBirthdayStore } from '@/store/useBirthdayStore';

export default function App() {
  /* ========== 从Store获取状态和Action ========== */
  const {
    people,               // 所有生日记录数组，通过props传递给子组件
    selectedPerson,        // 当前选中的人（用于编辑弹窗和礼物推荐）
    isGiftModalOpen,       // 礼物推荐弹窗开关
    isAddModalOpen,        // 添加生日弹窗开关
    isEditModalOpen,       // 编辑生日弹窗开关
    openAddModal,          // Action: 打开添加弹窗
    exportToJSON,          // Action: 导出数据为JSON文件
    loadFromStorage,       // Action: 从localStorage加载数据
  } = useBirthdayStore();

  /* ========== 初始化：页面加载时从localStorage恢复数据 ==========
   * 调用链: App.useEffect → store.loadFromStorage() → localStorage.getItem()
   */
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ==================== 顶部标题区域 ==================== */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <CalendarHeart className="text-[#D4AF37]" size={48} />
            <h1 className="text-4xl md:text-5xl font-bold font-display">
              生日提醒助手
            </h1>
          </div>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            记录每一个重要的日子，送上最贴心的祝福与礼物灵感
          </p>
          <div className="h-0.5 w-24 bg-[#D4AF37] mx-auto mt-6 rounded-full" />
        </header>

        {/* ==================== 操作按钮栏 ==================== */}
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <button
            onClick={openAddModal}
            className="btn-gold flex items-center gap-2"
          >
            <Plus size={20} />
            添加生日
          </button>
          <button
            onClick={exportToJSON}
            className="btn-secondary flex items-center gap-2"
            disabled={people.length === 0}
          >
            <Download size={20} />
            导出数据
          </button>
        </div>

        {/* ==================== 即将到来的生日横幅 ====================
         * 数据流: App.people → UpcomingBanner props.people
         * 功能: 横向滚动展示30天内生日，自动循环，悬停暂停
         */}
        <UpcomingBanner people={people} />

        {/* ==================== 生日列表网格 ====================
         * 数据流: App.people → BirthdayList props.people
         * 功能: 2列(桌面)/1列(移动)网格，支持虚拟滚动优化性能
         */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">📋</span>
            <h2 className="text-xl font-bold font-display">
              所有生日记录
              <span className="ml-2 text-sm font-normal text-gray-300">
                共 {people.length} 位
              </span>
            </h2>
          </div>
          <BirthdayList people={people} />
        </section>

        {/* ==================== 页脚说明 ==================== */}
        <footer className="mt-16 text-center text-gray-400 text-sm">
          <p>💝 用心记录每一个特别的日子</p>
          <p className="mt-2 flex items-center justify-center gap-1">
            <AlertCircle size={14} />
            数据保存在本地浏览器中，请定期导出备份
          </p>
        </footer>
      </div>

      {/* ==================== 弹窗区域（条件渲染） ==================== */}

      {/* 添加生日表单弹窗 */}
      {isAddModalOpen && <AddBirthdayForm />}

      {/* 编辑生日弹窗 - 需要selectedPerson数据 */}
      {isEditModalOpen && selectedPerson && (
        <EditBirthdayModal person={selectedPerson} />
      )}

      {/* 礼物推荐弹窗 - 需要selectedPerson的兴趣标签来匹配礼物 */}
      {isGiftModalOpen && selectedPerson && (
        <GiftFinder person={selectedPerson} />
      )}
    </div>
  );
}

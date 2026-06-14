// ============================================================
// 导航栏组件
// 数据流向：用户点击菜单项 → useNavigate → URL 变化 → Routes 匹配 → 页面切换
// 调用关系：被 App.tsx 引入作为全局布局的一部分，提供页面导航功能
// ============================================================

import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Shirt, Sparkles, Users, Repeat, Menu, X, UserCircle } from 'lucide-react';

/**
 * 导航菜单项接口
 */
interface NavItem {
  /** 菜单项路径 */
  path: string;
  /** 菜单项显示文本 */
  label: string;
  /** 菜单项图标 */
  icon: React.ReactNode;
}

/**
 * 导航菜单项配置
 * 当前页面的菜单项背景高亮为浅棕色圆角矩形
 */
const navItems: NavItem[] = [
  { path: '/closet', label: '我的衣橱', icon: <Shirt size={20} /> },
  { path: '/outfits', label: '搭配广场', icon: <Sparkles size={20} /> },
  { path: '/friends', label: '好友', icon: <Users size={20} /> },
  { path: '/swaps', label: '交换请求', icon: <Repeat size={20} /> },
];

/**
 * 导航栏组件
 *
 * 布局特性：
 * - 桌面端：左侧 220px 固定侧栏
 * - 移动端：顶部汉堡菜单（点击展开/收起）
 * - 当前页高亮：浅棕色圆角矩形背景
 * - 摩卡棕主题配色
 */
export default function Navbar() {
  // 移动端菜单展开状态
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  /**
   * 切换移动端菜单展开/收起
   */
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  /**
   * 关闭移动端菜单
   * 点击菜单项后自动关闭
   */
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* ============================================
         桌面端导航栏：左侧固定 220px 侧栏
         数据流向：hover NavLink → 高亮背景 → 点击跳转
         ============================================ */}
      <nav className="hidden md:flex fixed left-0 top-0 h-screen w-[220px] flex-col bg-cream-100 border-r border-mocha-600/10 z-50 animate-fade-in">
        {/* Logo 区域 */}
        <div className="flex items-center gap-2 px-6 py-6 border-b border-mocha-600/10">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-mocha-500 to-mocha-700 flex items-center justify-center shadow-md">
            <Shirt size={20} className="text-cream-50" />
          </div>
          <span className="text-xl font-serif font-bold text-mocha-800">衣享</span>
        </div>

        {/* 用户信息 */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-mocha-600/10">
          <div className="w-10 h-10 rounded-full bg-mocha-200 flex items-center justify-center">
            <UserCircle size={24} className="text-mocha-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-mocha-800">demo_user</p>
            <p className="text-xs text-mocha-600/70">时尚穿搭爱好者</p>
          </div>
        </div>

        {/* 菜单项列表 */}
        <div className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                 ${
                   isActive
                     ? 'bg-mocha-500/20 text-mocha-800 font-semibold shadow-sm'
                     : 'text-mocha-700 hover:bg-mocha-500/10 hover:text-mocha-800'
                 }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* 底部版权 */}
        <div className="px-6 py-4 text-xs text-mocha-600/50 border-t border-mocha-600/10">
          © 2026 衣享 · 让衣橱流动起来
        </div>
      </nav>

      {/* ============================================
         移动端导航栏：顶部汉堡菜单
         视口宽度 < 768px 时显示
         ============================================ */}
      <nav className="md:hidden fixed top-0 left-0 right-0 h-16 bg-cream-100 border-b border-mocha-600/10 z-50 flex items-center justify-between px-4 animate-fade-in">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mocha-500 to-mocha-700 flex items-center justify-center shadow-md">
            <Shirt size={16} className="text-cream-50" />
          </div>
          <span className="text-lg font-serif font-bold text-mocha-800">衣享</span>
        </div>

        {/* 汉堡菜单按钮 */}
        <button
          onClick={toggleMobileMenu}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-mocha-700 hover:bg-mocha-500/10 transition-colors"
          aria-label={isMobileMenuOpen ? '关闭菜单' : '打开菜单'}
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* 移动端下拉菜单 */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 bg-cream-100 border-b border-mocha-600/10 z-40 animate-slide-in-from-bottom">
          {/* 用户信息 */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-mocha-600/10">
            <div className="w-9 h-9 rounded-full bg-mocha-200 flex items-center justify-center">
              <UserCircle size={20} className="text-mocha-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-mocha-800">demo_user</p>
              <p className="text-xs text-mocha-600/70">时尚穿搭爱好者</p>
            </div>
          </div>

          {/* 菜单项 */}
          <div className="py-2 px-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                   ${
                     isActive
                       ? 'bg-mocha-500/20 text-mocha-800 font-semibold'
                       : 'text-mocha-700 hover:bg-mocha-500/10'
                   }
                   ${location.pathname === item.path ? 'bg-mocha-500/20' : ''}`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* 移动端顶部占位（避免内容被导航栏遮挡） */}
      <div className="md:hidden h-16" />
    </>
  );
}

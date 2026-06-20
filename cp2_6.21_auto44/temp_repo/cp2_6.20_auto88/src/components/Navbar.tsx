// ============================================================
// 顶部导航栏 Navbar.tsx
// 职责: 展示应用标题、品牌标识，提供重置按钮
//       重置按钮点击 -> useCrafting.clearAllSlots() 清空所有合成状态
// ============================================================

import { memo } from 'react';
import { useCrafting } from '../hooks/useCrafting';

function NavbarComponent() {
  const { clearAllSlots } = useCrafting();

  return (
    <nav className="navbar">
      <div className="navbar__brand">
        <span className="navbar__logo">⚒️</span>
        <h1 className="navbar__title">
          装备<span className="title-accent">合成</span>模拟器
        </h1>
      </div>
      <div className="navbar__actions">
        <button className="reset-btn" onClick={clearAllSlots}>
          <span className="reset-icon">↺</span>
          重置合成
        </button>
      </div>
    </nav>
  );
}

export const Navbar = memo(NavbarComponent);

import { Plan } from '../types';
import './styles/Navigation.css';

interface NavigationProps {
  plans: Plan[];
  currentPlanId: string | null;
  onSelectPlan: (id: string) => void;
  currentPage: 'plans' | 'workout' | 'social';
  onNavigate: (page: 'plans' | 'workout' | 'social') => void;
}

const navItems = [
  { key: 'plans' as const, label: '计划', icon: '📋' },
  { key: 'workout' as const, label: '训练', icon: '💪' },
  { key: 'social' as const, label: '社群', icon: '👥' },
];

export default function Navigation({
  plans,
  currentPlanId,
  onSelectPlan,
  currentPage,
  onNavigate,
}: NavigationProps) {
  return (
    <nav className="navigation">
      <div className="navigation-desktop">
        <div className="navigation-logo">FitTrack</div>

        <div className="nav-main-items">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`nav-main-item ${currentPage === item.key ? 'active' : ''}`}
              onClick={() => onNavigate(item.key)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="nav-section-title">训练计划</div>
        <div className="nav-plans-list">
          {plans.map((plan) => (
            <button
              key={plan.id}
              className={`nav-plan-item ${currentPlanId === plan.id ? 'active' : ''}`}
              onClick={() => onSelectPlan(plan.id)}
            >
              <span className="nav-plan-dot" />
              <span>{plan.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="navigation-mobile">
        <div className="nav-mobile-tabs">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`nav-mobile-tab ${currentPage === item.key ? 'active' : ''}`}
              onClick={() => onNavigate(item.key)}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
        {currentPage === 'plans' && (
          <div className="nav-mobile-plans">
            {plans.map((plan) => (
              <button
                key={plan.id}
                className={`nav-mobile-plan ${currentPlanId === plan.id ? 'active' : ''}`}
                onClick={() => onSelectPlan(plan.id)}
              >
                {plan.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}

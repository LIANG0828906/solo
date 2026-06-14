import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import LeadsList from '@/modules/leads/LeadsList';
import LeadDetail from '@/modules/leads/LeadDetail';
import CustomerProfile from '@/modules/customers/CustomerProfile';
import Dashboard from '@/modules/dashboard/Dashboard';
import { CRMProvider, useCRM } from '@/context/CRMContext';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const navItems: NavItem[] = [
  { path: '/', label: '线索管理', icon: Users },
  { path: '/dashboard', label: '数据仪表盘', icon: LayoutDashboard },
];

function Sidebar({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { customers } = useCRM();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-sidebar text-white z-40 transition-all duration-300 ease-out flex flex-col',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-accent" />
            <span className="font-bold text-lg">CRM系统</span>
          </div>
        )}
        {isCollapsed && <Building2 className="w-6 h-6 text-accent mx-auto" />}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-sidebar-hover transition-colors duration-200"
        >
          {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ease-out',
                isActive
                  ? 'bg-accent text-white shadow-lg'
                  : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
              )}
              title={item.label}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="font-medium flex-1 text-left">{item.label}</span>
              )}
              {!isCollapsed && isActive && <ChevronRight className="w-4 h-4" />}
            </button>
          );
        })}

        {!isCollapsed && customers.length > 0 && (
          <div className="mt-6">
            <p className="px-3 text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              最近客户
            </p>
            {customers.slice(0, 5).map((customer) => (
              <button
                key={customer.id}
                onClick={() => handleNavigation(`/customer/${customer.id}`)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
                  location.pathname === `/customer/${customer.id}`
                    ? 'bg-accent/20 text-white'
                    : 'text-gray-400 hover:bg-sidebar-hover hover:text-white'
                )}
              >
                <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                <span className="text-sm truncate">{customer.companyName}</span>
              </button>
            ))}
          </div>
        )}
      </nav>

      {!isCollapsed && (
        <div className="p-4 border-t border-white/10">
          <div className="text-xs text-gray-400">
            <p>© 2024 CRM系统</p>
            <p className="mt-1">v1.0.0</p>
          </div>
        </div>
      )}
    </aside>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1200) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div
        className={cn(
          'flex-1 min-h-screen bg-main-bg transition-all duration-300 ease-out',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        {children}
      </div>
    </div>
  );
}

function LeadsListPage() {
  const navigate = useNavigate();
  const handleLeadClick = (id: string) => {
    navigate(`/lead/${id}`);
  };
  return <LeadsList onLeadClick={handleLeadClick} />;
}

function LeadDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  return <LeadDetail leadId={id || ''} onBack={() => navigate('/')} />;
}

function CustomerProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  return <CustomerProfile customerId={id || ''} onBack={() => navigate('/')} />;
}

export default function App() {
  return (
    <CRMProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <AppLayout>
                <LeadsListPage />
              </AppLayout>
            }
          />
          <Route
            path="/lead/:id"
            element={
              <AppLayout>
                <LeadDetailPage />
              </AppLayout>
            }
          />
          <Route
            path="/customer/:id"
            element={
              <AppLayout>
                <CustomerProfilePage />
              </AppLayout>
            }
          />
          <Route
            path="/dashboard"
            element={
              <AppLayout>
                <Dashboard />
              </AppLayout>
            }
          />
        </Routes>
      </Router>
    </CRMProvider>
  );
}

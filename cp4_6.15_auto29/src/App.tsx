import { DataStoreProvider, useDataStore } from '@/utils/dataStore';
import BrowsePage from '@/pages/BrowsePage';
import PublishPage from '@/pages/PublishPage';
import DetailPage from '@/pages/DetailPage';
import ProfilePage from '@/pages/ProfilePage';
import type { RouteName } from '@/types';

const Icon = {
  Home: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  PlusSquare: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  ),
  User: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};

function NavBar() {
  const { state, navigate } = useDataStore();
  const currentRoute = state.route.name;

  const navItem = (route: RouteName) => ({
    onClick: () => navigate({ name: route }),
    className: `nav-item ${currentRoute === route ? 'active' : ''}`,
  });

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        <button {...navItem('browse')}>
          <Icon.Home className="nav-icon" />
          <span>浏览</span>
        </button>
        <button {...navItem('publish')}>
          <Icon.PlusSquare className="nav-icon" />
          <span>发布</span>
        </button>
        <button {...navItem('profile')}>
          <Icon.User className="nav-icon" />
          <span>我的</span>
        </button>
      </div>
    </nav>
  );
}

function AppContent() {
  const { state } = useDataStore();
  const { route } = state;

  let page: React.ReactNode;
  switch (route.name) {
    case 'browse':
      page = <BrowsePage key="browse" />;
      break;
    case 'publish':
      page = <PublishPage key="publish" />;
      break;
    case 'detail':
      page = <DetailPage key={`detail-${route.params?.id || ''}`} />;
      break;
    case 'profile':
      page = <ProfilePage key="profile" />;
      break;
    default:
      page = <BrowsePage key="browse" />;
  }

  return (
    <div className="app-root">
      {page}
      <NavBar />
    </div>
  );
}

export default function App() {
  return (
    <DataStoreProvider>
      <AppContent />
    </DataStoreProvider>
  );
}

export { Icon };

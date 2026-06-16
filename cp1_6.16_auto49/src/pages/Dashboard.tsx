import { Link } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import Empty from '@/components/Empty';

export default function Dashboard() {
  const { state } = useProjectStore();
  const currentUser = state.users.find(u => u.id === state.currentUserId);

  const userProjects = state.projects.filter(
    p => p.members.includes(state.currentUserId!)
  );

  return (
    <div className="min-h-screen">
      <header className="bg-[var(--header-bg)] text-white py-6 px-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">项目管理面板</h1>
          {currentUser && (
            <div className="flex items-center gap-3">
              <span className="text-sm opacity-90">欢迎, {currentUser.name}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">我的项目</h2>
          <button className="btn">
            + 创建项目
          </button>
        </div>

        {userProjects.length === 0 ? (
          <div className="h-64">
            <Empty />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userProjects.map(project => (
              <Link
                key={project.id}
                to={`/project/${project.id}`}
                className="card hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {project.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {project.description}
                </p>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>{project.members.length} 位成员</span>
                  <span>创建于 {new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

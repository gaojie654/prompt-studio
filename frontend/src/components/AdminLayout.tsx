import { useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'

const menuItems = [
  { path: '/admin', label: '工作台', icon: '📊', end: true },
  { path: '/admin/users', label: '用户管理', icon: '👥' },
  { path: '/admin/orders', label: '订单管理', icon: '💳' },
  { path: '/admin/prompts', label: '提示词管理', icon: '📝' },
  { path: '/admin/statistics', label: '数据统计', icon: '📈' },
  { path: '/admin/settings', label: '系统设置', icon: '⚙️' },
]

export default function AdminLayout() {
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      navigate('/admin/login')
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* 左侧菜单 */}
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="p-4 text-lg font-bold border-b border-gray-700">
          Prompt Studio
        </div>
        <div className="p-2 text-sm text-gray-400 border-b border-gray-700">
          管理后台
        </div>
        <nav className="flex-1 p-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-md mb-1 text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* 右侧内容 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部栏 */}
        <header className="h-14 bg-white shadow flex items-center justify-between px-6">
          <h1 className="text-gray-600 text-sm">管理后台</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">👤 管理员</span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:text-red-700 transition-colors"
            >
              退出
            </button>
          </div>
        </header>

        {/* 主内容 */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

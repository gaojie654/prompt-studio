import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

interface Announcement {
  id: string
  title: string
  content: string
  isPinned: boolean
  isPopup: boolean
}

const NAV_ITEMS = [
  { path: '/workspace', label: '工作台', icon: '🎨' },
  { path: '/prompts', label: '提示词库', icon: '💡' },
  { path: '/recharge', label: '充值', icon: '💳' },
  { path: '/membership', label: '会员', icon: '👑' },
  { path: '/feedback', label: '意见反馈', icon: '💬' },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<{ name?: string; email: string } | null>(null)
  const [credits, setCredits] = useState(0)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [popupAnnouncement, setPopupAnnouncement] = useState<Announcement | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setIsLoggedIn(true)
      fetchUserInfo()
    }
    fetchPopupAnnouncement()
  }, [])

  useEffect(() => {
    if (!popupAnnouncement) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismissAnnouncement()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [popupAnnouncement])

  const fetchPopupAnnouncement = async () => {
    try {
      const response = await axios.get(`${API_BASE}/v1/announcements`)
      const announcements = response.data.data as Announcement[]
      const popup = announcements.find((a) => a.isPopup)
      if (popup) {
        const dismissed = localStorage.getItem(`announcement_dismissed_${popup.id}`)
        if (!dismissed) {
          setPopupAnnouncement(popup)
        }
      }
    } catch (err) {
      console.error('Failed to fetch announcements')
    }
  }

  const dismissAnnouncement = () => {
    if (popupAnnouncement) {
      localStorage.setItem(`announcement_dismissed_${popupAnnouncement.id}`, 'true')
    }
    setPopupAnnouncement(null)
  }

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('token')
      const [userRes, balanceRes] = await Promise.all([
        axios.get(`${API_BASE}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE}/users/balance`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])
      setUser(userRes.data.data)
      setCredits(balanceRes.data.data.credits)
    } catch (err) {
      console.error('Failed to fetch user info')
      localStorage.removeItem('token')
      setIsLoggedIn(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsLoggedIn(false)
    setUser(null)
    navigate('/')
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop */}
      <aside className={`hidden md:flex flex-col bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'} sticky top-0 h-screen`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            {!collapsed && <span className="font-bold text-xl text-gray-900">Prompt Studio</span>}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive(item.path)
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-indigo-600'
              }`}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-100 p-3">
          {isLoggedIn ? (
            <div className={`space-y-3 ${collapsed ? 'flex flex-col items-center' : ''}`}>
              <Link
                to="/profile"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  isActive('/profile')
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-600 font-medium text-sm">
                    {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.name || '用户'}</p>
                    <p className="text-xs text-gray-500">{credits} 额度</p>
                  </div>
                )}
              </Link>
              <button
                onClick={handleLogout}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors ${
                  collapsed ? 'justify-center' : ''
                }`}
              >
                <span className="text-lg">🚪</span>
                {!collapsed && <span className="text-sm font-medium">退出登录</span>}
              </button>
            </div>
          ) : (
            <div className={`space-y-2 ${collapsed ? 'flex flex-col items-center' : ''}`}>
              <Link
                to="/login"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors ${
                  collapsed ? 'justify-center' : ''
                }`}
              >
                <span className="text-lg">👤</span>
                {!collapsed && <span className="font-medium">登录</span>}
              </Link>
              <Link
                to="/register"
                className={`flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors ${
                  collapsed ? 'w-10 h-10 p-0' : ''
                }`}
              >
                <span className="text-lg">{collapsed ? '+' : '注册'}</span>
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar - Mobile Only */}
        <header className="md:hidden bg-white shadow-sm sticky top-0 z-50">
          <div className="flex items-center justify-between h-14 px-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="font-bold text-lg text-gray-900">Prompt Studio</span>
            </Link>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {showMobileMenu ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile menu */}
          {showMobileMenu && (
            <div className="bg-white border-t">
              <div className="px-4 py-3 space-y-1">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                      isActive(item.path)
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
                {isLoggedIn ? (
                  <>
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <span className="text-lg">👤</span>
                      <span>个人中心</span>
                    </Link>
                    <div className="pt-2 mt-2 border-t">
                      <div className="flex items-center gap-3 px-3 py-2">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-medium text-sm">
                            {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user?.name || '用户'}</p>
                          <p className="text-xs text-gray-500">{credits} 额度</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          handleLogout()
                          setShowMobileMenu(false)
                        }}
                        className="w-full text-left px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-xl"
                      >
                        🚪 退出登录
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="pt-2 mt-2 border-t space-y-1">
                    <Link
                      to="/login"
                      className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <span className="text-lg">👤</span>
                      <span>登录</span>
                    </Link>
                    <Link
                      to="/register"
                      className="flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-600 text-white rounded-xl font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      注册
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-6 md:py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-center md:text-left">
                <div className="text-lg font-bold text-white mb-1">Prompt Studio</div>
                <div className="text-sm">AI驱动的营销图片生成工具</div>
              </div>
              <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link to="/profile" className="hover:text-white transition-colors">个人中心</Link>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-800 text-center text-xs md:text-sm">
              © 2026 Prompt Studio. All rights reserved.
            </div>
          </div>
        </footer>
      </div>

      {/* Popup Announcement */}
      {popupAnnouncement && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              dismissAnnouncement()
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-indigo-600 px-4 py-3">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">📢 {popupAnnouncement.title ?? '公告'}</h3>
                <button
                  onClick={dismissAnnouncement}
                  className="text-white hover:text-indigo-200 transition-colors text-xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-4">
              <p className="text-gray-700 whitespace-pre-wrap">
                {popupAnnouncement.content ?? ''}
              </p>
            </div>
            <div className="px-4 pb-4">
              <button
                onClick={dismissAnnouncement}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

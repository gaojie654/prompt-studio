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
  { path: '/workspace', label: '工作台', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { path: '/prompts', label: '提示词库', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  { path: '/recharge', label: '充值', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { path: '/membership', label: '会员', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
  { path: '/feedback', label: '意见反馈', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
]

function NavIcon({ path, isActive }: { path: string; isActive: boolean }) {
  const iconMap: Record<string, string> = {
    '/workspace': 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    '/prompts': 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
    '/recharge': 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    '/membership': 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
    '/feedback': 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  }

  return (
    <svg
      className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-indigo-500'}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={isActive ? 2 : 1.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={iconMap[path] || iconMap['/workspace']} />
    </svg>
  )
}

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
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        } sticky top-0 h-screen shadow-sm`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            {!collapsed && (
              <span className="font-bold text-xl text-gray-900 tracking-tight">Prompt Studio</span>
            )}
          </Link>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-5 right-0 transform translate-x-1/2 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors z-10"
        >
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${collapsed ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <NavIcon path={item.path} isActive={isActive(item.path)} />
              {!collapsed && (
                <span className={`font-medium ${isActive(item.path) ? '' : 'group-hover:text-indigo-600'}`}>
                  {item.label}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-100 p-3">
          {isLoggedIn ? (
            <div className={collapsed ? 'flex flex-col items-center' : ''}>
              <Link
                to="/profile"
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                  isActive('/profile')
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-semibold text-sm">
                    {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.name || '用户'}</p>
                    <p className="text-xs text-indigo-600 font-medium">{credits} 额度</p>
                  </div>
                )}
              </Link>
              <button
                onClick={handleLogout}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors mt-1 ${
                  collapsed ? 'justify-center' : ''
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {!collapsed && <span className="text-sm font-medium">退出登录</span>}
              </button>
            </div>
          ) : (
            <div className={`space-y-2 ${collapsed ? 'flex flex-col items-center' : ''}`}>
              <Link
                to="/login"
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors ${
                  collapsed ? 'justify-center' : ''
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {!collapsed && <span className="font-medium">登录</span>}
              </Link>
              <Link
                to="/register"
                className={`flex items-center justify-center gap-2 px-3 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-200 transition-all ${
                  collapsed ? 'w-10 h-10 p-0' : ''
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                {!collapsed && <span>注册</span>}
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
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
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
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-colors ${
                      isActive(item.path)
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <NavIcon path={item.path} isActive={isActive(item.path)} />
                    <span>{item.label}</span>
                  </Link>
                ))}
                {isLoggedIn ? (
                  <>
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-3 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 text-xs font-semibold">
                          {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <span>个人中心</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout()
                        setShowMobileMenu(false)
                      }}
                      className="w-full flex items-center gap-3 px-3 py-3 text-red-600 hover:bg-red-50 rounded-xl"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>退出登录</span>
                    </button>
                  </>
                ) : (
                  <div className="pt-2 mt-2 border-t space-y-1">
                    <Link
                      to="/login"
                      className="flex items-center gap-3 px-3 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      登录
                    </Link>
                    <Link
                      to="/register"
                      className="flex items-center justify-center px-3 py-3 bg-indigo-600 text-white rounded-xl font-medium"
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              dismissAnnouncement()
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold text-lg">📢 {popupAnnouncement.title ?? '公告'}</h3>
                <button
                  onClick={dismissAnnouncement}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-lg transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-5">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {popupAnnouncement.content ?? ''}
              </p>
            </div>
            <div className="px-5 pb-5">
              <button
                onClick={dismissAnnouncement}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-200 transition-all"
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

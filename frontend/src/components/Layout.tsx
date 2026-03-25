import { Outlet, Link, useNavigate } from 'react-router-dom'
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

export default function Layout() {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<{ name?: string; email: string } | null>(null)
  const [credits, setCredits] = useState(0)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [popupAnnouncement, setPopupAnnouncement] = useState<Announcement | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setIsLoggedIn(true)
      fetchUserInfo()
    }
    fetchPopupAnnouncement()
  }, [])

  const fetchPopupAnnouncement = async () => {
    try {
      const response = await axios.get(`${API_BASE}/v1/announcements`)
      const announcements = response.data.data as Announcement[]
      const popup = announcements.find((a) => a.isPopup)
      if (popup) {
        // Check if already dismissed
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <span className="font-bold text-xl text-gray-900">Prompt Studio</span>
              </Link>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/workspace"
                className="text-gray-600 hover:text-indigo-600 font-medium transition-colors"
              >
                工作�?              </Link>
              <Link
                to="/prompts"
                className="text-gray-600 hover:text-indigo-600 font-medium transition-colors"
              >
                提示词库
              </Link>
              <Link
                to="/recharge"
                className="text-gray-600 hover:text-indigo-600 font-medium transition-colors"
              >
                充�?              </Link>
              <Link
                to="/membership"
                className="text-gray-600 hover:text-indigo-600 font-medium transition-colors"
              >
                会员
              </Link>
              <Link
                to="/feedback"
                className="text-gray-600 hover:text-indigo-600 font-medium transition-colors"
              >
                意见反馈
              </Link>

              {isLoggedIn ? (
                <>
                  <Link
                    to="/profile"
                    className="text-gray-600 hover:text-indigo-600 font-medium transition-colors"
                  >
                    个人中心
                  </Link>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full">
                      <span className="text-indigo-600 font-medium">{credits}</span>
                      <span className="text-gray-500 text-sm">额度</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-medium text-sm">
                          {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                      >
                        退�?                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-indigo-600 font-medium transition-colors"
                  >
                    登录
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                  >
                    注册
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900"
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
          </div>
        </div>

        {/* Mobile menu */}
        {showMobileMenu && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-3 space-y-1">
              <Link
                to="/workspace"
                className="block px-3 py-2.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                🎨 工作�?              </Link>
              <Link
                to="/prompts"
                className="block px-3 py-2.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                📝 提示词库
              </Link>
              <Link
                to="/recharge"
                className="block px-3 py-2.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                💰 充�?              </Link>
              <Link
                to="/membership"
                className="block px-3 py-2.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                👑 会员
              </Link>
              <Link
                to="/feedback"
                className="block px-3 py-2.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                💬 意见反馈
              </Link>
              {isLoggedIn ? (
                <>
                  <Link
                    to="/profile"
                    className="block px-3 py-2.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    👤 个人中心
                  </Link>
                  <div className="pt-2 mt-2 border-t">
                    <div className="flex items-center gap-3 px-3 py-2">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-medium text-sm">
                          {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{user?.name || '用户'}</p>
                        <p className="text-xs text-gray-500">{credits} 额度</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        handleLogout()
                        setShowMobileMenu(false)
                      }}
                      className="block w-full text-left px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      🚪 退出登�?                    </button>
                  </div>
                </>
              ) : (
                <div className="pt-2 mt-2 border-t space-y-1">
                  <Link
                    to="/login"
                    className="block px-3 py-2.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    登录
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2.5 text-indigo-600 bg-indigo-50 rounded-lg font-medium"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    注册
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <div className="text-xl font-bold text-white mb-1">Prompt Studio</div>
              <div className="text-sm">AI驱动的营销图片生成工具</div>
            </div>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm">
              <Link to="/workspace" className="hover:text-white transition-colors">工作�?/Link>
              <Link to="/prompts" className="hover:text-white transition-colors">提示词库</Link>
              <Link to="/recharge" className="hover:text-white transition-colors">充�?/Link>
              <Link to="/membership" className="hover:text-white transition-colors">会员</Link>
              <Link to="/feedback" className="hover:text-white transition-colors">意见反馈</Link>
              <Link to="/profile" className="hover:text-white transition-colors">个人中心</Link>
            </div>
          </div>
          <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-gray-800 text-center text-xs md:text-sm">
            © 2026 Prompt Studio. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Popup Announcement */}
      {popupAnnouncement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-indigo-600 px-4 py-3">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">📢 {popupAnnouncement.title}</h3>
                <button
                  onClick={dismissAnnouncement}
                  className="text-white hover:text-indigo-200 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-4">
              <p className="text-gray-700 whitespace-pre-wrap">{popupAnnouncement.content}</p>
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



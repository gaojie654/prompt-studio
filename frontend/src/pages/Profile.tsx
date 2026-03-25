import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  createdAt: string
}

interface Balance {
  credits: number
  tier: string
  expiresAt?: string
}

interface Transaction {
  id: string
  type: string
  amount: number
  credits: number
  description: string
  createdAt: string
}

interface GeneratedImage {
  id: string
  url: string
  width: number
  height: number
  createdAt: string
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null)
  const [balance, setBalance] = useState<Balance | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'history' | 'settings' | 'transactions'>('history')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/'
      return
    }

    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      const [userRes, balanceRes, txRes, imagesRes] = await Promise.all([
        axios.get(`${API_BASE}/users/me`, { headers }),
        axios.get(`${API_BASE}/v1/payment/balance`, { headers }),
        axios.get(`${API_BASE}/v1/payment/transactions?pageSize=20`, { headers }),
        axios.get(`${API_BASE}/images?pageSize=20`, { headers }),
      ])

      setUser(userRes.data.data || userRes.data)
      setBalance(balanceRes.data.balance)
      setTransactions(txRes.data.transactions || [])
      setImages(imagesRes.data.data || [])
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/'
        return
      }
      setError('获取数据失败，请刷新页面重试')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      TOPUP: '充值',
      MEMBERSHIP: '会员购买',
      CONSUME: '消耗',
      REFUND: '退款',
      DAILY_BONUS: '每日赠送',
    }
    return labels[type] || type
  }

  const getTransactionTypeColor = (type: string) => {
    if (type === 'TOPUP' || type === 'DAILY_BONUS' || type === 'REFUND') {
      return 'text-green-600'
    }
    if (type === 'MEMBERSHIP') {
      return 'text-purple-600'
    }
    return 'text-gray-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
        {error}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">
              {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {user?.name || '用户'}
            </h1>
            <p className="text-gray-500">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
            <div>
              <p className="text-white/80 text-sm">剩余积分</p>
              <p className="text-3xl font-bold">{balance?.credits ?? 0}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to="/recharge"
              className="flex-1 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-center text-sm font-medium transition-colors"
            >
              充值积分
            </Link>
          </div>
        </div>

        {/* Membership Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">👑</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">会员等级</p>
              <p className="text-2xl font-bold text-gray-900">{balance?.tier || 'FREE'}</p>
            </div>
          </div>
          {balance?.tier && balance.tier !== 'FREE' && balance.expiresAt && (
            <p className="text-xs text-gray-500">
              到期: {new Date(balance.expiresAt).toLocaleDateString('zh-CN')}
            </p>
          )}
          {!balance?.tier || balance.tier === 'FREE' ? (
            <Link
              to="/membership"
              className="mt-2 block w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-center text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-colors"
            >
              开通会员
            </Link>
          ) : null}
        </div>

        {/* Generated Images Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🎨</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">已生成</p>
              <p className="text-2xl font-bold text-gray-900">{images.length} 张</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Link
          to="/recharge"
          className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
        >
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
            <span className="text-2xl">💰</span>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">充值积分</div>
            <div className="text-sm text-gray-500">快速充值更多积分</div>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link
          to="/membership"
          className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <span className="text-2xl">👑</span>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">开通会员</div>
            <div className="text-sm text-gray-500">解锁更多权益</div>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'history'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              生成历史
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'transactions'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              交易记录
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              账户设置
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'history' && (
            <>
              {images.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-600 mb-4">还没有生成记录</p>
                  <Link
                    to="/workspace"
                    className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                  >
                    去生成图片
                  </Link>
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-4">
                  {images.map((image) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.url}
                        alt="Generated"
                        className="w-full aspect-square object-cover rounded-lg bg-gray-100"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        <button className="px-3 py-1.5 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100">
                          下载
                        </button>
                        <button className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                          使用
                        </button>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 text-xs text-white bg-black/50 rounded px-2 py-1">
                        {image.width}×{image.height}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'transactions' && (
            <>
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-gray-600 mb-4">暂无交易记录</p>
                  <Link
                    to="/recharge"
                    className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                  >
                    去充值
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.credits > 0 ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <span className={getTransactionTypeColor(tx.type)}>
                            {tx.credits > 0 ? '+' : ''}{tx.credits}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {getTransactionTypeLabel(tx.type)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(tx.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${tx.credits > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                          {tx.credits > 0 ? '+' : ''}{tx.credits}
                        </div>
                        {tx.amount > 0 && (
                          <div className="text-sm text-gray-500">¥{tx.amount}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Account Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">账户信息</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">邮箱</span>
                    <span className="text-gray-900">{user?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">昵称</span>
                    <span className="text-gray-900">{user?.name || '未设置'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">注册时间</span>
                    <span className="text-gray-900">
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('zh-CN')
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Upgrade */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">升级会员</h3>
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-bold mb-1">升级到 Pro 版本</h4>
                      <p className="text-white/80">解锁无限额度、优先生成、更多模板</p>
                    </div>
                    <Link
                      to="/membership"
                      className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-yellow-300 transition-colors"
                    >
                      立即升级
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

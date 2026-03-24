import { useState, useEffect, useCallback } from 'react'
import { getUserInfo, getTransactions, getImages, UserInfo, Transaction, ImageRecord } from '../api/client'

type TabType = 'overview' | 'history' | 'transactions'

const MEMBERSHIP_LABELS = {
  FREE: '免费版',
  MONTHLY: '月卡',
  YEARLY: '年卡',
}

const MEMBERSHIP_COLORS = {
  FREE: 'bg-gray-100 text-gray-700',
  MONTHLY: 'bg-blue-100 text-blue-700',
  YEARLY: 'bg-purple-100 text-purple-700',
}

export default function Profile() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [images, setImages] = useState<ImageRecord[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [historyPage, setHistoryPage] = useState(1)
  const [txPage, setTxPage] = useState(1)

  const fetchUserInfo = useCallback(async () => {
    try {
      const info = await getUserInfo()
      setUser(info)
    } catch (error) {
      console.error('Failed to fetch user info:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchImages = useCallback(async () => {
    try {
      const response = await getImages({ page: historyPage, pageSize: 10 })
      setImages(response.items)
    } catch (error) {
      console.error('Failed to fetch images:', error)
    }
  }, [historyPage])

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await getTransactions({ page: txPage, pageSize: 10 })
      setTransactions(response.items)
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    }
  }, [txPage])

  useEffect(() => {
    fetchUserInfo()
  }, [fetchUserInfo])

  useEffect(() => {
    if (activeTab === 'history') {
      fetchImages()
    } else if (activeTab === 'transactions') {
      fetchTransactions()
    }
  }, [activeTab, historyPage, txPage, fetchImages, fetchTransactions])

  const handleRecharge = () => {
    // TODO: Implement recharge flow
    alert('充值功能开发中...')
  }

  const handleBuyMembership = () => {
    // TODO: Implement membership purchase flow
    alert('购买会员功能开发中...')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">获取用户信息失败</div>
      </div>
    )
  }

  return (
    <div>
      {/* User info header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl text-gray-400">{user.name.charAt(0).toUpperCase()}</span>
            )}
          </div>

          {/* User details */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
              <span className={`px-2 py-0.5 text-xs rounded-full ${MEMBERSHIP_COLORS[user.membership]}`}>
                {MEMBERSHIP_LABELS[user.membership]}
              </span>
            </div>
            <p className="text-gray-500 mb-2">{user.phone}</p>
            <p className="text-sm text-gray-400">
              注册时间: {new Date(user.createdAt).toLocaleDateString('zh-CN')}
            </p>
          </div>

          {/* Balance card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white min-w-[160px]">
            <div className="text-sm opacity-80 mb-1">账户余额</div>
            <div className="text-2xl font-bold mb-1">¥{user.balance.toFixed(2)}</div>
            <div className="text-xs opacity-80">
              剩余配额: {user.quota - user.usedQuota} / {user.quota}
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <button
          onClick={handleRecharge}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="text-sm font-medium">充值余额</span>
        </button>
        <button
          onClick={handleBuyMembership}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <span className="text-sm font-medium">购买会员</span>
        </button>
        <a
          href="/prompts?filter=favorites"
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="text-sm font-medium">我的收藏</span>
        </a>
        <button
          onClick={() => setActiveTab('history')}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium">生成历史</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {[
            { key: 'overview', label: '账户概览' },
            { key: 'history', label: '生成历史' },
            { key: 'transactions', label: '消费记录' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">配额使用情况</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">已使用</span>
                <span className="font-medium">{user.usedQuota} / {user.quota}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(user.usedQuota / user.quota) * 100}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-semibold text-gray-900">{user.quota}</div>
                <div className="text-sm text-gray-500">总配额</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-blue-600">{user.quota - user.usedQuota}</div>
                <div className="text-sm text-gray-500">剩余配额</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-gray-900">{user.usedQuota}</div>
                <div className="text-sm text-gray-500">已使用</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          {images.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500">暂无生成记录</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {images.map((img) => (
                  <div key={img.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="aspect-square bg-gray-100">
                      <img
                        src={img.thumbnailUrl || img.imageUrl}
                        alt={img.prompt}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-2">
                      <p className="text-xs text-gray-500 line-clamp-1">{img.prompt}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {img.platform} · {new Date(img.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                  disabled={historyPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  上一页
                </button>
                <button
                  onClick={() => setHistoryPage((p) => p + 1)}
                  disabled={images.length < 10}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  下一页
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white rounded-lg border border-gray-200">
          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500">暂无消费记录</p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">时间</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">类型</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">描述</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">金额</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b last:border-b-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(tx.createdAt).toLocaleString('zh-CN')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          tx.type === 'CHARGE'
                            ? 'bg-green-100 text-green-700'
                            : tx.type === 'MEMBERSHIP'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {tx.type === 'CHARGE' ? '充值' : tx.type === 'MEMBERSHIP' ? '会员' : '消费'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{tx.description}</td>
                      <td className={`px-4 py-3 text-sm text-right font-medium ${
                        tx.amount > 0 ? 'text-green-600' : 'text-gray-900'
                      }`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-center gap-2 p-4">
                <button
                  onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                  disabled={txPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  上一页
                </button>
                <button
                  onClick={() => setTxPage((p) => p + 1)}
                  disabled={transactions.length < 10}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  下一页
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

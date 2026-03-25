import { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

function LineChart({ data, maxValue, color, height = 120 }: { data: { date: string; count: number }[]; maxValue: number; color: string; height?: number }) {
  if (!data || data.length === 0) return <div className="h-32 flex items-center justify-center text-gray-400 text-sm">暂无数据</div>

  const points = data.map(
    (d, i) => `${(i / (data.length - 1)) * 100},${height - (d.count / maxValue) * height}`
  )
  const pathD = points.join(' L ')

  return (
    <svg viewBox={`0 0 100 ${height}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.3 }} />
          <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <path
        d={`M ${pathD} L 100,${height} L 0,${height} Z`}
        fill={`url(#grad-${color.replace('#', '')})`}
      />
      <path
        d={`M ${pathD}`}
        fill="none"
        stroke={color}
        strokeWidth="0.5"
      />
    </svg>
  )
}

export default function Statistics() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('adminToken')
        const response = await axios.get(`${API_BASE}/v1/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setStats(response.data.data)
      } catch (err) {
        console.error('Failed to fetch statistics')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">数据统计</h2>
        <div className="grid grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-32 mb-4" />
              <div className="h-32 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const userTrend = stats?.userTrend || []
  const revenueTrend = (stats?.revenueTrend || []).map((d: any) => ({ date: d.date, count: d.amount }))
  const maxUsers = Math.max(...userTrend.map((d: any) => d.count), 1)
  const maxRevenue = Math.max(...revenueTrend.map((d: any) => d.count), 1)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">数据统计</h2>
      </div>

      {/* 汇总卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">今日新增用户</div>
          <div className="text-2xl font-bold text-blue-600">{stats?.todayUsers || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">今日订单数</div>
          <div className="text-2xl font-bold text-green-600">{stats?.todayOrders || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">今日收入</div>
          <div className="text-2xl font-bold text-orange-600">¥{Number(stats?.todayRevenue || 0).toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">总用户数</div>
          <div className="text-2xl font-bold text-purple-600">{(stats?.totalUsers || 0).toLocaleString()}</div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 用户增长曲线 */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">近7天用户增长趋势</h3>
          <LineChart data={userTrend} maxValue={maxUsers} color="#3b82f6" />
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>第1天</span>
            <span>第{userTrend.length}天</span>
          </div>
        </div>

        {/* 收入趋势 */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">近7天收入趋势</h3>
          <LineChart data={revenueTrend} maxValue={maxRevenue} color="#10b981" />
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>第1天</span>
            <span>第{revenueTrend.length}天</span>
          </div>
        </div>
      </div>
    </div>
  )
}

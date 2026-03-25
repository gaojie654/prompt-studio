import { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

function BarChart({ data, maxValue, color }: { data: { date: string; count: number }[]; maxValue: number; color: string }) {
  return (
    <div className="flex items-end gap-3 h-32">
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className={`w-full ${color} rounded-t transition-all`}
            style={{ height: `${maxValue > 0 ? (item.count / maxValue) * 100 : 0}%` }}
          />
          <span className="text-xs text-gray-500">{item.date.slice(5)}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    todayUsers: 0,
    todayOrders: 0,
    todayRevenue: 0,
    todayImages: 0,
    totalUsers: 0,
    totalRevenue: 0,
    userTrend: [] as { date: string; count: number }[],
    revenueTrend: [] as { date: string; amount: number }[],
  })
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
        console.error('Failed to fetch stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const maxUsers = Math.max(...stats.userTrend.map((d) => d.count), 1)
  const maxRevenue = Math.max(...stats.revenueTrend.map((d) => d.amount), 1)

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">工作台</h2>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">工作台</h2>

      {/* 关键数据卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">今日新增用户</div>
          <div className="text-2xl font-bold text-blue-600">{stats.todayUsers}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">今日订单数</div>
          <div className="text-2xl font-bold text-green-600">{stats.todayOrders}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">今日收入</div>
          <div className="text-2xl font-bold text-orange-600">¥{Number(stats.todayRevenue).toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">今日生成图片数</div>
          <div className="text-2xl font-bold text-purple-600">{stats.todayImages.toLocaleString()}</div>
        </div>
      </div>

      {/* 汇总卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">总用户数</div>
          <div className="text-2xl font-bold text-blue-600">{stats.totalUsers.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">总收入</div>
          <div className="text-2xl font-bold text-green-600">¥{Number(stats.totalRevenue).toLocaleString()}</div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">近7天用户增长趋势</h3>
          <BarChart data={stats.userTrend} maxValue={maxUsers} color="bg-blue-500" />
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">近7天收入趋势</h3>
          <BarChart
            data={stats.revenueTrend.map((d) => ({ date: d.date, count: d.amount }))}
            maxValue={maxRevenue}
            color="bg-green-500"
          />
        </div>
      </div>
    </div>
  )
}

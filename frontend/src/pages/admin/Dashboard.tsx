import { useState, useEffect } from 'react'

// 模拟数据
const mockStats = {
  todayUsers: 128,
  todayOrders: 45,
  todayRevenue: 2890,
  todayImages: 1523,
}

const mockUserGrowth = [
  { day: '周一', value: 85 },
  { day: '周二', value: 102 },
  { day: '周三', value: 78 },
  { day: '周四', value: 156 },
  { day: '周五', value: 134 },
  { day: '周六', value: 198 },
  { day: '周日', value: 128 },
]

const mockRevenueGrowth = [
  { day: '周一', value: 1200 },
  { day: '周二', value: 1850 },
  { day: '周三', value: 980 },
  { day: '周四', value: 2100 },
  { day: '周五', value: 1680 },
  { day: '周六', value: 2560 },
  { day: '周日', value: 2890 },
]

function BarChart({ data, maxValue, color }: { data: { day: string; value: number }[]; maxValue: number; color: string }) {
  return (
    <div className="flex items-end gap-3 h-32">
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className={`w-full ${color} rounded-t transition-all`}
            style={{ height: `${(item.value / maxValue) * 100}%` }}
          />
          <span className="text-xs text-gray-500">{item.day}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(mockStats)
  const maxUsers = Math.max(...mockUserGrowth.map((d) => d.value))
  const maxRevenue = Math.max(...mockRevenueGrowth.map((d) => d.value))

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">工作台</h2>

      {/* 关键数据卡片 */}
      <div className="grid grid-cols-4 gap-4">
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
          <div className="text-2xl font-bold text-orange-600">¥{stats.todayRevenue.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">今日生成图片数</div>
          <div className="text-2xl font-bold text-purple-600">{stats.todayImages.toLocaleString()}</div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">近7天用户增长趋势</h3>
          <BarChart data={mockUserGrowth} maxValue={maxUsers} color="bg-blue-500" />
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">近7天收入趋势</h3>
          <BarChart data={mockRevenueGrowth} maxValue={maxRevenue} color="bg-green-500" />
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'

// 模拟近30天数据
const generateData = (base: number, variance: number) =>
  Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    value: Math.floor(base + Math.random() * variance - variance / 2),
  }))

const mockUserGrowth = generateData(100, 80)
const mockRevenue = generateData(2500, 2000)
const mockTopPrompts = [
  { name: '商品主图描述生成器', count: 45230 },
  { name: '小红书爆款文案', count: 38920 },
  { name: '抖音短视频脚本', count: 32450 },
  { name: '淘宝详情页优化', count: 28900 },
  { name: '朋友圈营销文案', count: 21340 },
]

const mockPlatformUsage = [
  { label: '微信小程序', value: 45 },
  { label: 'H5网页', value: 30 },
  { label: 'App', value: 25 },
]

function LineChart({ data, maxValue, color, height = 120 }: { data: { day: number; value: number }[]; maxValue: number; color: string; height?: number }) {
  const points = data.map(
    (d, i) => `${(i / (data.length - 1)) * 100},${height - (d.value / maxValue) * height}`
  )
  const pathD = points.join(' L ')

  return (
    <svg viewBox={`0 0 100 ${height}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.3 }} />
          <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <path
        d={`M ${pathD} L 100,${height} L 0,${height} Z`}
        fill={`url(#grad-${color})`}
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

function PieChart({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const colors = ['#3b82f6', '#10b981', '#f59e0b']
  let currentAngle = 0

  const slices = data.map((d, i) => {
    const angle = (d.value / total) * 360
    const startAngle = currentAngle
    currentAngle += angle
    const x1 = 50 + 40 * Math.cos((startAngle - 90) * (Math.PI / 180))
    const y1 = 50 + 40 * Math.sin((startAngle - 90) * (Math.PI / 180))
    const x2 = 50 + 40 * Math.cos((startAngle + angle - 90) * (Math.PI / 180))
    const y2 = 50 + 40 * Math.sin((startAngle + angle - 90) * (Math.PI / 180))
    const largeArc = angle > 180 ? 1 : 0
    return { ...d, x1, y1, x2, y2, largeArc, color: colors[i] }
  })

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="w-32 h-32">
        {slices.map((s, i) => (
          <path
            key={i}
            d={`M 50,50 L ${s.x1},${s.y1} A 40,40 0 ${s.largeArc},1 ${s.x2},${s.y2} Z`}
            fill={s.color}
          />
        ))}
      </svg>
      <div className="space-y-2">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: s.color }} />
            <span className="text-gray-600">{s.label}</span>
            <span className="text-gray-900 font-medium">{s.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Statistics() {
  const [timeRange] = useState('30天')

  const maxUsers = Math.max(...mockUserGrowth.map((d) => d.value))
  const maxRevenue = Math.max(...mockRevenue.map((d) => d.value))
  const maxPromptCount = Math.max(...mockTopPrompts.map((d) => d.count))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">数据统计</h2>
        <select
          value={timeRange}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option>近7天</option>
          <option>近30天</option>
          <option>近90天</option>
        </select>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 用户增长曲线 */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">用户增长曲线（近30天）</h3>
          <LineChart data={mockUserGrowth} maxValue={maxUsers} color="#3b82f6" />
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>第1天</span>
            <span>第30天</span>
          </div>
        </div>

        {/* 收入趋势 */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">收入趋势（近30天）</h3>
          <LineChart data={mockRevenue} maxValue={maxRevenue} color="#10b981" />
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>第1天</span>
            <span>第30天</span>
          </div>
        </div>

        {/* 平台使用分布 */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">平台使用分布</h3>
          <PieChart data={mockPlatformUsage} />
        </div>

        {/* Top提示词使用榜 */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Top提示词使用榜</h3>
          <div className="space-y-3">
            {mockTopPrompts.map((prompt, i) => (
              <div key={prompt.name} className="flex items-center gap-3">
                <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-gray-700 truncate">{prompt.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(prompt.count / maxPromptCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-16 text-right">
                    {prompt.count.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

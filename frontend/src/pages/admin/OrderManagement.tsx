import { useState } from 'react'

interface Order {
  id: string
  orderNo: string
  userPhone: string
  type: '充值' | '会员'
  amount: number
  payMethod: '微信' | '支付宝'
  status: '待支付' | '已支付' | '已过期'
  createdAt: string
}

const mockOrders: Order[] = [
  { id: '1', orderNo: 'PS20260325001', userPhone: '138****1234', type: '会员', amount: 299, payMethod: '微信', status: '已支付', createdAt: '2026-03-25 10:23' },
  { id: '2', orderNo: 'PS20260325002', userPhone: '139****5678', type: '充值', amount: 100, payMethod: '支付宝', status: '待支付', createdAt: '2026-03-25 11:05' },
  { id: '3', orderNo: 'PS20260324001', userPhone: '137****9012', type: '会员', amount: 299, payMethod: '微信', status: '已支付', createdAt: '2026-03-24 09:30' },
  { id: '4', orderNo: 'PS20260324002', userPhone: '136****3456', type: '充值', amount: 500, payMethod: '支付宝', status: '已过期', createdAt: '2026-03-24 14:20' },
  { id: '5', orderNo: 'PS20260323001', userPhone: '135****7890', type: '会员', amount: 2999, payMethod: '微信', status: '已支付', createdAt: '2026-03-23 16:45' },
  { id: '6', orderNo: 'PS20260323002', userPhone: '134****2345', type: '充值', amount: 200, payMethod: '支付宝', status: '已支付', createdAt: '2026-03-23 18:10' },
  { id: '7', orderNo: 'PS20260322001', userPhone: '133****6789', type: '会员', amount: 299, payMethod: '微信', status: '已支付', createdAt: '2026-03-22 08:00' },
  { id: '8', orderNo: 'PS20260322002', userPhone: '132****0123', type: '充值', amount: 1000, payMethod: '支付宝', status: '已支付', createdAt: '2026-03-22 20:30' },
]

const statuses = ['全部', '待支付', '已支付', '已过期']
const types = ['全部', '充值', '会员']

export default function OrderManagement() {
  const [orders] = useState(mockOrders)
  const [statusFilter, setStatusFilter] = useState('全部')
  const [typeFilter, setTypeFilter] = useState('全部')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  const filteredOrders = orders.filter((order) => {
    const matchStatus = statusFilter === '全部' || order.status === statusFilter
    const matchType = typeFilter === '全部' || order.type === typeFilter
    return matchStatus && matchType
  })

  const totalPages = Math.ceil(filteredOrders.length / pageSize)
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const statusColor = (status: string) => {
    switch (status) {
      case '已支付':
        return 'bg-green-100 text-green-700'
      case '待支付':
        return 'bg-yellow-100 text-yellow-700'
      case '已过期':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">订单管理</h2>

      {/* 筛选 */}
      <div className="flex gap-4 items-center flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setCurrentPage(1)
          }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s === '全部' ? '全部状态' : s}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value)
            setCurrentPage(1)
          }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {types.map((t) => (
            <option key={t} value={t}>
              {t === '全部' ? '全部类型' : t}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateRange.start}
          onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-gray-400">至</span>
        <input
          type="date"
          value={dateRange.end}
          onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">订单号</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">用户</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">类型</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">金额</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">支付方式</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">状态</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-blue-600 font-mono text-xs">{order.orderNo}</td>
                <td className="px-4 py-3 text-gray-900">{order.userPhone}</td>
                <td className="px-4 py-3 text-gray-900">{order.type}</td>
                <td className="px-4 py-3 text-gray-900 font-medium">¥{order.amount}</td>
                <td className="px-4 py-3 text-gray-900">{order.payMethod}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{order.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">共 {filteredOrders.length} 条记录</span>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            上一页
          </button>
          <span className="px-3 py-1 text-sm">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  )
}

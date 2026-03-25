import { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

interface Order {
  id: string
  orderNo: string
  userId: string
  userEmail: string
  type: string
  amount: number
  paymentMethod: string
  status: string
  paidAt: string | null
  createdAt: string
}

const statuses = ['全部', '待支付', '已支付', '已过期', '已退款']
const types = ['全部', '充值', '会员']

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [statusFilter, setStatusFilter] = useState('全部')
  const [typeFilter, setTypeFilter] = useState('全部')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const pageSize = 10

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(pageSize),
      })
      if (statusFilter !== '全部') params.append('status', statusFilter === '待支付' ? 'PENDING' : statusFilter === '已支付' ? 'PAID' : statusFilter === '已过期' ? 'EXPIRED' : statusFilter === '已退款' ? 'REFUNDED' : '')
      if (typeFilter !== '全部') params.append('type', typeFilter === '充值' ? 'RECHARGE' : 'MEMBERSHIP')
      if (dateRange.start) params.append('startDate', dateRange.start)
      if (dateRange.end) params.append('endDate', dateRange.end)

      const response = await axios.get(`${API_BASE}/v1/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = response.data.data
      setOrders(data.orders)
      setTotal(data.pagination.total)
      setTotalPages(data.pagination.totalPages)
    } catch (err) {
      console.error('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [currentPage, statusFilter, typeFilter, dateRange.start, dateRange.end])

  const statusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-700'
      case 'PENDING': return 'bg-yellow-100 text-yellow-700'
      case 'EXPIRED': return 'bg-red-100 text-red-700'
      case 'REFUNDED': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case 'PAID': return '已支付'
      case 'PENDING': return '待支付'
      case 'EXPIRED': return '已过期'
      case 'REFUNDED': return '已退款'
      default: return status
    }
  }

  const typeLabel = (type: string) => {
    switch (type) {
      case 'RECHARGE': return '充值'
      case 'MEMBERSHIP': return '会员'
      default: return type
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
          onChange={(e) => {
            setDateRange((prev) => ({ ...prev, start: e.target.value }))
            setCurrentPage(1)
          }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-gray-400">至</span>
        <input
          type="date"
          value={dateRange.end}
          onChange={(e) => {
            setDateRange((prev) => ({ ...prev, end: e.target.value }))
            setCurrentPage(1)
          }}
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
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">加载中...</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无订单</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-blue-600 font-mono text-xs">{order.orderNo || order.id.slice(0, 12)}</td>
                  <td className="px-4 py-3 text-gray-900">{order.userEmail}</td>
                  <td className="px-4 py-3 text-gray-900">{typeLabel(order.type)}</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">¥{Number(order.amount)}</td>
                  <td className="px-4 py-3 text-gray-900">{order.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor(order.status)}`}>
                      {statusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(order.createdAt).toLocaleString('zh-CN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">共 {total} 条记录</span>
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

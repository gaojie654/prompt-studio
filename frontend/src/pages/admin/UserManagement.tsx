import { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

interface User {
  id: string
  email: string
  name: string | null
  memberType: string
  balance: number
  isActive: boolean
  createdAt: string
}

const memberTypes = ['全部', 'FREE', '月卡', '年卡']

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [memberFilter, setMemberFilter] = useState('全部')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const pageSize = 10

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(pageSize),
      })
      if (search) params.append('search', search)
      if (memberFilter !== '全部') params.append('memberType', memberFilter)

      const response = await axios.get(`${API_BASE}/v1/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = response.data.data
      setUsers(data.users)
      setTotal(data.pagination.total)
      setTotalPages(data.pagination.totalPages)
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [currentPage, memberFilter])

  useEffect(() => {
    const debounce = setTimeout(() => {
      setCurrentPage(1)
      fetchUsers()
    }, 300)
    return () => clearTimeout(debounce)
  }, [search])

  const toggleStatus = async (userId: string) => {
    try {
      const token = localStorage.getItem('adminToken')
      await axios.post(
        `${API_BASE}/v1/admin/users/${userId}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isActive: !u.isActive } : u
        )
      )
    } catch (err) {
      console.error('Failed to toggle user:', err)
    }
  }

  const formatMemberType = (tier: string) => {
    switch (tier) {
      case 'YEARLY': return '年卡'
      case 'MONTHLY': return '月卡'
      default: return 'FREE'
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">用户管理</h2>

      {/* 搜索和筛选 */}
      <div className="flex gap-4 items-center flex-wrap">
        <input
          type="text"
          placeholder="搜索邮箱/昵称"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={memberFilter}
          onChange={(e) => {
            setMemberFilter(e.target.value)
            setCurrentPage(1)
          }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {memberTypes.map((type) => (
            <option key={type} value={type}>
              {type === '全部' ? '全部会员' : type}
            </option>
          ))}
        </select>
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">ID</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">邮箱</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">昵称</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">会员类型</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">余额</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">注册时间</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">加载中...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无用户</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{user.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-gray-900">{user.email}</td>
                  <td className="px-4 py-3 text-gray-900">{user.name || '-'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        user.memberType === 'YEARLY'
                          ? 'bg-purple-100 text-purple-700'
                          : user.memberType === 'MONTHLY'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {formatMemberType(user.memberType)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-900">¥{user.balance}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatus(user.id)}
                      className={`px-2 py-1 text-xs rounded ${
                        user.isActive
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      } transition-colors`}
                    >
                      {user.isActive ? '禁用' : '启用'}
                    </button>
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

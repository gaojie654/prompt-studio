import { useState } from 'react'

interface User {
  id: string
  phone: string
  nickname: string
  memberType: 'FREE' | '月卡' | '年卡'
  balance: number
  createdAt: string
  status: '正常' | '禁用'
}

const mockUsers: User[] = [
  { id: '1', phone: '138****1234', nickname: '张三', memberType: '年卡', balance: 580, createdAt: '2026-03-01', status: '正常' },
  { id: '2', phone: '139****5678', nickname: '李四', memberType: '月卡', balance: 120, createdAt: '2026-03-05', status: '正常' },
  { id: '3', phone: '137****9012', nickname: '王五', memberType: 'FREE', balance: 0, createdAt: '2026-03-10', status: '正常' },
  { id: '4', phone: '136****3456', nickname: '赵六', memberType: '年卡', balance: 1200, createdAt: '2026-03-12', status: '禁用' },
  { id: '5', phone: '135****7890', nickname: '钱七', memberType: '月卡', balance: 50, createdAt: '2026-03-15', status: '正常' },
  { id: '6', phone: '134****2345', nickname: '孙八', memberType: 'FREE', balance: 0, createdAt: '2026-03-18', status: '正常' },
  { id: '7', phone: '133****6789', nickname: '周九', memberType: '年卡', balance: 3600, createdAt: '2026-03-20', status: '正常' },
  { id: '8', phone: '132****0123', nickname: '吴十', memberType: '月卡', balance: 200, createdAt: '2026-03-22', status: '正常' },
]

const memberTypes = ['全部', 'FREE', '月卡', '年卡']

export default function UserManagement() {
  const [users, setUsers] = useState(mockUsers)
  const [search, setSearch] = useState('')
  const [memberFilter, setMemberFilter] = useState('全部')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  const filteredUsers = users.filter((user) => {
    const matchSearch =
      user.phone.includes(search) || user.nickname.includes(search)
    const matchMember =
      memberFilter === '全部' || user.memberType === memberFilter
    return matchSearch && matchMember
  })

  const totalPages = Math.ceil(filteredUsers.length / pageSize)
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const toggleStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, status: u.status === '正常' ? '禁用' : '正常' }
          : u
      )
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">用户管理</h2>

      {/* 搜索和筛选 */}
      <div className="flex gap-4 items-center">
        <input
          type="text"
          placeholder="搜索手机号/昵称"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setCurrentPage(1)
          }}
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
              <th className="px-4 py-3 text-left text-gray-600 font-medium">手机号</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">昵称</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">会员类型</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">余额</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">注册时间</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900">{user.id}</td>
                <td className="px-4 py-3 text-gray-900">{user.phone}</td>
                <td className="px-4 py-3 text-gray-900">{user.nickname}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      user.memberType === '年卡'
                        ? 'bg-purple-100 text-purple-700'
                        : user.memberType === '月卡'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {user.memberType}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-900">¥{user.balance}</td>
                <td className="px-4 py-3 text-gray-500">{user.createdAt}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleStatus(user.id)}
                    className={`px-2 py-1 text-xs rounded ${
                      user.status === '正常'
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    } transition-colors mr-2`}
                  >
                    {user.status === '正常' ? '禁用' : '启用'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">
          共 {filteredUsers.length} 条记录
        </span>
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

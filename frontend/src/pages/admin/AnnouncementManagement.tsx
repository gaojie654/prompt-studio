import { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

interface Announcement {
  id: string
  title: string
  content: string
  isPinned: boolean
  isPopup: boolean
  isActive: boolean
  startAt: string | null
  endAt: string | null
  createdAt: string
  updatedAt: string
}

interface AnnouncementListResult {
  announcements: Announcement[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function AnnouncementManagement() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showModal, setShowModal] = useState<{
    show: boolean
    mode: 'create' | 'edit'
    data: Partial<Announcement>
  }>({
    show: false,
    mode: 'create',
    data: {},
  })
  const pageSize = 10

  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await axios.get(`${API_BASE}/v1/admin/announcements`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: currentPage, limit: pageSize },
      })
      const data = response.data.data as AnnouncementListResult
      setAnnouncements(data.announcements)
      setTotal(data.pagination.total)
      setTotalPages(data.pagination.totalPages)
    } catch (err) {
      console.error('Failed to fetch announcements:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [currentPage])

  const handleCreate = async () => {
    const { title, content, isPinned, isPopup, isActive, startAt, endAt } = showModal.data
    if (!title?.trim() || !content?.trim()) {
      alert('标题和内容不能为空')
      return
    }
    try {
      const token = localStorage.getItem('adminToken')
      await axios.post(
        `${API_BASE}/v1/admin/announcements`,
        {
          title,
          content,
          isPinned: isPinned || false,
          isPopup: isPopup || false,
          isActive: isActive !== undefined ? isActive : true,
          startAt: startAt || null,
          endAt: endAt || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setShowModal({ show: false, mode: 'create', data: {} })
      fetchAnnouncements()
    } catch (err) {
      console.error('Failed to create announcement:', err)
      alert('创建失败，请重试')
    }
  }

  const handleUpdate = async () => {
    const { id, title, content, isPinned, isPopup, isActive, startAt, endAt } = showModal.data
    if (!id || !title?.trim() || !content?.trim()) {
      alert('标题和内容不能为空')
      return
    }
    try {
      const token = localStorage.getItem('adminToken')
      await axios.put(
        `${API_BASE}/v1/admin/announcements/${id}`,
        {
          title,
          content,
          isPinned: isPinned || false,
          isPopup: isPopup || false,
          isActive: isActive !== undefined ? isActive : true,
          startAt: startAt || null,
          endAt: endAt || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setShowModal({ show: false, mode: 'create', data: {} })
      fetchAnnouncements()
    } catch (err) {
      console.error('Failed to update announcement:', err)
      alert('更新失败，请重试')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条公告吗？')) return
    try {
      const token = localStorage.getItem('adminToken')
      await axios.delete(`${API_BASE}/v1/admin/announcements/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchAnnouncements()
    } catch (err) {
      console.error('Failed to delete announcement:', err)
      alert('删除失败，请重试')
    }
  }

  const handleTogglePinned = async (id: string) => {
    try {
      const token = localStorage.getItem('adminToken')
      await axios.put(
        `${API_BASE}/v1/admin/announcements/${id}/toggle-pinned`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchAnnouncements()
    } catch (err) {
      console.error('Failed to toggle pinned:', err)
    }
  }

  const handleToggleActive = async (id: string) => {
    try {
      const token = localStorage.getItem('adminToken')
      await axios.put(
        `${API_BASE}/v1/admin/announcements/${id}/toggle-active`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchAnnouncements()
    } catch (err) {
      console.error('Failed to toggle active:', err)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">公告管理</h2>
        <button
          onClick={() => setShowModal({ show: true, mode: 'create', data: {} })}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
        >
          创建公告
        </button>
      </div>

      {/* Announcement List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">标题</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">状态</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">置顶</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">弹窗</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">有效期</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">创建时间</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">加载中...</td>
              </tr>
            ) : announcements.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无公告</td>
              </tr>
            ) : (
              announcements.map((ann) => (
                <tr key={ann.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{ann.title}</div>
                    <div className="text-xs text-gray-400 truncate max-w-xs">{ann.content}</div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(ann.id)}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        ann.isActive
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      } transition-colors`}
                    >
                      {ann.isActive ? '启用' : '禁用'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleTogglePinned(ann.id)}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        ann.isPinned
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      } transition-colors`}
                    >
                      {ann.isPinned ? '是' : '否'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      ann.isPopup ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {ann.isPopup ? '是' : '否'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {ann.startAt || '—'} ~ {ann.endAt || '长期'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(ann.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowModal({ show: true, mode: 'edit', data: ann })}
                        className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(ann.id)}
                        className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
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
      )}

      {/* Create/Edit Modal */}
      {showModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {showModal.mode === 'create' ? '创建公告' : '编辑公告'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
                <input
                  type="text"
                  value={showModal.data.title || ''}
                  onChange={(e) => setShowModal({ ...showModal, data: { ...showModal.data, title: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="公告标题"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">内容 *</label>
                <textarea
                  value={showModal.data.content || ''}
                  onChange={(e) => setShowModal({ ...showModal, data: { ...showModal.data, content: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={6}
                  placeholder="公告内容（支持富文本）"
                />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showModal.data.isPinned || false}
                    onChange={(e) => setShowModal({ ...showModal, data: { ...showModal.data, isPinned: e.target.checked } })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">置顶</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showModal.data.isPopup || false}
                    onChange={(e) => setShowModal({ ...showModal, data: { ...showModal.data, isPopup: e.target.checked } })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">弹窗显示</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showModal.data.isActive !== undefined ? showModal.data.isActive : true}
                    onChange={(e) => setShowModal({ ...showModal, data: { ...showModal.data, isActive: e.target.checked } })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">启用</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
                  <input
                    type="datetime-local"
                    value={showModal.data.startAt || ''}
                    onChange={(e) => setShowModal({ ...showModal, data: { ...showModal.data, startAt: e.target.value || null } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
                  <input
                    type="datetime-local"
                    value={showModal.data.endAt || ''}
                    onChange={(e) => setShowModal({ ...showModal, data: { ...showModal.data, endAt: e.target.value || null } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowModal({ show: false, mode: 'create', data: {} })}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={showModal.mode === 'create' ? handleCreate : handleUpdate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                {showModal.mode === 'create' ? '创建' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

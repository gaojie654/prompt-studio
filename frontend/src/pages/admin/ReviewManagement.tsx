import { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

interface Review {
  id: string
  imageId: string
  imageUrl: string
  imageWidth: number | null
  imageHeight: number | null
  userId: string
  userEmail: string
  promptTitle: string | null
  status: 'PENDING' | 'PASSED' | 'REJECTED'
  rejectReason: string | null
  reviewerId: string | null
  reviewedAt: string | null
  createdAt: string
}

interface ReviewStats {
  pending: number
  passed: number
  rejected: number
  total: number
  todayPending: number
  todayPassed: number
  todayRejected: number
}

type StatusFilter = 'ALL' | 'PENDING' | 'PASSED' | 'REJECTED'

export default function ReviewManagement() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [rejectModal, setRejectModal] = useState<{ show: boolean; reviewId: string; reason: string }>({
    show: false,
    reviewId: '',
    reason: '',
  })
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const pageSize = 12

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await axios.get(`${API_BASE}/v1/admin/reviews/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setStats(response.data.data)
    } catch (err) {
      console.error('Failed to fetch review statistics')
    }
  }

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(pageSize),
      })
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter)
      }

      const response = await axios.get(`${API_BASE}/v1/admin/reviews?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = response.data.data
      setReviews(data.reviews)
      setTotal(data.pagination.total)
      setTotalPages(data.pagination.totalPages)
    } catch (err) {
      console.error('Failed to fetch reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
    fetchReviews()
  }, [statusFilter])

  useEffect(() => {
    fetchReviews()
  }, [currentPage])

  const handlePass = async (reviewId: string) => {
    try {
      const token = localStorage.getItem('adminToken')
      await axios.post(
        `${API_BASE}/v1/admin/reviews/${reviewId}/pass`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchReviews()
      fetchStats()
    } catch (err) {
      console.error('Failed to pass review')
      alert('操作失败，请重试')
    }
  }

  const handleReject = async () => {
    if (!rejectModal.reason.trim()) {
      alert('请填写拒绝原因')
      return
    }
    try {
      const token = localStorage.getItem('adminToken')
      await axios.post(
        `${API_BASE}/v1/admin/reviews/${rejectModal.reviewId}/reject`,
        { reason: rejectModal.reason },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setRejectModal({ show: false, reviewId: '', reason: '' })
      fetchReviews()
      fetchStats()
    } catch (err) {
      console.error('Failed to reject review')
      alert('操作失败，请重试')
    }
  }

  const getStatusBadge = (status: Review['status']) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">待审核</span>
      case 'PASSED':
        return <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">已通过</span>
      case 'REJECTED':
        return <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">已拒绝</span>
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">内容审核</h2>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">待审核</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-xs text-gray-400">今日+{stats.todayPending}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">已通过</div>
            <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
            <div className="text-xs text-gray-400">今日+{stats.todayPassed}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">已拒绝</div>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-xs text-gray-400">今日+{stats.todayRejected}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">总计</div>
            <div className="text-2xl font-bold text-gray-600">{stats.total}</div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['ALL', 'PENDING', 'PASSED', 'REJECTED'] as StatusFilter[]).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {status === 'ALL' ? '全部' : status === 'PENDING' ? '待审核' : status === 'PASSED' ? '已通过' : '已拒绝'}
          </button>
        ))}
      </div>

      {/* Image Grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">加载中...</div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center text-gray-400">暂无数据</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {reviews.map((review) => (
              <div key={review.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Image */}
                <div
                  className="relative cursor-pointer group"
                  onClick={() => setSelectedImage(review.imageUrl)}
                >
                  <img
                    src={review.imageUrl}
                    alt="review"
                    className="w-full h-48 object-cover bg-gray-100"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="%23f3f4f6" width="200" height="200"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239CA3AF">图片加载失败</text></svg>'
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 text-sm">点击查看大图</span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    {getStatusBadge(review.status)}
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 truncate" title={review.userEmail}>
                    {review.userEmail}
                  </div>
                  {review.promptTitle && (
                    <div className="text-xs text-gray-400 truncate" title={review.promptTitle}>
                      提示词：{review.promptTitle}
                    </div>
                  )}
                  {review.status === 'REJECTED' && review.rejectReason && (
                    <div className="text-xs text-red-500">
                      拒绝原因：{review.rejectReason}
                    </div>
                  )}

                  {/* Actions */}
                  {review.status === 'PENDING' && (
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handlePass(review.id)}
                        className="flex-1 px-3 py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                      >
                        通过
                      </button>
                      <button
                        onClick={() => setRejectModal({ show: true, reviewId: review.id, reason: '' })}
                        className="flex-1 px-3 py-1.5 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                      >
                        拒绝
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">共{total}条记录</span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              上页�?            </button>
            <span className="px-3 py-1 text-sm">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              下页
            </button>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-4xl max-h-[90vh] p-4">
            <img
              src={selectedImage}
              alt="preview"
              className="max-w-full max-h-[85vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <button
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
            onClick={() => setSelectedImage(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">拒绝原因</h3>
            <textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              placeholder="请输入拒绝原因..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
              rows={4}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRejectModal({ show: false, reviewId: '', reason: '' })}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
              >
                确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}





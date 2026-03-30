import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

interface ImageItem {
  id: string
  url: string
}

interface Prompt {
  id: string
  title: string
  content: string
  description: string | null
  category: string | null
  tags: string[]
  isPublic: boolean
  isFeatured: boolean
  price: number
  viewCount: number
  likeCount: number
  useCount: number
  authorId: string
  authorEmail: string | null
  createdAt: string
  images: { url: string; id: string }[]
}

const categories = ['ecommerce', 'social', 'media', 'Seedance 2.0', 'Nano Banana Pro']

export default function PromptManagement() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    description: '',
    category: 'ecommerce',
    tags: '',
    isPublic: false,
    price: 0,
  })
  const [editingImages, setEditingImages] = useState<ImageItem[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pageSize = 10

  const fetchPrompts = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(pageSize),
      })
      if (search) params.append('search', search)

      const response = await axios.get(`${API_BASE}/v1/admin/prompts?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = response.data.data
      setPrompts(data.prompts)
      setTotal(data.pagination.total)
      setTotalPages(data.pagination.totalPages)
    } catch (err) {
      console.error('Failed to fetch prompts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrompts()
  }, [currentPage])

  useEffect(() => {
    const debounce = setTimeout(() => {
      setCurrentPage(1)
      fetchPrompts()
    }, 300)
    return () => clearTimeout(debounce)
  }, [search])

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return
    const token = localStorage.getItem('adminToken')
    const payload = {
      ...formData,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
    }

    try {
      if (editingPrompt) {
        await axios.put(`${API_BASE}/v1/admin/prompts/${editingPrompt.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
      } else {
        await axios.post(`${API_BASE}/v1/admin/prompts`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
      }
      closeModal()
      fetchPrompts()
    } catch (err) {
      console.error('Failed to save prompt')
    }
  }

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt)
    setFormData({
      title: prompt.title,
      content: prompt.content,
      description: prompt.description || '',
      category: prompt.category || 'ecommerce',
      tags: prompt.tags?.join(', ') || '',
      isPublic: prompt.isPublic,
      price: prompt.price,
    })
    setEditingImages(prompt.images || [])
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingPrompt(null)
    setEditingImages([])
    setFormData({ title: '', content: '', description: '', category: 'ecommerce', tags: '', isPublic: false, price: 0 })
  }

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('adminToken')
      await axios.delete(`${API_BASE}/v1/admin/prompts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setDeleteConfirmId(null)
      fetchPrompts()
    } catch (err) {
      console.error('Failed to delete prompt')
    }
  }

  const toggleFeatured = async (id: string) => {
    try {
      const token = localStorage.getItem('adminToken')
      await axios.put(`${API_BASE}/v1/admin/prompts/${id}/featured`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setPrompts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isFeatured: !p.isFeatured } : p))
      )
    } catch (err) {
      console.error('Failed to toggle featured status')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !editingPrompt) return

    setUploadingImages(true)
    try {
      const token = localStorage.getItem('adminToken')
      for (const file of Array.from(files)) {
        const reader = new FileReader()
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        const response = await axios.post(
          `${API_BASE}/v1/admin/prompts/${editingPrompt.id}/images`,
          { image: base64 },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        const newImage = response.data.data
        setEditingImages((prev) => [...prev, { id: newImage.id, url: newImage.url }])
      }
      fetchPrompts()
    } catch (err) {
      console.error('Failed to upload image', err)
    } finally {
      setUploadingImages(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    try {
      const token = localStorage.getItem('adminToken')
      await axios.delete(`${API_BASE}/v1/admin/prompts/images/${imageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setEditingImages((prev) => prev.filter((img) => img.id !== imageId))
      fetchPrompts()
    } catch (err) {
      console.error('Failed to delete image', err)
    }
  }

  const categoryLabel = (cat: string | null) => {
    switch (cat) {
      case 'ecommerce': return '电商'
      case 'social': return '社交'
      case 'media': return '媒体'
      default: return cat || '-'
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">提示词管理</h2>

      {/* Search and Add */}
      <div className="flex gap-4 items-center flex-wrap">
        <input
          type="text"
          placeholder="搜索提示词标题"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => {
            setEditingPrompt(null)
            setEditingImages([])
            setFormData({ title: '', content: '', description: '', category: 'ecommerce', tags: '', isPublic: false, price: 0 })
            setIsModalOpen(true)
          }}
          className="ml-auto px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
        >
          + 添加提示词
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">封面</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">标题</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">分类</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">使用次数</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">精选</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">创建时间</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">加载中...</td>
              </tr>
            ) : prompts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无提示词</td>
              </tr>
            ) : (
              prompts.map((prompt) => (
                <tr key={prompt.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {prompt.images && prompt.images.length > 0 ? (
                      <img
                        src={prompt.images[0].url}
                        alt={prompt.title}
                        className="w-[60px] h-[60px] object-cover rounded"
                      />
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium max-w-[200px] truncate">{prompt.title}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {categoryLabel(prompt.category)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-900">{prompt.useCount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {prompt.isFeatured ? (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">是</span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">否</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(prompt.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleEdit(prompt)}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 mr-1 transition-colors"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => toggleFeatured(prompt.id)}
                      className={`px-2 py-1 rounded text-xs mr-1 transition-colors ${
                        prompt.isFeatured
                          ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      }`}
                    >
                      {prompt.isFeatured ? '取消精选' : '设为精选'}
                    </button>
                    {deleteConfirmId === prompt.id ? (
                      <span className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(prompt.id)}
                          className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                        >
                          确认
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200"
                        >
                          取消
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(prompt.id)}
                        className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors"
                      >
                        删除
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto py-8">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingPrompt ? '编辑提示词' : '添加提示词'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">标题 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="提示词标题"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">内容 *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="提示词内容"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">描述</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="简短描述"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">分类</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{categoryLabel(c)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">标签（逗号分隔）</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="标签1, 标签2"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isPublic: e.target.checked }))}
                />
                <label htmlFor="isPublic" className="text-sm text-gray-600">公开可见</label>
              </div>

              {/* Image Management (only when editing) */}
              {editingPrompt && (
                <div>
                  <label className="block text-sm text-gray-600 mb-2">图片</label>

                  {/* Existing Images */}
                  {editingImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {editingImages.map((img) => (
                        <div key={img.id} className="relative group">
                          <img
                            src={img.url}
                            alt=""
                            className="w-20 h-20 object-cover rounded border"
                          />
                          <button
                            onClick={() => handleDeleteImage(img.id)}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Button */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImages}
                    className="px-4 py-2 border border-dashed border-gray-400 rounded-lg text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors disabled:opacity-50"
                  >
                    {uploadingImages ? '上传中...' : '+ 上传图片'}
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

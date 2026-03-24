import { useState } from 'react'

interface Prompt {
  id: string
  title: string
  category: '电商' | '社交' | '媒体'
  usageCount: number
  featured: boolean
  createdAt: string
}

const mockPrompts: Prompt[] = [
  { id: '1', title: '商品主图描述生成器', category: '电商', usageCount: 15230, featured: true, createdAt: '2026-03-01' },
  { id: '2', title: '小红书爆款文案', category: '社交', usageCount: 12350, featured: true, createdAt: '2026-03-05' },
  { id: '3', title: '抖音短视频脚本', category: '媒体', usageCount: 9870, featured: false, createdAt: '2026-03-10' },
  { id: '4', title: '淘宝详情页优化', category: '电商', usageCount: 8540, featured: false, createdAt: '2026-03-12' },
  { id: '5', title: '朋友圈营销文案', category: '社交', usageCount: 7680, featured: false, createdAt: '2026-03-15' },
  { id: '6', title: '公众号选题助手', category: '媒体', usageCount: 6230, featured: true, createdAt: '2026-03-18' },
  { id: '7', title: '电商评价回复', category: '电商', usageCount: 5120, featured: false, createdAt: '2026-03-20' },
  { id: '8', title: '微商朋友圈文案', category: '社交', usageCount: 4890, featured: false, createdAt: '2026-03-22' },
]

const categories = ['全部', '电商', '社交', '媒体']

export default function PromptManagement() {
  const [prompts, setPrompts] = useState(mockPrompts)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('全部')
  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ title: '', category: '电商' as Prompt['category'] })
  const pageSize = 5

  const filteredPrompts = prompts.filter((prompt) => {
    const matchSearch = prompt.title.includes(search)
    const matchCategory = categoryFilter === '全部' || prompt.category === categoryFilter
    return matchSearch && matchCategory
  })

  const totalPages = Math.ceil(filteredPrompts.length / pageSize)
  const paginatedPrompts = filteredPrompts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const handleSave = () => {
    if (!formData.title.trim()) return
    if (editingPrompt) {
      setPrompts((prev) =>
        prev.map((p) =>
          p.id === editingPrompt.id ? { ...p, title: formData.title, category: formData.category } : p
        )
      )
    } else {
      const newPrompt: Prompt = {
        id: String(Date.now()),
        title: formData.title,
        category: formData.category,
        usageCount: 0,
        featured: false,
        createdAt: new Date().toISOString().split('T')[0],
      }
      setPrompts((prev) => [newPrompt, ...prev])
    }
    setIsModalOpen(false)
    setEditingPrompt(null)
    setFormData({ title: '', category: '电商' })
  }

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt)
    setFormData({ title: prompt.title, category: prompt.category })
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    setPrompts((prev) => prev.filter((p) => p.id !== id))
    setDeleteConfirmId(null)
  }

  const toggleFeatured = (id: string) => {
    setPrompts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, featured: !p.featured } : p))
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">提示词管理</h2>

      {/* 搜索和操作 */}
      <div className="flex gap-4 items-center">
        <input
          type="text"
          placeholder="搜索提示词标题"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setCurrentPage(1)
          }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value)
            setCurrentPage(1)
          }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === '全部' ? '全部分类' : c}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setEditingPrompt(null)
            setFormData({ title: '', category: '电商' })
            setIsModalOpen(true)
          }}
          className="ml-auto px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
        >
          + 添加提示词
        </button>
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">ID</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">标题</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">分类</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">使用次数</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">精选</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">创建时间</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedPrompts.map((prompt) => (
              <tr key={prompt.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{prompt.id}</td>
                <td className="px-4 py-3 text-gray-900 font-medium">{prompt.title}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    {prompt.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-900">{prompt.usageCount.toLocaleString()}</td>
                <td className="px-4 py-3">
                  {prompt.featured ? (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">是</span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">否</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">{prompt.createdAt}</td>
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
                      prompt.featured
                        ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    }`}
                  >
                    {prompt.featured ? '取消精选' : '设为精选'}
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
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">共 {filteredPrompts.length} 条记录</span>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-96 p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingPrompt ? '编辑提示词' : '添加提示词'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">标题</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入提示词标题"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">分类</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, category: e.target.value as Prompt['category'] }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="电商">电商</option>
                  <option value="社交">社交</option>
                  <option value="媒体">媒体</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingPrompt(null)
                }}
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

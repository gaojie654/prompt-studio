import { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

interface Prompt {
  id: string
  title: string
  content: string
  description?: string
  category?: string
  tags: string[]
  useCount: number
  likeCount: number
  viewCount: number
  isFeatured: boolean
  author: {
    id: string
    name?: string
  }
  createdAt: string
}

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'ecommerce', label: '电商' },
  { key: 'social', label: '社交媒体' },
  { key: 'media', label: '自媒体' },
]

export default function Prompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch prompts
  useEffect(() => {
    const fetchPrompts = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (searchKeyword) params.append('keyword', searchKeyword)
        if (selectedCategory !== 'all') params.append('category', selectedCategory)

        const response = await axios.get(`${API_BASE}/prompts?${params}`)
        setPrompts(response.data.data || [])
      } catch (err: any) {
        setError('获取提示词失败，请重试')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchPrompts()
  }, [searchKeyword, selectedCategory])

  const handleCopyPrompt = (content: string) => {
    navigator.clipboard.writeText(content)
    alert('提示词已复制到剪贴板')
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">提示词库</h1>
        <p className="text-gray-600">浏览和搜索优质提示词，用于生成营销图片</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar - Categories */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-4 shadow-sm sticky top-4">
            <h3 className="font-semibold text-gray-900 mb-4">分类</h3>
            <div className="space-y-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    selectedCategory === cat.key
                      ? 'bg-indigo-50 text-indigo-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索提示词..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-6 rounded-xl text-center">
              {error}
            </div>
          ) : prompts.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-600">未找到匹配的提示词</p>
              <button
                onClick={() => {
                  setSearchKeyword('')
                  setSelectedCategory('all')
                }}
                className="mt-4 text-indigo-600 hover:text-indigo-700"
              >
                清除筛选条件
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {prompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedPrompt(prompt)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">
                      {prompt.title}
                    </h3>
                    {prompt.isFeatured && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full whitespace-nowrap ml-2">
                        推荐
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {prompt.description || prompt.content}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {prompt.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex gap-4">
                      <span>使用 {prompt.useCount}</span>
                      <span>点赞 {prompt.likeCount}</span>
                    </div>
                    <span>{prompt.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Prompt Detail Modal */}
      {selectedPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedPrompt.title}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>by {selectedPrompt.author.name || 'Anonymous'}</span>
                    <span>使用 {selectedPrompt.useCount} 次</span>
                    <span>{selectedPrompt.viewCount} 浏览</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPrompt(null)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
                >
                  ×
                </button>
              </div>

              {/* Description */}
              {selectedPrompt.description && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">描述</h4>
                  <p className="text-gray-600">{selectedPrompt.description}</p>
                </div>
              )}

              {/* Tags */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">标签</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPrompt.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-indigo-50 text-indigo-600 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">提示词内容</h4>
                  <button
                    onClick={() => handleCopyPrompt(selectedPrompt.content)}
                    className="text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    复制
                  </button>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                    {selectedPrompt.content}
                  </pre>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    localStorage.setItem('selectedPrompt', selectedPrompt.content)
                    window.location.href = '/workspace'
                  }}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                >
                  使用此提示词
                </button>
                <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                  收藏
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { getPrompts, searchPrompts, toggleFavorite, Prompt, PromptsResponse } from '../api/client'

type Category = 'all' | 'ecommerce' | 'social'

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'ecommerce', label: '电商' },
  { key: 'social', label: '社交' },
]

const SUBCATEGORIES: Record<string, string[]> = {
  all: [],
  ecommerce: ['淘宝', '拼多多', '京东'],
  social: ['小红书', '抖音', '微信公众号'],
}

interface PromptModalProps {
  prompt: Prompt | null
  onClose: () => void
  onToggleFavorite: (id: string) => void
}

function PromptModal({ prompt, onClose, onToggleFavorite }: PromptModalProps) {
  if (!prompt) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{prompt.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                  {prompt.category}
                </span>
                <span className="text-xs text-gray-500">
                  使用 {prompt.usageCount} 次
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="bg-gray-50 rounded-md p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                {prompt.content}
              </pre>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t bg-gray-50">
            <button
              onClick={() => onToggleFavorite(prompt.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                prompt.isFavorite
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg
                className={`w-4 h-4 ${prompt.isFavorite ? 'fill-current' : ''}`}
                fill={prompt.isFavorite ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              {prompt.isFavorite ? '已收藏' : '收藏'}
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(prompt.content)
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              复制提示词
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Prompts() {
  const [category, setCategory] = useState<Category>('all')
  const [subCategory, setSubCategory] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)

  const fetchPrompts = useCallback(async () => {
    setLoading(true)
    try {
      let response: PromptsResponse
      const params: { category?: string; page: number; pageSize: number } = {
        page,
        pageSize: 12,
      }

      if (subCategory) {
        params.category = subCategory
      } else if (category !== 'all') {
        params.category = category
      }

      if (searchQuery.trim()) {
        response = await searchPrompts({ q: searchQuery, ...params })
      } else {
        response = await getPrompts(params)
      }

      setPrompts(response.items)
      setTotalPages(response.totalPages)
    } catch (error) {
      console.error('Failed to fetch prompts:', error)
    } finally {
      setLoading(false)
    }
  }, [category, subCategory, searchQuery, page])

  useEffect(() => {
    fetchPrompts()
  }, [fetchPrompts])

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat)
    setSubCategory('')
    setPage(1)
  }

  const handleSearch = () => {
    setPage(1)
    fetchPrompts()
  }

  const handleToggleFavorite = async (id: string) => {
    try {
      const updated = await toggleFavorite(id)
      setPrompts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isFavorite: updated.isFavorite } : p))
      )
      if (selectedPrompt?.id === id) {
        setSelectedPrompt({ ...selectedPrompt, isFavorite: updated.isFavorite })
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  const subCategories = SUBCATEGORIES[category]

  return (
    <div className="flex gap-6">
      {/* Left sidebar */}
      <div className="w-48 flex-shrink-0">
        <nav className="space-y-1">
          {CATEGORIES.map((cat) => (
            <div key={cat.key}>
              <button
                onClick={() => handleCategoryChange(cat.key)}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                  category === cat.key && !subCategory
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {cat.label}
              </button>
              {/* Subcategories */}
              {cat.key === category && subCategories.length > 0 && (
                <div className="ml-4 mt-1 space-y-1">
                  <button
                    onClick={() => {
                      setSubCategory('')
                      setPage(1)
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors ${
                      !subCategory
                        ? 'bg-gray-200 text-gray-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    全部平台
                  </button>
                  {subCategories.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => {
                        setSubCategory(sub)
                        setPage(1)
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors ${
                        subCategory === sub
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1">
        {/* Search bar */}
        <div className="flex gap-2 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索提示词..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            搜索
          </button>
        </div>

        {/* Prompt cards grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">加载中...</div>
          </div>
        ) : prompts.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">暂无提示词</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {prompts.map((prompt) => (
                <div
                  key={prompt.id}
                  onClick={() => setSelectedPrompt(prompt)}
                  className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 line-clamp-1">
                      {prompt.title}
                    </h3>
                    {prompt.isFavorite && (
                      <svg
                        className="w-4 h-4 text-red-500 fill-current flex-shrink-0 ml-2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                    {prompt.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      {prompt.category}
                    </span>
                    <span className="text-xs text-gray-400">
                      使用 {prompt.usageCount} 次
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  上一页
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">
                  第 {page} / {totalPages} 页
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      <PromptModal
        prompt={selectedPrompt}
        onClose={() => setSelectedPrompt(null)}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  )
}

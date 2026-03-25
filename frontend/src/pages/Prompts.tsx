import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

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
  isFavorited?: boolean
  author: {
    id: string
    name?: string
  }
  createdAt: string
}

const CATEGORIES = [
  { key: 'all', label: '全部', count: 0 },
  { key: 'ecommerce', label: '电商', count: 0 },
  { key: 'social', label: '社交媒体', count: 0 },
  { key: 'media', label: '自媒体', count: 0 },
]

// Skeleton loader
function PromptsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto animate-pulse">
      <div className="mb-8">
        <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-64"></div>
      </div>
      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-4 shadow-sm h-48"></div>
        </div>
        <div className="lg:col-span-3">
          <div className="mb-6">
            <div className="h-12 bg-gray-200 rounded-xl w-full"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-5 shadow-sm h-40"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Prompts() {
  const navigate = useNavigate()
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({
    all: 0,
    ecommerce: 0,
    social: 0,
    media: 0,
  })
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('favoritePrompts')
    if (saved) {
      setFavorites(new Set(JSON.parse(saved)))
    }
  }, [])

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
        const data = response.data.data || []
        setPrompts(data)

        // Calculate category stats
        const stats: Record<string, number> = {
          all: data.length,
          ecommerce: 0,
          social: 0,
          media: 0,
        }
        data.forEach((p: Prompt) => {
          const cat = p.category || 'other'
          if (stats[cat] !== undefined) stats[cat]++
        })
        setCategoryStats(stats)
      } catch (err: any) {
        setError('获取提示词失败，请重试')
      } finally {
        setLoading(false)
      }
    }

    // Debounce search
    const timer = setTimeout(fetchPrompts, 300)
    return () => clearTimeout(timer)
  }, [searchKeyword, selectedCategory])

  const handleCopyPrompt = (content: string) => {
    navigator.clipboard.writeText(content)
    alert('提示词已复制到剪贴板')
  }

  const toggleFavorite = (e: React.MouseEvent, promptId: string) => {
    e.stopPropagation()
    const newFavorites = new Set(favorites)
    if (newFavorites.has(promptId)) {
      newFavorites.delete(promptId)
    } else {
      newFavorites.add(promptId)
    }
    setFavorites(newFavorites)
    localStorage.setItem('favoritePrompts', JSON.stringify([...newFavorites]))

    // Update prompts list
    setPrompts(prev => prev.map(p =>
      p.id === promptId ? { ...p, isFavorited: newFavorites.has(promptId) } : p
    ))
  }

  const handleUsePrompt = (prompt: Prompt) => {
    localStorage.setItem('selectedPrompt', prompt.content)
    navigate('/workspace')
  }

  const displayedPrompts = showFavoritesOnly
    ? prompts.filter(p => favorites.has(p.id))
    : prompts

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">提示词库</h1>
        <p className="text-sm md:text-base text-gray-600">浏览和搜索优质提示词，用于生成营销图片</p>
      </div>

      {/* Category Stats Bar */}
      <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm mb-6">
        <div className="flex flex-wrap gap-2 md:gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-2 md:gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === cat.key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.label}
                <span className="ml-1 text-xs opacity-75">({categoryStats[cat.key] || 0})</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-sm font-medium transition-colors ${
              showFavoritesOnly
                ? 'bg-pink-500 text-white'
                : 'bg-pink-50 text-pink-600 hover:bg-pink-100'
            }`}
          >
            ❤️ 收藏 ({favorites.size})
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-4 md:gap-8">
        {/* Sidebar - Categories (desktop only) */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="bg-white rounded-xl p-4 shadow-sm sticky top-4">
            <h3 className="font-semibold text-gray-900 mb-4">分类筛选</h3>
            <div className="space-y-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center justify-between ${
                    selectedCategory === cat.key
                      ? 'bg-indigo-50 text-indigo-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedCategory === cat.key ? 'bg-indigo-100' : 'bg-gray-100'
                  }`}>
                    {categoryStats[cat.key] || 0}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t">
              <h3 className="font-semibold text-gray-900 mb-3">📊 统计</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">全部提示词</span>
                  <span className="font-medium">{categoryStats.all}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">我的收藏</span>
                  <span className="font-medium text-pink-600">{favorites.size}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Search Bar */}
          <div className="mb-4 md:mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索提示词..."
                className="w-full pl-10 pr-4 py-2.5 md:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base"
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
            <PromptsSkeleton />
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-6 rounded-xl text-center">
              {error}
            </div>
          ) : displayedPrompts.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 md:p-12 text-center">
              <svg className="w-12 h-12 md:w-16 md:h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-600 mb-4">
                {showFavoritesOnly ? '暂无收藏的提示词' : '未找到匹配的提示词'}
              </p>
              <button
                onClick={() => {
                  setSearchKeyword('')
                  setSelectedCategory('all')
                  setShowFavoritesOnly(false)
                }}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                清除筛选条件
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
              {displayedPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="bg-white rounded-xl p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative"
                  onClick={() => setSelectedPrompt(prompt)}
                >
                  {/* Favorite button */}
                  <button
                    onClick={(e) => toggleFavorite(e, prompt.id)}
                    className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      favorites.has(prompt.id)
                        ? 'bg-pink-100 text-pink-500'
                        : 'bg-gray-100 text-gray-400 hover:bg-pink-50 hover:text-pink-400'
                    }`}
                  >
                    {favorites.has(prompt.id) ? '❤️' : '🤍'}
                  </button>

                  <div className="flex items-start justify-between mb-2 pr-8">
                    <h3 className="font-semibold text-gray-900 line-clamp-1 text-sm md:text-base">
                      {prompt.title}
                    </h3>
                    {prompt.isFeatured && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full whitespace-nowrap ml-2">
                        推荐
                      </span>
                    )}
                  </div>

                  <p className="text-xs md:text-sm text-gray-600 line-clamp-2 mb-3">
                    {prompt.description || prompt.content}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {prompt.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex gap-3">
                      <span>👁 {prompt.viewCount}</span>
                      <span>👍 {prompt.likeCount}</span>
                      <span>📥 {prompt.useCount}</span>
                    </div>
                    <span className="text-gray-400">{prompt.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Prompt Detail Modal */}
      {selectedPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPrompt(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 md:p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 pr-4">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                    {selectedPrompt.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-500">
                    <span>by {selectedPrompt.author.name || 'Anonymous'}</span>
                    <span>👁 {selectedPrompt.viewCount}</span>
                    <span>👍 {selectedPrompt.likeCount}</span>
                    <span>📥 {selectedPrompt.useCount}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPrompt(null)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Tags */}
              <div className="mb-4">
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

              {/* Description */}
              {selectedPrompt.description && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">描述</h4>
                  <p className="text-gray-600 text-sm">{selectedPrompt.description}</p>
                </div>
              )}

              {/* Content */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">提示词内容</h4>
                  <button
                    onClick={() => handleCopyPrompt(selectedPrompt.content)}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    复制
                  </button>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
                    {selectedPrompt.content}
                  </pre>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                <button
                  onClick={() => handleUsePrompt(selectedPrompt)}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-sm md:text-base"
                >
                  🚀 使用此提示词
                </button>
                <button
                  onClick={(e) => toggleFavorite(e, selectedPrompt.id)}
                  className={`px-6 py-3 rounded-xl font-medium transition-colors border text-sm ${
                    favorites.has(selectedPrompt.id)
                      ? 'bg-pink-50 border-pink-200 text-pink-600'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {favorites.has(selectedPrompt.id) ? '❤️ 已收藏' : '🤍 收藏'}
                </button>
                <button
                  onClick={() => handleCopyPrompt(selectedPrompt.content)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  📋 复制
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

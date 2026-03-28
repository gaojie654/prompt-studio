import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

interface Prompt {
  id: string
  title: string
  content: string
  contentZh: string | null
  description: string | null
  category: string | null
  tags: string[]
  useCount: number
  likeCount: number
  viewCount: number
  isFeatured: boolean
  isFavorited?: boolean
  images: { url: string }[]
  author: { id: string; name?: string | null } | null
  createdAt: string
}

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'ecommerce', label: '电商' },
  { key: 'social', label: '社交' },
  { key: 'media', label: '自媒体' },
]

export default function Prompts() {
  const navigate = useNavigate()
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('all')
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('promptFavorites')
    if (saved) {
      setFavorites(new Set(JSON.parse(saved)))
    }
  }, [])

  const fetchPrompts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '20',
      })
      if (keyword) params.append('keyword', keyword)
      if (category !== 'all') params.append('category', category)

      const token = localStorage.getItem('token')
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await axios.get(`${API_BASE}/prompts?${params}`, { headers })
      const data = response.data

      // Merge favorites into prompts
      const promptsWithFavorites: Prompt[] = (data.data || []).map((p: Prompt) => ({
        ...p,
        isFavorited: favorites.has(p.id),
      }))

      setPrompts(promptsWithFavorites)
      setTotal(data.pagination?.total || 0)
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (err) {
      console.error('Failed to fetch prompts', err)
    } finally {
      setLoading(false)
    }
  }, [page, keyword, category])

  useEffect(() => {
    fetchPrompts()
  }, [fetchPrompts])

  // Debounce keyword search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1)
      else fetchPrompts()
    }, 300)
    return () => clearTimeout(timer)
  }, [keyword]) // eslint-disable-line

  const handleCategoryChange = (cat: string) => {
    setCategory(cat)
    setPage(1)
  }

  const toggleFavorite = async (e: React.MouseEvent, promptId: string) => {
    e.stopPropagation()
    const newFavorites = new Set(favorites)
    if (newFavorites.has(promptId)) {
      newFavorites.delete(promptId)
    } else {
      newFavorites.add(promptId)
    }
    setFavorites(newFavorites)
    localStorage.setItem('promptFavorites', JSON.stringify([...newFavorites]))

    // Update prompts list
    setPrompts(prev => prev.map(p =>
      p.id === promptId ? { ...p, isFavorited: newFavorites.has(promptId) } : p
    ))
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleUsePrompt = (prompt: Prompt) => {
    localStorage.setItem('selectedPrompt', prompt.content)
    navigate('/workspace')
  }

  const handleLike = async (promptId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      await axios.post(`${API_BASE}/prompts/${promptId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setPrompts(prev => prev.map(p =>
        p.id === promptId ? { ...p, likeCount: p.likeCount + 1 } : p
      ))
      if (selectedPrompt?.id === promptId) {
        setSelectedPrompt(prev => prev ? { ...prev, likeCount: prev.likeCount + 1 } : null)
      }
    } catch (err) {
      console.error('Failed to like prompt', err)
    }
  }

  const getCoverImage = (prompt: Prompt): string | null => {
    if (prompt.images && prompt.images.length > 0) {
      return prompt.images[0].url
    }
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">提示词库</h1>
        <p className="text-sm text-gray-500">共 {total} 个提示词</p>
      </div>

      {/* Search + Category Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索提示词..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Categories */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => handleCategoryChange(cat.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  category === cat.key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Favorites toggle */}
          <button
            onClick={() => {
              if (favorites.size > 0) {
                setCategory('all')
                setKeyword('')
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors"
          >
            ❤️ 收藏 ({favorites.size})
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      ) : prompts.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 mb-4">未找到匹配的提示词</p>
          <button
            onClick={() => { setKeyword(''); setCategory('all'); }}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            清除筛选
          </button>
        </div>
      ) : (
        <>
          {/* Masonry Grid */}
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {prompts.map((prompt) => {
              const coverUrl = getCoverImage(prompt)
              const isFav = favorites.has(prompt.id)

              return (
                <div
                  key={prompt.id}
                  className="break-inside-avoid bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                  onClick={() => setSelectedPrompt(prompt)}
                >
                  {/* Cover Image */}
                  {coverUrl ? (
                    <div className="relative">
                      <img
                        src={coverUrl}
                        alt={prompt.title}
                        className="w-full h-40 object-cover"
                        loading="lazy"
                      />
                      {prompt.isFeatured && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                          推荐
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-24 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                      <span className="text-3xl">💡</span>
                    </div>
                  )}

                  {/* Card Body */}
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2">
                      {prompt.title}
                    </h3>

                    {/* Tags */}
                    {prompt.tags && prompt.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {prompt.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex gap-2">
                        <span>👍 {prompt.likeCount}</span>
                        <span>📥 {prompt.useCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Favorite Button */}
                  <button
                    onClick={(e) => toggleFavorite(e, prompt.id)}
                    className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                      isFav
                        ? 'bg-pink-100 text-pink-500'
                        : 'bg-white/80 text-gray-400 hover:bg-pink-50 hover:text-pink-400'
                    }`}
                  >
                    {isFav ? '❤️' : '🤍'}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-4 items-center">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                上一页
              </button>
              <span className="text-sm text-gray-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {selectedPrompt && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPrompt(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between z-10">
              <div className="pr-4">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {selectedPrompt.title}
                </h2>
                <p className="text-sm text-gray-500">
                  by {selectedPrompt.author?.name ?? '系统导入'}
                  {' · '}
                  👁 {selectedPrompt.viewCount}
                  {' · '}
                  👍 {selectedPrompt.likeCount}
                  {' · '}
                  📥 {selectedPrompt.useCount}
                </p>
              </div>
              <button
                onClick={() => setSelectedPrompt(null)}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-lg font-bold flex-shrink-0"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Image Gallery */}
              {selectedPrompt.images && selectedPrompt.images.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">图片</h4>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {selectedPrompt.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img.url}
                        alt={`Image ${idx + 1}`}
                        className="w-full h-48 object-cover rounded-xl flex-shrink-0"
                        style={{ minWidth: '200px', maxWidth: '300px' }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedPrompt.tags && selectedPrompt.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedPrompt.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-sm rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Chinese Content */}
              {selectedPrompt.contentZh && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700">中文提示词</h4>
                    <button
                      onClick={() => handleCopy(selectedPrompt.contentZh!)}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      复制
                    </button>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
                      {selectedPrompt.contentZh}
                    </pre>
                  </div>
                </div>
              )}

              {/* English Content */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">
                    {selectedPrompt.contentZh ? '英文提示词' : '提示词内容'}
                  </h4>
                  <button
                    onClick={() => handleCopy(selectedPrompt.content)}
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
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => handleUsePrompt(selectedPrompt)}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-sm"
                >
                  🚀 使用此提示词
                </button>
                <button
                  onClick={() => handleCopy(selectedPrompt.content)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  📋 复制
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

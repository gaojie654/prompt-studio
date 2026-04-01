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
  { key: 'Seedance 2.0', label: 'Seedance 2.0' },
  { key: 'Nano Banana Pro', label: 'Nano Banana Pro' },
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
  const [copied, setCopied] = useState(false)
  const [activeLang, setActiveLang] = useState<'en' | 'zh'>('en')

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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1)
      else fetchPrompts()
    }, 300)
    return () => clearTimeout(timer)
  }, [keyword])

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

    setPrompts(prev => prev.map(p =>
      p.id === promptId ? { ...p, isFavorited: newFavorites.has(promptId) } : p
    ))
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleUsePrompt = (prompt: Prompt) => {
    localStorage.setItem('selectedPrompt', prompt.content)
    navigate('/workspace')
  }

  const getCoverImage = (prompt: Prompt): string | null => {
    if (prompt.images && prompt.images.length > 0) {
      return prompt.images[0].url
    }
    return null
  }

  // Reset language tab when opening a new prompt
  useEffect(() => {
    if (selectedPrompt) {
      setActiveLang(selectedPrompt.contentZh ? 'en' : 'en')
    }
  }, [selectedPrompt?.id])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">提示词图库</h1>
          <p className="text-gray-500">探索 {total} 个精选 AI 提示词，一键复制使用</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search + Category Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索提示词..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-gray-50"
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
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    category === cat.key
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Favorites */}
            <button
              onClick={() => {
                if (favorites.size > 0) {
                  setCategory('all')
                  setKeyword('')
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors border border-pink-100"
            >
              ❤️ 收藏 ({favorites.size})
            </button>
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-64 animate-pulse shadow-sm" />
            ))}
          </div>
        ) : prompts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
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
            {/* Masonry Grid - True waterfall layout */}
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {prompts.map((prompt) => {
                const coverUrl = getCoverImage(prompt)
                const isFav = favorites.has(prompt.id)

                return (
                  <div
                    key={prompt.id}
                    className="break-inside-avoid bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden border border-gray-100 hover:border-indigo-200 group"
                    onClick={() => setSelectedPrompt(prompt)}
                  >
                    {/* Cover Image - Natural aspect ratio */}
                    {coverUrl ? (
                      <div className="relative bg-gray-100">
                        <img
                          src={coverUrl}
                          alt={prompt.title}
                          className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-300"
                          loading="lazy"
                        />
                        {prompt.isFeatured && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full shadow-sm">
                            推荐
                          </span>
                        )}
                        {/* Favorite Button */}
                        <button
                          onClick={(e) => toggleFavorite(e, prompt.id)}
                          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm ${
                            isFav
                              ? 'bg-pink-500 text-white'
                              : 'bg-white/90 text-gray-400 hover:bg-pink-50 hover:text-pink-500'
                          }`}
                        >
                          {isFav ? '❤️' : '🤍'}
                        </button>
                      </div>
                    ) : (
                      <div className="w-full aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                        <span className="text-4xl opacity-50">✨</span>
                      </div>
                    )}

                    {/* Card Body */}
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2 leading-snug">
                        {prompt.title}
                      </h3>

                      {/* Tags */}
                      {prompt.tags && prompt.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {prompt.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-full font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex gap-3">
                          <span>👍 {prompt.likeCount}</span>
                          <span>📥 {prompt.useCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8 gap-3 items-center">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-5 py-2 bg-white border border-gray-200 rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors shadow-sm"
                >
                  上一页
                </button>
                <div className="flex items-center gap-2">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (page <= 3) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }
                    return (
                      <button
                        key={i}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
                          page === pageNum
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-5 py-2 bg-white border border-gray-200 rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors shadow-sm"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal - OpenNana Style */}
      {selectedPrompt && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPrompt(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Image Gallery - Top */}
            {selectedPrompt.images && selectedPrompt.images.length > 0 && (
              <div className="relative bg-gray-100">
                {/* Main Image */}
                <div className="aspect-video overflow-hidden">
                  <img
                    src={selectedPrompt.images[0].url}
                    alt={selectedPrompt.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                {/* Thumbnails */}
                {selectedPrompt.images.length > 1 && (
                  <div className="flex gap-2 p-3 overflow-x-auto">
                    {selectedPrompt.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img.url}
                        alt={`Image ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
                        onClick={() => {
                          // Could implement image lightbox here
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              {/* Title & Meta */}
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedPrompt.title}
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>by {selectedPrompt.author?.name ?? '系统导入'}</span>
                  <span className="flex items-center gap-1">👁 {selectedPrompt.viewCount}</span>
                  <span className="flex items-center gap-1">👍 {selectedPrompt.likeCount}</span>
                  <span className="flex items-center gap-1">📥 {selectedPrompt.useCount}</span>
                </div>
              </div>

              {/* Tags */}
              {selectedPrompt.tags && selectedPrompt.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {selectedPrompt.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-sm rounded-full font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Language Tabs */}
              <div className="border-b border-gray-200 mb-5">
                <div className="flex gap-6">
                  <button
                    onClick={() => setActiveLang('en')}
                    className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                      activeLang === 'en'
                        ? 'text-indigo-600 border-indigo-600'
                        : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                  >
                    English
                  </button>
                  {selectedPrompt.contentZh && (
                    <button
                      onClick={() => setActiveLang('zh')}
                      className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                        activeLang === 'zh'
                          ? 'text-indigo-600 border-indigo-600'
                          : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                    >
                      中文
                    </button>
                  )}
                </div>
              </div>

              {/* Prompt Content */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-5 relative group">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed max-h-64 overflow-y-auto">
                  {activeLang === 'zh' && selectedPrompt.contentZh
                    ? selectedPrompt.contentZh
                    : selectedPrompt.content}
                </pre>
                {/* Copy Button - Prominent */}
                <button
                  onClick={() => handleCopy(
                    activeLang === 'zh' && selectedPrompt.contentZh
                      ? selectedPrompt.contentZh
                      : selectedPrompt.content
                  )}
                  className={`absolute top-3 right-3 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm ${
                    copied
                      ? 'bg-green-500 text-white'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {copied ? '✓ 已复制' : '📋 一键复制'}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleUsePrompt(selectedPrompt)}
                  className="flex-1 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  🚀 使用此提示词
                </button>
                <button
                  onClick={() => handleCopy(
                    activeLang === 'zh' && selectedPrompt.contentZh
                      ? selectedPrompt.contentZh
                      : selectedPrompt.content
                  )}
                  className="px-6 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  📋 复制
                </button>
                <button
                  onClick={(e) => toggleFavorite(e, selectedPrompt.id)}
                  className={`px-6 py-3.5 rounded-xl font-medium transition-colors border text-sm ${
                    favorites.has(selectedPrompt.id)
                      ? 'bg-pink-50 border-pink-200 text-pink-600'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {favorites.has(selectedPrompt.id) ? '❤️ 已收藏' : '🤍 收藏'}
                </button>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setSelectedPrompt(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-gray-500 hover:text-gray-700 flex items-center justify-center text-xl font-bold shadow-lg transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

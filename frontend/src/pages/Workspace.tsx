import { useState, useCallback } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

// Platform options with sizes
const PLATFORMS = [
  { key: 'xiaohongshu_cover_v', name: '小红书封面(竖)', width: 1080, height: 1440, aspect: '3/4' },
  { key: 'xiaohongshu_cover_s', name: '小红书封面(方)', width: 1080, height: 1080, aspect: '1/1' },
  { key: 'douyin_cover', name: '抖音封面(竖)', width: 1080, height: 1920, aspect: '9/16' },
  { key: 'douyin_post', name: '抖音贴文(横)', width: 1200, height: 627, aspect: '16/9' },
  { key: 'gzh_cover', name: '公众号头条封面', width: 900, height: 383, aspect: '900/383' },
  { key: 'gzh_cover_sub', name: '公众号次条封面', width: 200, height: 200, aspect: '1/1' },
  { key: 'taobao_main', name: '淘宝主图', width: 800, height: 800, aspect: '1/1' },
  { key: 'pdd_main', name: '拼多多主图', width: 750, height: 352, aspect: '750/352' },
  { key: 'jd_main', name: '京东主图', width: 800, height: 800, aspect: '1/1' },
]

// Quick prompt templates
const QUICK_PROMPTS = [
  { label: '夏日清凉', prompt: 'Summer vibes, refreshing, cool colors, beach or pool scene' },
  { label: '高级感', prompt: 'Luxury brand aesthetic, premium feel, elegant lighting' },
  { label: '温馨居家', prompt: 'Cozy home atmosphere, warm lighting, comfortable setting' },
  { label: '时尚潮流', prompt: 'Trendy street style, fashion-forward, vibrant urban setting' },
  { label: '自然清新', prompt: 'Fresh and natural, outdoor scene, greenery, bright daylight' },
  { label: '科技感', prompt: 'Futuristic tech aesthetic, modern, clean lines, digital glow' },
]

interface GeneratedImage {
  id: string
  url: string
  platform: string
  width: number
  height: number
  status: string
  createdAt: string
}

type Tab = 't2i' | 'img2img' | 't2v' | 'i2v'

const TABS: { key: Tab; label: string; icon: string; badge?: string }[] = [
  { key: 't2i', label: '文字生图片', icon: '🎨' },
  { key: 'img2img', label: '参考图生图片', icon: '🖼️' },
  { key: 't2v', label: '文字生视频', icon: '🎬', badge: '即将上线' },
  { key: 'i2v', label: '图+文生视频', icon: '🎥', badge: '即将上线' },
]

export default function Workspace() {
  const [activeTab, setActiveTab] = useState<Tab>('t2i')

  // ── T2I state ──────────────────────────────────────────────
  const [t2i_platform, setT2iPlatform] = useState(PLATFORMS[0].key)
  const [t2i_prompt, setT2iPrompt] = useState('')
  const [t2i_negative, setT2iNegative] = useState('')
  const [t2i_generating, setT2iGenerating] = useState(false)
  const [t2i_images, setT2iImages] = useState<GeneratedImage[]>([])
  const [t2i_error, setT2iError] = useState<string | null>(null)
  const [t2i_showTemplates, setT2iShowTemplates] = useState(false)
  const [t2i_progress, setT2iProgress] = useState(0)
  const [t2i_imgError, setT2iImgError] = useState<string | null>(null)

  // ── Img2Img state ───────────────────────────────────────────
  const [i2i_platform, setI2iPlatform] = useState(PLATFORMS[0].key)
  const [i2i_prompt, setI2iPrompt] = useState('')
  const [i2i_negative, setI2iNegative] = useState('')
  const [i2i_generating, setI2iGenerating] = useState(false)
  const [i2i_images, setI2iImages] = useState<GeneratedImage[]>([])
  const [i2i_error, setI2iError] = useState<string | null>(null)
  const [i2i_showTemplates, setI2iShowTemplates] = useState(false)
  const [i2i_progress, setI2iProgress] = useState(0)
  const [i2i_imgError, setI2iImgError] = useState<string | null>(null)
  const [i2i_uploadedImage, setI2iUploadedImage] = useState<string | null>(null)
  const [i2i_dragOver, setI2iDragOver] = useState(false)

  // ── Helpers ────────────────────────────────────────────────
  const selectedPlatformInfo = PLATFORMS.find(p => p.key === t2i_platform)

  const handleQuickPrompt = (prompt: string, setter: (v: string) => void) => {
    setter(prompt)
  }

  // Upload reference image → returns URL
  const uploadRefImage = async (dataUri: string, token: string): Promise<string> => {
    const res = await axios.post(
      `${API_BASE}/images/upload`,
      { image: dataUri },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return res.data.data.url
  }

  // ── T2I generate ────────────────────────────────────────────
  const handleT2iGenerate = async () => {
    if (!t2i_prompt.trim()) {
      setT2iError('请输入图片描述')
      return
    }
    setT2iError(null)
    setT2iImgError(null)
    setT2iGenerating(true)
    setT2iProgress(0)

    const progressTimer = setInterval(() => {
      setT2iProgress(p => Math.min(p + 12, 88))
    }, 1500)

    try {
      const token = localStorage.getItem('token')!
      const platformInfo = PLATFORMS.find(p => p.key === t2i_platform)
      const res = await axios.post(
        `${API_BASE}/images/generate`,
        {
          platform: t2i_platform,
          prompt: t2i_prompt,
          negativePrompt: t2i_negative,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      clearInterval(progressTimer)
      setT2iProgress(100)
      const newImage: GeneratedImage = {
        id: res.data.data.id,
        url: res.data.data.url,
        platform: platformInfo?.name || t2i_platform,
        width: res.data.data.width || platformInfo?.width || 800,
        height: res.data.data.height || platformInfo?.height || 800,
        status: 'completed',
        createdAt: new Date().toISOString(),
      }
      setT2iImages([newImage])
    } catch (err: any) {
      clearInterval(progressTimer)
      setT2iProgress(0)
      const msg = err.response?.data?.message || '生成失败，请重试'
      setT2iError(msg)
    } finally {
      setT2iGenerating(false)
    }
  }

  // ── Img2Img generate ────────────────────────────────────────
  const handleI2iGenerate = async () => {
    if (!i2i_uploadedImage) {
      setI2iError('请先上传参考图片')
      return
    }
    if (!i2i_prompt.trim()) {
      setI2iError('请输入图片描述')
      return
    }
    setI2iError(null)
    setI2iImgError(null)
    setI2iGenerating(true)
    setI2iProgress(0)

    const progressTimer = setInterval(() => {
      setI2iProgress(p => Math.min(p + 10, 88))
    }, 1500)

    try {
      const token = localStorage.getItem('token')!

      // Pass base64 data URI directly to the API.
      // The backend forwards it as-is to SiliconFlow's Kolors img2img.
      // SiliconFlow accepts data URI format for the `image` parameter.
      const platformInfo = PLATFORMS.find(p => p.key === i2i_platform)
      const res = await axios.post(
        `${API_BASE}/images/generate`,
        {
          platform: i2i_platform,
          prompt: i2i_prompt,
          negativePrompt: i2i_negative,
          imageUrl: i2i_uploadedImage, // base64 data URI — passed directly
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      clearInterval(progressTimer)
      setI2iProgress(100)
      const newImage: GeneratedImage = {
        id: res.data.data.id,
        url: res.data.data.url,
        platform: platformInfo?.name || i2i_platform,
        width: res.data.data.width || platformInfo?.width || 800,
        height: res.data.data.height || platformInfo?.height || 800,
        status: 'completed',
        createdAt: new Date().toISOString(),
      }
      setI2iImages([newImage])
    } catch (err: any) {
      clearInterval(progressTimer)
      setI2iProgress(0)
      const msg = err.response?.data?.message || '生成失败，请重试'
      setI2iError(msg)
    } finally {
      setI2iGenerating(false)
    }
  }

  // ── Download ────────────────────────────────────────────────
  const handleDownload = async (img: GeneratedImage, removeWatermark: boolean = false) => {
    try {
      const token = localStorage.getItem('token')
      const params = removeWatermark ? '?removeWatermark=true' : ''
      const response = await fetch(`${API_BASE}/images/${img.id}/download${params}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: '下载失败' }))
        alert(err.message || '下载失败，请重试')
        return
      }
      const contentDisposition = response.headers.get('Content-Disposition') || ''
      const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/i)
      const filename = filenameMatch
        ? decodeURIComponent(filenameMatch[1])
        : `prompt-studio-${img.platform}-${Date.now()}.png`
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
      if (removeWatermark) alert('无水印图片下载成功，已扣除 20 积分')
    } catch {
      alert('下载失败，请重试')
    }
  }

  const handleCopyLink = (img: GeneratedImage) => {
    navigator.clipboard.writeText(img.url)
    alert('链接已复制到剪贴板')
  }

  // ── Reference image drag & drop ────────────────────────────
  const handleI2iDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setI2iDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (ev) => setI2iUploadedImage(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleI2iFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setI2iUploadedImage(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  // ── Coming Soon placeholder ─────────────────────────────────
  const ComingSoon = ({ title }: { title: string }) => (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-4xl mb-6">
        🚧
      </div>
      <h2 className="text-xl font-bold text-gray-700 mb-2">{title}</h2>
      <p className="text-gray-400 text-sm max-w-xs">
        该功能正在紧张开发中，敬请期待…
      </p>
      <div className="mt-6 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium">
        即将上线
      </div>
    </div>
  )

  // ── Preview card ────────────────────────────────────────────
  const PreviewCard = ({
    img,
    isGenerating,
    progress,
    onDownload,
    onCopyLink,
    imgError,
  }: {
    img: GeneratedImage | null
    isGenerating: boolean
    progress: number
    onDownload: (img: GeneratedImage, rm?: boolean) => void
    onCopyLink: (img: GeneratedImage) => void
    imgError: string | null
  }) => (
    <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">图片预览</h3>
      </div>

      {isGenerating ? (
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="#E5E7EB" strokeWidth="8" fill="none" />
                <circle
                  cx="48" cy="48" r="40"
                  stroke="url(#progress-gradient)"
                  strokeWidth="8" fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${progress * 2.51} 251`}
                />
                <defs>
                  <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#A855F7" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-700">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
          <p className="text-center text-gray-600 text-sm">AI正在生成图片，请稍候…</p>
        </div>
      ) : img ? (
        <div className="space-y-3">
          <div className="relative">
            <img
              src={img.url}
              alt="Generated"
              className="w-full rounded-lg"
              onError={(e) => {
                setT2iImgError(`图片加载失败: ${e.currentTarget.src}`)
              }}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onDownload(img, false)}
              className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm"
            >
              ⬇️ 下载有水印图
            </button>
            <button
              onClick={() => onDownload(img, true)}
              className="flex-1 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors text-sm"
            >
              ⬇️ 无水印下载 (20积分)
            </button>
          </div>
          <button
            onClick={() => onCopyLink(img)}
            className="w-full px-4 py-2 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors border text-sm"
          >
            复制链接
          </button>
        </div>
      ) : (
        <div
          className="bg-gray-100 rounded-xl flex items-center justify-center"
          style={{ aspectRatio: selectedPlatformInfo?.aspect || '1/1' }}
        >
          <div className="text-center text-gray-400 p-4">
            <svg className="w-12 h-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">生成的图片将在此处显示</p>
          </div>
        </div>
      )}

      {imgError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {imgError}
        </div>
      )}
    </div>
  )

  // ── Prompt input block (shared) ─────────────────────────────
  const PromptBlock = ({
    prompt, setPrompt,
    negativePrompt, setNegativePrompt,
    showTemplates, setShowTemplates,
    error,
    platform, setPlatform,
  }: {
    prompt: string; setPrompt: (v: string) => void
    negativePrompt: string; setNegativePrompt: (v: string) => void
    showTemplates: boolean; setShowTemplates: (v: boolean) => void
    error: string | null
    platform: string; setPlatform: (v: string) => void
  }) => (
    <>
      {/* Platform selector */}
      <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">选择平台</label>
        <select
          value={platform}
          onChange={e => setPlatform(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        >
          {PLATFORMS.map(p => (
            <option key={p.key} value={p.key}>{p.name} ({p.width}×{p.height})</option>
          ))}
        </select>
      </div>

      {/* Prompt input */}
      <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">输入图片描述</label>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {showTemplates ? '收起' : '📋 快捷模板'}
          </button>
        </div>

        {showTemplates && (
          <div className="mb-4 p-3 md:p-4 bg-gray-50 rounded-lg">
            <p className="text-xs md:text-sm text-gray-500 mb-2 md:mb-3">点击使用预设模板：</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map(tpl => (
                <button
                  key={tpl.label}
                  onClick={() => handleQuickPrompt(tpl.prompt, setPrompt)}
                  className="px-2 md:px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs md:text-sm hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="描述你想要的图片风格，例如：放在海边场景，突出清凉感，适合夏日营销..."
          className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm md:text-base"
          rows={3}
        />

        <div className="mt-3 md:mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">负面提示词（可选）</label>
          <input
            type="text"
            value={negativePrompt}
            onChange={e => setNegativePrompt(e.target.value)}
            placeholder="不想出现的内容，如：文字、水印、低质量"
            className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
    </>
  )

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">AI 工作台</h1>
        <p className="text-sm md:text-base text-gray-600">选择功能模块，AI 自动生成你需要的内容</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="ml-1 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab 1: 文字生图片 ── */}
      {activeTab === 't2i' && (
        <div className="grid lg:grid-cols-2 gap-4 md:gap-8">
          {/* Left: Controls */}
          <div className="space-y-4 md:space-y-6">
            <PromptBlock
              prompt={t2i_prompt} setPrompt={setT2iPrompt}
              negativePrompt={t2i_negative} setNegativePrompt={setT2iNegative}
              showTemplates={t2i_showTemplates} setShowTemplates={setT2iShowTemplates}
              error={t2i_error}
              platform={t2i_platform} setPlatform={setT2iPlatform}
            />

            <button
              onClick={handleT2iGenerate}
              disabled={t2i_generating}
              className="w-full py-3 md:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-base md:text-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {t2i_generating
                ? `🎨 SiliconFlow (Kolors) 生成中 ${Math.round(t2i_progress)}%...`
                : '🎨 使用 SiliconFlow (Kolors) 生成图片'}
            </button>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h4 className="font-medium text-yellow-800 mb-2">💡 文字生图技巧</h4>
              <ul className="text-xs md:text-sm text-yellow-700 space-y-1">
                <li>• 纯文字生成，描述越具体效果越好</li>
                <li>• 参考图功能请切换到「参考图生图片」标签</li>
                <li>• 使用快捷模板可快速上手</li>
              </ul>
            </div>
          </div>

          {/* Right: Preview */}
          <PreviewCard
            img={t2i_images[0] || null}
            isGenerating={t2i_generating}
            progress={t2i_progress}
            onDownload={handleDownload}
            onCopyLink={handleCopyLink}
            imgError={t2i_imgError}
          />
        </div>
      )}

      {/* ── Tab 2: 参考图生图片 ── */}
      {activeTab === 'img2img' && (
        <div className="grid lg:grid-cols-2 gap-4 md:gap-8">
          {/* Left: Controls */}
          <div className="space-y-4 md:space-y-6">
            <PromptBlock
              prompt={i2i_prompt} setPrompt={setI2iPrompt}
              negativePrompt={i2i_negative} setNegativePrompt={setI2iNegative}
              showTemplates={i2i_showTemplates} setShowTemplates={setI2iShowTemplates}
              error={i2i_error}
              platform={i2i_platform} setPlatform={setI2iPlatform}
            />

            {/* Reference image upload */}
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                上传参考图片
              </label>
              <div
                onDragOver={e => { e.preventDefault(); setI2iDragOver(true) }}
                onDragLeave={() => setI2iDragOver(false)}
                onDrop={handleI2iDrop}
                className={`relative border-2 border-dashed rounded-xl transition-all ${
                  i2i_dragOver
                    ? 'border-indigo-400 bg-indigo-50'
                    : i2i_uploadedImage
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-300 hover:border-indigo-400'
                }`}
                style={{ aspectRatio: '4/3' }}
              >
                {i2i_uploadedImage ? (
                  <div className="relative w-full h-full">
                    <img
                      src={i2i_uploadedImage}
                      alt="参考图"
                      className="w-full h-full object-contain rounded-xl"
                    />
                    <button
                      onClick={() => setI2iUploadedImage(null)}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-full text-sm hover:bg-black/70"
                    >
                      ×
                    </button>
                    <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                      ✓ 参考图已上传
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full text-gray-400">
                    <svg className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">拖拽图片到此处，或</p>
                    <label className="mt-1 text-indigo-600 cursor-pointer hover:text-indigo-700 text-sm font-medium">
                      点击上传
                      <input type="file" accept="image/*" className="hidden" onChange={handleI2iFileChange} />
                    </label>
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-400">支持 JPG/PNG/GIF/WebP，建议 512px 以上</p>
            </div>

            <button
              onClick={handleI2iGenerate}
              disabled={i2i_generating}
              className="w-full py-3 md:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-base md:text-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {i2i_generating
                ? `🖼️ SiliconFlow (Kolors I2I) 生成中 ${Math.round(i2i_progress)}%...`
                : '🖼️ 使用参考图 + 文字生成图片'}
            </button>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h4 className="font-medium text-yellow-800 mb-2">💡 参考图生图技巧</h4>
              <ul className="text-xs md:text-sm text-yellow-700 space-y-1">
                <li>• 上传清晰的产品/参考图，AI 将以其为基准生成</li>
                <li>• 在描述词里说明想把主体放在什么场景/风格中</li>
                <li>• 负面提示词可避免不想要的元素混入</li>
              </ul>
            </div>
          </div>

          {/* Right: Preview */}
          <PreviewCard
            img={i2i_images[0] || null}
            isGenerating={i2i_generating}
            progress={i2i_progress}
            onDownload={handleDownload}
            onCopyLink={handleCopyLink}
            imgError={i2i_imgError}
          />
        </div>
      )}

      {/* ── Tab 3: 文字生视频 ── */}
      {activeTab === 't2v' && <ComingSoon title="文字生视频" />}

      {/* ── Tab 4: 图+文生视频 ── */}
      {activeTab === 'i2v' && <ComingSoon title="图片+文字生视频" />}
    </div>
  )
}

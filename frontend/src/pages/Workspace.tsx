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

// SVG Icons
const Icons = {
  image: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  sparkles: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  download: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  copy: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  template: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  check: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  arrow: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  ),
  imageUpload: (
    <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  gallery: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  tip: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  t2i: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  img2img: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
}

const TABS = [
  { key: 't2i' as Tab, label: '文字生图', icon: Icons.t2i },
  { key: 'img2img' as Tab, label: '参考图生图', icon: Icons.img2img },
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
  const [copied, setCopied] = useState(false)

  // ── Helpers ────────────────────────────────────────────────
  const selectedPlatformInfo = PLATFORMS.find(p => p.key === t2i_platform)

  const handleQuickPrompt = (prompt: string, setter: (v: string) => void) => {
    setter(prompt)
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
      const platformInfo = PLATFORMS.find(p => p.key === i2i_platform)
      const res = await axios.post(
        `${API_BASE}/images/generate`,
        {
          platform: i2i_platform,
          prompt: i2i_prompt,
          negativePrompt: i2i_negative,
          imageUrl: i2i_uploadedImage,
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
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">AI 图片生成</h1>
        <p className="text-gray-500">输入描述，AI 自动为你生成精美图片</p>
      </div>

      {/* OpenNana Style Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── Left Panel: Controls ── */}
        <div className="space-y-5">
          {/* Tab Switcher */}
          <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 flex">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Platform Selector */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-3">选择平台与尺寸</label>
            <select
              value={activeTab === 't2i' ? t2i_platform : i2i_platform}
              onChange={e => activeTab === 't2i' ? setT2iPlatform(e.target.value) : setI2iPlatform(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-gray-50"
            >
              {PLATFORMS.map(p => (
                <option key={p.key} value={p.key}>{p.name} ({p.width}×{p.height})</option>
              ))}
            </select>
          </div>

          {/* Prompt Input */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">图片描述</label>
              <button
                onClick={() => activeTab === 't2i' ? setT2iShowTemplates(!t2i_showTemplates) : setI2iShowTemplates(!i2i_showTemplates)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                {Icons.template}
                快捷模板
              </button>
            </div>

            {(activeTab === 't2i' ? t2i_showTemplates : i2i_showTemplates) && (
              <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-3">点击使用预设模板：</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map(tpl => (
                    <button
                      key={tpl.label}
                      onClick={() => handleQuickPrompt(tpl.prompt, activeTab === 't2i' ? setT2iPrompt : setI2iPrompt)}
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <textarea
              value={activeTab === 't2i' ? t2i_prompt : i2i_prompt}
              onChange={e => activeTab === 't2i' ? setT2iPrompt(e.target.value) : setI2iPrompt(e.target.value)}
              placeholder="描述你想要的图片，例如：夏日清凉风格，产品放在海边场景，适合电商营销..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm"
              rows={4}
            />

            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-500 mb-2">负面提示词（可选）</label>
              <input
                type="text"
                value={activeTab === 't2i' ? t2i_negative : i2i_negative}
                onChange={e => activeTab === 't2i' ? setT2iNegative(e.target.value) : setI2iNegative(e.target.value)}
                placeholder="不想出现的内容，如：文字、水印、低质量..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          {/* Reference Image Upload (Img2Img only) */}
          {activeTab === 'img2img' && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-3">上传参考图片</label>
              <div
                onDragOver={e => { e.preventDefault(); setI2iDragOver(true) }}
                onDragLeave={() => setI2iDragOver(false)}
                onDrop={handleI2iDrop}
                className={`relative border-2 border-dashed rounded-2xl transition-all ${
                  i2i_dragOver
                    ? 'border-indigo-400 bg-indigo-50'
                    : i2i_uploadedImage
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-200 hover:border-indigo-300'
                }`}
                style={{ aspectRatio: '16/9' }}
              >
                {i2i_uploadedImage ? (
                  <div className="relative w-full h-full">
                    <img
                      src={i2i_uploadedImage}
                      alt="参考图"
                      className="w-full h-full object-contain rounded-2xl"
                    />
                    <button
                      onClick={() => setI2iUploadedImage(null)}
                      className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center text-lg transition-colors"
                    >
                      ×
                    </button>
                    <div className="absolute bottom-3 left-3 bg-green-500 text-white text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1">
                      {Icons.check}
                      参考图已上传
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full text-gray-400">
                    {Icons.imageUpload}
                    <p className="mt-3 text-sm">拖拽图片到此处，或</p>
                    <label className="mt-2 text-indigo-600 cursor-pointer hover:text-indigo-700 text-sm font-medium">
                      点击上传
                      <input type="file" accept="image/*" className="hidden" onChange={handleI2iFileChange} />
                    </label>
                  </div>
                )}
              </div>
              <p className="mt-3 text-xs text-gray-400">支持 JPG/PNG/GIF/WebP，建议 512px 以上</p>
            </div>
          )}

          {/* Error Message */}
          {(activeTab === 't2i' ? t2i_error : i2i_error) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {activeTab === 't2i' ? t2i_error : i2i_error}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={activeTab === 't2i' ? handleT2iGenerate : handleI2iGenerate}
            disabled={activeTab === 't2i' ? t2i_generating : i2i_generating}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-semibold text-base hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-3"
          >
            {Icons.sparkles}
            {activeTab === 't2i' ? t2i_generating
              ? `SiliconFlow 生成中 ${Math.round(activeTab === 't2i' ? t2i_progress : i2i_progress)}%...`
              : '开始生成图片'
            : i2i_generating
              ? `SiliconFlow 生成中 ${Math.round(i2i_progress)}%...`
              : '开始生成图片'}
          </button>

          {/* Tips */}
          <div className="bg-amber-50/80 border border-amber-100 rounded-2xl p-4">
            <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2 text-sm">
              {Icons.tip}
              使用技巧
            </h4>
            <ul className="text-xs text-amber-700 space-y-1.5">
              {activeTab === 't2i' ? (
                <>
                  <li>• 描述越具体，生成效果越好</li>
                  <li>• 参考图功能请切换到「参考图生图」</li>
                  <li>• 使用快捷模板可快速上手</li>
                </>
              ) : (
                <>
                  <li>• 上传清晰的产品图，AI 将以其为基准生成</li>
                  <li>• 在描述词里说明想要的场景和风格</li>
                  <li>• 负面提示词可避免不想要的元素</li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* ── Right Panel: Preview ── */}
        <div className="space-y-5">
          {/* Preview Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">生成结果</h3>
              {selectedPlatformInfo && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {selectedPlatformInfo.name}
                </span>
              )}
            </div>

            {/* Preview Area */}
            {(activeTab === 't2i' ? t2i_generating : i2i_generating) ? (
              <div className="bg-gray-50 rounded-2xl p-8 flex flex-col items-center justify-center" style={{ aspectRatio: selectedPlatformInfo?.aspect || '1/1' }}>
                {/* Progress Circle */}
                <div className="relative w-24 h-24 mb-6">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="#E5E7EB" strokeWidth="6" fill="none" />
                    <circle
                      cx="48" cy="48" r="40"
                      stroke="url(#progress-gradient)"
                      strokeWidth="6" fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${(activeTab === 't2i' ? t2i_progress : i2i_progress) * 2.51} 251`}
                    />
                    <defs>
                      <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366F1" />
                        <stop offset="100%" stopColor="#A855F7" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-700">
                    {Math.round(activeTab === 't2i' ? t2i_progress : i2i_progress)}%
                  </span>
                </div>
                <p className="text-gray-500 text-sm">AI 正在努力生成中，请稍候...</p>
              </div>
            ) : (activeTab === 't2i' ? t2i_images[0] : i2i_images[0]) ? (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden bg-gray-100" style={{ aspectRatio: selectedPlatformInfo?.aspect || '1/1' }}>
                  <img
                    src={(activeTab === 't2i' ? t2i_images[0] : i2i_images[0]).url}
                    alt="Generated"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      setT2iImgError(`图片加载失败`)
                    }}
                  />
                </div>

                {/* Download Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDownload((activeTab === 't2i' ? t2i_images[0] : i2i_images[0]), false)}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    {Icons.download}
                    下载有水印
                  </button>
                  <button
                    onClick={() => handleDownload((activeTab === 't2i' ? t2i_images[0] : i2i_images[0]), true)}
                    className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    {Icons.download}
                    无水印 (20积分)
                  </button>
                </div>

                <button
                  onClick={() => handleCopyLink((activeTab === 't2i' ? t2i_images[0] : i2i_images[0]))}
                  className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  {copied ? Icons.check : Icons.copy}
                  {copied ? '已复制' : '复制链接'}
                </button>
              </div>
            ) : (
              <div
                className="bg-gray-50 rounded-2xl flex flex-col items-center justify-center text-gray-400"
                style={{ aspectRatio: selectedPlatformInfo?.aspect || '1/1' }}
              >
                {Icons.gallery}
                <p className="mt-4 text-sm">生成的图片将在此处显示</p>
                <p className="text-xs mt-1">左侧输入描述，点击生成</p>
              </div>
            )}

            {/* Image Error */}
            {(activeTab === 't2i' ? t2i_imgError : i2i_imgError) && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                {activeTab === 't2i' ? t2i_imgError : i2i_imgError}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

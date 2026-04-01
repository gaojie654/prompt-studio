import { useState } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

// Model options with credit costs
const MODELS = [
  { key: 'kolors', name: 'Kolors (快)', credit: 10, description: '速度最快，性价比高' },
  { key: 'gpt-image-1', name: 'GPT-5 Image', credit: 30, description: 'OpenAI 最新模型，画质极佳' },
  { key: 'nano-banana', name: 'Nano Banana', credit: 20, description: 'Google Gemini 模型' },
  { key: 'nano-banana-pro', name: 'Nano Banana Pro', credit: 50, description: '支持 4K 分辨率' },
]

// Resolution options with credit costs
const RESOLUTIONS = [
  { key: 'sd', name: '标准 (512px)', multiplier: 1 },
  { key: 'hd', name: '高清 (1024px)', multiplier: 2 },
  { key: 'uhd', name: '超清 (2048px)', multiplier: 5 },
  { key: '4k', name: '4K (4096px)', multiplier: 10 },
]

// Aspect ratio options
const ASPECT_RATIOS = [
  { key: '1:1', name: '1:1 正方形' },
  { key: '3:4', name: '3:4 竖向' },
  { key: '4:3', name: '4:3 标准' },
  { key: '16:9', name: '16:9 宽屏' },
  { key: '9:16', name: '9:16 竖屏' },
  { key: '2:3', name: '2:3 人像' },
]

// Platform presets with fixed dimensions
const PLATFORMS = [
  { key: 'xiaohongshu_cover_v', name: '小红书封面(竖)', width: 1080, height: 1440 },
  { key: 'xiaohongshu_cover_s', name: '小红书封面(方)', width: 1080, height: 1080 },
  { key: 'douyin_cover', name: '抖音封面(竖)', width: 1080, height: 1920 },
  { key: 'douyin_post', name: '抖音贴文(横)', width: 1200, height: 627 },
  { key: 'gzh_cover', name: '公众号头条封面', width: 900, height: 383 },
  { key: 'gzh_cover_sub', name: '公众号次条封面', width: 200, height: 200 },
  { key: 'taobao_main', name: '淘宝主图', width: 800, height: 800 },
  { key: 'pdd_main', name: '拼多多主图', width: 750, height: 352 },
  { key: 'jd_main', name: '京东主图', width: 800, height: 800 },
  { key: 'custom', name: '自定义（可调比例）', width: 0, height: 0 },
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

type Tab = 't2i' | 'img2img'

export default function Workspace() {
  const [activeTab, setActiveTab] = useState<Tab>('t2i')

  // Generation settings
  const [model, setModel] = useState('kolors')
  const [resolution, setResolution] = useState('hd')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [platform, setPlatform] = useState('custom')
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [imgError, setImgError] = useState<string | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [copied, setCopied] = useState(false)

  // Calculate credits
  const currentModel = MODELS.find(m => m.key === model)
  const currentResolution = RESOLUTIONS.find(r => r.key === resolution)
  const totalCredits = (currentModel?.credit || 10) * (currentResolution?.multiplier || 1)

  // Generate image
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('请输入图片描述')
      return
    }
    setError(null)
    setImgError(null)
    setGenerating(true)
    setProgress(0)

    const progressTimer = setInterval(() => {
      setProgress(p => Math.min(p + 12, 88))
    }, 1500)

    try {
      const token = localStorage.getItem('token')!
      const payload: any = {
        model: model,
        resolution: resolution,
        prompt: prompt,
        negativePrompt: negativePrompt || undefined,
      }

      // Only add imageUrl for img2img mode
      if (activeTab === 'img2img' && uploadedImage) {
        payload.imageUrl = uploadedImage
      }

      // For custom platform, use aspectRatio; otherwise use platform preset dimensions
      if (platform === 'custom') {
        payload.aspectRatio = aspectRatio
      } else {
        payload.platform = platform
      }

      const res = await axios.post(
        `${API_BASE}/images/generate`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      clearInterval(progressTimer)
      setProgress(100)
      const newImage: GeneratedImage = {
        id: res.data.data.id,
        url: res.data.data.url,
        platform: platform,
        width: res.data.data.width || 1024,
        height: res.data.data.height || 1024,
        status: 'completed',
        createdAt: new Date().toISOString(),
      }
      setImages([newImage])
    } catch (err: any) {
      clearInterval(progressTimer)
      setProgress(0)
      const msg = err.response?.data?.message || '生成失败，请重试'
      setError(msg)
    } finally {
      setGenerating(false)
    }
  }

  // Download
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
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `prompt-studio-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
      if (removeWatermark) alert('无水印图片下载成功，已扣除积分')
    } catch {
      alert('下载失败，请重试')
    }
  }

  const handleCopyLink = (img: GeneratedImage) => {
    navigator.clipboard.writeText(img.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Drag & drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (ev) => setUploadedImage(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setUploadedImage(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  // Get aspect ratio style based on platform or custom ratio
  const getAspectRatioStyle = () => {
    if (platform !== 'custom') {
      const preset = PLATFORMS.find(p => p.key === platform)
      if (preset && preset.width && preset.height) {
        return { aspectRatio: `${preset.width}/${preset.height}` }
      }
    }
    const [w, h] = aspectRatio.split(':').map(Number)
    return { aspectRatio: `${w}/${h}` }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">AI 图片生成</h1>
        <p className="text-gray-500 text-sm">选择参数，输入描述，AI 为你生成精美图片</p>
      </div>

      {/* Main Layout - Left Controls, Right Preview */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* ── Left Panel: Controls ── */}
        <div className="lg:col-span-3 space-y-4">
          {/* Tab Switcher */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('t2i')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 't2i'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              文字生图
            </button>
            <button
              onClick={() => setActiveTab('img2img')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'img2img'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              参考图生图
            </button>
          </div>

          {/* Settings Row - All in one compact row */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className={`grid gap-3 ${platform === 'custom' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'}`}>
              {/* Model */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">模型</label>
                <select
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  {MODELS.map(m => (
                    <option key={m.key} value={m.key}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Resolution */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">分辨率</label>
                <select
                  value={resolution}
                  onChange={e => setResolution(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  {RESOLUTIONS.map(r => (
                    <option key={r.key} value={r.key}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* Platform */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">平台预设</label>
                <select
                  value={platform}
                  onChange={e => setPlatform(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  {PLATFORMS.map(p => (
                    <option key={p.key} value={p.key}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Aspect Ratio - Only show when platform is custom */}
              {platform === 'custom' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">图片比例</label>
                  <select
                    value={aspectRatio}
                    onChange={e => setAspectRatio(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    {ASPECT_RATIOS.map(r => (
                      <option key={r.key} value={r.key}>{r.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Credit Info */}
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">本次消耗</span>
              <span className="text-sm font-semibold text-indigo-600">{totalCredits} 积分</span>
            </div>
          </div>

          {/* Prompt Input */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-900">图片描述</label>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {showTemplates ? '收起模板' : '快捷模板'}
              </button>
            </div>

            {showTemplates && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map(tpl => (
                    <button
                      key={tpl.label}
                      onClick={() => setPrompt(tpl.prompt)}
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs hover:border-indigo-400 hover:text-indigo-600 transition-colors text-gray-700"
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
              placeholder="描述你想要的图片，例如：夏日清凉风格，产品放在海边场景..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              rows={3}
            />

            <div className="mt-3">
              <input
                type="text"
                value={negativePrompt}
                onChange={e => setNegativePrompt(e.target.value)}
                placeholder="负面提示词（可选）：不想出现的内容"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Reference Image Upload (Img2Img only) */}
          {activeTab === 'img2img' && (
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <label className="block text-sm font-medium text-gray-900 mb-2">上传参考图片</label>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-lg transition-all ${
                  dragOver
                    ? 'border-indigo-400 bg-indigo-50'
                    : uploadedImage
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-300 hover:border-indigo-300'
                }`}
                style={{ aspectRatio: '16/9' }}
              >
                {uploadedImage ? (
                  <div className="relative w-full h-full">
                    <img
                      src={uploadedImage}
                      alt="参考图"
                      className="w-full h-full object-contain rounded-lg"
                    />
                    <button
                      onClick={() => setUploadedImage(null)}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center text-sm"
                    >
                      ×
                    </button>
                    <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      ✓ 已上传
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full text-gray-400">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-xs">拖拽图片或</p>
                    <label className="mt-1 text-indigo-600 cursor-pointer hover:text-indigo-700 text-xs font-medium">
                      点击上传
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                生成中 {Math.round(progress)}%...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                开始生成 · {totalCredits} 积分
              </>
            )}
          </button>

          {/* Tips */}
          <div className="text-xs text-gray-400 text-center">
            描述越具体，生成效果越好 · 参考图功能请切换到「参考图生图」
          </div>
        </div>

        {/* ── Right Panel: Preview ── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-4 border border-gray-200 sticky top-6">
            {/* Preview Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 text-sm">生成结果</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {platform === 'custom' ? aspectRatio : PLATFORMS.find(p => p.key === platform)?.name}
              </span>
            </div>

            {/* Preview Area */}
            {generating ? (
              <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center justify-center" style={getAspectRatioStyle()}>
                <div className="relative w-16 h-16 mb-3">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle cx="32" cy="32" r="28" stroke="#E5E7EB" strokeWidth="4" fill="none" />
                    <circle
                      cx="32" cy="32" r="28"
                      stroke="#6366F1"
                      strokeWidth="4" fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${progress * 1.76} 176`}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-700">
                    {Math.round(progress)}%
                  </span>
                </div>
                <p className="text-gray-500 text-xs">AI 正在生成...</p>
              </div>
            ) : images[0] ? (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden bg-gray-100" style={getAspectRatioStyle()}>
                  <img
                    src={images[0].url}
                    alt="Generated"
                    className="w-full h-full object-contain"
                    onError={() => setImgError('图片加载失败')}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(images[0], false)}
                    className="flex-1 py-2 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    有水印
                  </button>
                  <button
                    onClick={() => handleDownload(images[0], true)}
                    className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    无水印
                  </button>
                </div>

                <button
                  onClick={() => handleCopyLink(images[0])}
                  className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      已复制
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      复制链接
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div
                className="bg-gray-50 rounded-xl flex flex-col items-center justify-center text-gray-400"
                style={getAspectRatioStyle()}
              >
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-2 text-xs">预览区域</p>
              </div>
            )}

            {/* Image Error */}
            {imgError && (
              <div className="mt-3 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                {imgError}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

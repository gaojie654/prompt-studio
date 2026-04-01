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
  { key: 'sd', name: '标准 (512px)', credit: 1, multiplier: 1 },
  { key: 'hd', name: '高清 (1024px)', credit: 2, multiplier: 2 },
  { key: 'uhd', name: '超清 (2048px)', credit: 5, multiplier: 5 },
  { key: '4k', name: '4K (4096px)', credit: 10, multiplier: 10, requiresPro: true },
]

// Aspect ratio options
const ASPECT_RATIOS = [
  { key: '1:1', name: '1:1', label: '正方形', icon: '□' },
  { key: '3:4', name: '3:4', label: '竖向', icon: '▯' },
  { key: '4:3', name: '4:3', label: '标准', icon: '▭' },
  { key: '16:9', name: '16:9', label: '宽屏', icon: '▬' },
  { key: '9:16', name: '9:16', label: '竖屏', icon: '▯' },
  { key: '2:3', name: '2:3', label: '人像', icon: '▯' },
]

// Platform presets
const PLATFORMS = [
  { key: 'xiaohongshu_cover_v', name: '小红书封面(竖)', ratio: '3:4', resolution: 'hd' },
  { key: 'xiaohongshu_cover_s', name: '小红书封面(方)', ratio: '1:1', resolution: 'hd' },
  { key: 'douyin_cover', name: '抖音封面(竖)', ratio: '9:16', resolution: 'hd' },
  { key: 'douyin_post', name: '抖音贴文(横)', ratio: '16:9', resolution: 'hd' },
  { key: 'gzh_cover', name: '公众号头条封面', ratio: '2:1', resolution: 'hd' },
  { key: 'gzh_cover_sub', name: '公众号次条封面', ratio: '1:1', resolution: 'sd' },
  { key: 'taobao_main', name: '淘宝主图', ratio: '1:1', resolution: 'hd' },
  { key: 'pdd_main', name: '拼多多主图', ratio: '2:1', resolution: 'hd' },
  { key: 'jd_main', name: '京东主图', ratio: '1:1', resolution: 'hd' },
  { key: 'custom', name: '自定义', ratio: '1:1', resolution: 'hd' },
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

// SVG Icons
const Icons = {
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
  gallery: (
    <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  imageUpload: (
    <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  tip: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  model: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
  resize: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
    </svg>
  ),
  aspect: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
    </svg>
  ),
  credit: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
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

  // Calculate credits for current settings
  const currentModel = MODELS.find(m => m.key === model)
  const currentResolution = RESOLUTIONS.find(r => r.key === resolution)
  const totalCredits = (currentModel?.credit || 10) * (currentResolution?.multiplier || 1)

  // Handle platform preset selection
  const handlePlatformChange = (platformKey: string) => {
    setPlatform(platformKey)
    const preset = PLATFORMS.find(p => p.key === platformKey)
    if (preset && platformKey !== 'custom') {
      setAspectRatio(preset.ratio)
      setResolution(preset.resolution)
    }
  }

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
      const res = await axios.post(
        `${API_BASE}/images/generate`,
        {
          platform: platform,
          model: model,
          resolution: resolution,
          aspectRatio: aspectRatio,
          prompt: prompt,
          negativePrompt: negativePrompt,
          imageUrl: uploadedImage,
        },
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

  // Get aspect ratio style
  const getAspectRatioStyle = () => {
    const [w, h] = aspectRatio.split(':').map(Number)
    return { aspectRatio: `${w}/${h}` }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">AI 图片生成</h1>
        <p className="text-gray-500">选择模型、分辨率和比例，AI 为你生成精美图片</p>
      </div>

      {/* OpenNana Style Layout */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* ── Left Panel: Controls (3/5 width) ── */}
        <div className="lg:col-span-3 space-y-5">
          {/* Tab Switcher */}
          <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 flex">
            <button
              onClick={() => setActiveTab('t2i')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 't2i'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              文字生图
            </button>
            <button
              onClick={() => setActiveTab('img2img')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'img2img'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              参考图生图
            </button>
          </div>

          {/* Model Selection */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              {Icons.model}
              <h3 className="font-semibold text-gray-900">选择模型</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {MODELS.map(m => (
                <button
                  key={m.key}
                  onClick={() => setModel(m.key)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    model === m.key
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900 text-sm">{m.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{m.description}</div>
                  <div className="flex items-center gap-1 mt-2">
                    <span className={`text-xs font-medium ${model === m.key ? 'text-indigo-600' : 'text-gray-400'}`}>
                      {m.credit} 积分/张
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Resolution & Aspect Ratio */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="grid md:grid-cols-2 gap-5">
              {/* Resolution */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  {Icons.resize}
                  <h3 className="font-medium text-gray-900 text-sm">分辨率</h3>
                </div>
                <div className="space-y-2">
                  {RESOLUTIONS.map(r => (
                    <label
                      key={r.key}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        resolution === r.key
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="resolution"
                          value={r.key}
                          checked={resolution === r.key}
                          onChange={() => setResolution(r.key)}
                          className="sr-only"
                        />
                        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          resolution === r.key ? 'border-indigo-500' : 'border-gray-300'
                        }`}>
                          {resolution === r.key && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                        </span>
                        <span className="text-sm text-gray-900">{r.name}</span>
                      </div>
                      <span className={`text-xs font-medium ${resolution === r.key ? 'text-indigo-600' : 'text-gray-400'}`}>
                        ×{r.multiplier}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  {Icons.aspect}
                  <h3 className="font-medium text-gray-900 text-sm">图片比例</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {ASPECT_RATIOS.map(r => (
                    <button
                      key={r.key}
                      onClick={() => setAspectRatio(r.key)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        aspectRatio === r.key
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-lg mb-1">{r.icon}</div>
                      <div className="text-xs font-medium text-gray-900">{r.key}</div>
                      <div className="text-xs text-gray-500">{r.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Platform Preset */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-medium text-gray-900 text-sm mb-3">平台预设</h3>
            <select
              value={platform}
              onChange={e => handlePlatformChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 bg-white"
            >
              {PLATFORMS.map(p => (
                <option key={p.key} value={p.key}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Prompt Input */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">图片描述</h3>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                {Icons.template}
                快捷模板
              </button>
            </div>

            {showTemplates && (
              <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-3">点击使用预设模板：</p>
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
              placeholder="描述你想要的图片，例如：夏日清凉风格，产品放在海边场景，适合电商营销..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm text-gray-900"
              rows={4}
            />

            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-500 mb-2">负面提示词（可选）</label>
              <input
                type="text"
                value={negativePrompt}
                onChange={e => setNegativePrompt(e.target.value)}
                placeholder="不想出现的内容，如：文字、水印、低质量..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900"
              />
            </div>
          </div>

          {/* Reference Image Upload (Img2Img only) */}
          {activeTab === 'img2img' && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-medium text-gray-900 text-sm mb-3">上传参考图片</h3>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl transition-all ${
                  dragOver
                    ? 'border-indigo-400 bg-indigo-50'
                    : uploadedImage
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-200 hover:border-indigo-300'
                }`}
                style={{ aspectRatio: '16/9' }}
              >
                {uploadedImage ? (
                  <div className="relative w-full h-full">
                    <img
                      src={uploadedImage}
                      alt="参考图"
                      className="w-full h-full object-contain rounded-2xl"
                    />
                    <button
                      onClick={() => setUploadedImage(null)}
                      className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center text-lg transition-colors"
                    >
                      ×
                    </button>
                    <div className="absolute bottom-3 left-3 bg-green-500 text-white text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1">
                      {Icons.check}
                      已上传
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full text-gray-400">
                    {Icons.imageUpload}
                    <p className="mt-3 text-sm">拖拽图片到此处</p>
                    <label className="mt-2 text-indigo-600 cursor-pointer hover:text-indigo-700 text-sm font-medium">
                      或点击上传
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-semibold text-base hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-3"
          >
            {Icons.sparkles}
            {generating
              ? `生成中 ${Math.round(progress)}%...`
              : `开始生成 (${totalCredits} 积分)`}
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
                  <li>• Nano Banana Pro 支持 4K 分辨率</li>
                </>
              ) : (
                <>
                  <li>• 上传清晰的产品图，AI 将以其为基准生成</li>
                  <li>• 在描述词里说明想要的场景和风格</li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* ── Right Panel: Preview (2/5 width) ── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sticky top-6">
            {/* Credit Info */}
            <div className="flex items-center justify-between mb-4 p-3 bg-indigo-50 rounded-xl">
              <div className="flex items-center gap-2 text-indigo-700">
                {Icons.credit}
                <span className="text-sm font-medium">本次消耗</span>
              </div>
              <span className="text-lg font-bold text-indigo-600">{totalCredits} 积分</span>
            </div>

            {/* Preview Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">生成结果</h3>
              {aspectRatio && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {aspectRatio}
                </span>
              )}
            </div>

            {/* Preview Area */}
            {generating ? (
              <div className="bg-gray-50 rounded-2xl p-8 flex flex-col items-center justify-center" style={getAspectRatioStyle()}>
                {/* Progress Circle */}
                <div className="relative w-20 h-20 mb-4">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle cx="40" cy="40" r="35" stroke="#E5E7EB" strokeWidth="5" fill="none" />
                    <circle
                      cx="40" cy="40" r="35"
                      stroke="url(#progress-gradient)"
                      strokeWidth="5" fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${progress * 2.2} 220`}
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
                <p className="text-gray-500 text-sm">AI 正在生成...</p>
              </div>
            ) : images[0] ? (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden bg-gray-100" style={getAspectRatioStyle()}>
                  <img
                    src={images[0].url}
                    alt="Generated"
                    className="w-full h-full object-contain"
                    onError={() => setImgError('图片加载失败')}
                  />
                </div>

                {/* Download Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(images[0], false)}
                    className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    {Icons.download}
                    有水印
                  </button>
                  <button
                    onClick={() => handleDownload(images[0], true)}
                    className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    {Icons.download}
                    无水印
                  </button>
                </div>

                <button
                  onClick={() => handleCopyLink(images[0])}
                  className="w-full py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  {copied ? Icons.check : Icons.copy}
                  {copied ? '已复制' : '复制链接'}
                </button>
              </div>
            ) : (
              <div
                className="bg-gray-50 rounded-2xl flex flex-col items-center justify-center text-gray-400"
                style={getAspectRatioStyle()}
              >
                {Icons.gallery}
                <p className="mt-4 text-sm">预览区域</p>
                <p className="text-xs mt-1">输入描述后点击生成</p>
              </div>
            )}

            {/* Image Error */}
            {imgError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                {imgError}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useCallback, useEffect } from 'react'
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

export default function Workspace() {
  const [selectedPlatform, setSelectedPlatform] = useState(PLATFORMS[0].key)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [previewPlatform, setPreviewPlatform] = useState<string | null>(null)

  // Load prompt from localStorage if coming from Prompts page
  useEffect(() => {
    const savedPrompt = localStorage.getItem('selectedPrompt')
    if (savedPrompt) {
      setCustomPrompt(savedPrompt)
      localStorage.removeItem('selectedPrompt')
    }
  }, [])

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setError('图片大小不能超过10MB')
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('只支持 JPG、PNG、WebP 格式')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string)
      setError(null)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setError('图片大小不能超过10MB')
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('只支持 JPG、PNG、WebP 格式')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string)
      setError(null)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleQuickPrompt = (prompt: string) => {
    setCustomPrompt(prompt)
    setShowTemplates(false)
  }

  const handleGenerate = async () => {
    if (!uploadedImage && !customPrompt) {
      setError('请上传图片或输入提示词')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedImages([])
    setGenerationProgress(0)

    // Simulate progress for demo (real API would stream progress)
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + Math.random() * 15
      })
    }, 500)

    try {
      const token = localStorage.getItem('token')

      // Pass the base64 data URI directly to the API.
      // The backend forwards it to SiliconFlow as-is (Kolors supports data URI for img2img).
      // No more local HTTP server dependency, works from any network location.
      const response = await axios.post(
        `${API_BASE}/images/generate`,
        {
          platform: selectedPlatform,
          prompt: customPrompt,
          negativePrompt,
          imageUrl: uploadedImage || undefined, // data URI or regular URL
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      clearInterval(progressInterval)
      setGenerationProgress(100)

      const platformInfo = PLATFORMS.find((p) => p.key === selectedPlatform)
      setGeneratedImages([
        {
          id: response.data.data.id,
          url: response.data.data.url,
          platform: platformInfo?.name || selectedPlatform,
          width: platformInfo?.width || 800,
          height: platformInfo?.height || 800,
          status: 'completed',
          createdAt: new Date().toISOString(),
        },
      ])
    } catch (err: any) {
      clearInterval(progressInterval)
      const message = err.response?.data?.message || '生成失败，请重试'
      setError(message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = (img: GeneratedImage) => {
    const link = document.createElement('a')
    link.href = img.url
    link.download = `prompt-studio-${img.platform}-${Date.now()}.png`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCopyLink = (img: GeneratedImage) => {
    navigator.clipboard.writeText(img.url)
    alert('链接已复制到剪贴板')
  }

  const selectedPlatformInfo = PLATFORMS.find((p) => p.key === selectedPlatform)

  // Preview aspect ratio based on selected platform
  const previewAspect = selectedPlatformInfo?.aspect || '1/1'

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">图片工作台</h1>
        <p className="text-sm md:text-base text-gray-600">上传产品图，选择平台和风格，AI自动生成营销图片</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 md:gap-8">
        {/* Left Column - Input */}
        <div className="space-y-4 md:space-y-6">
          {/* Platform Selection */}
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              选择目标平台
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform.key}
                  onClick={() => setSelectedPlatform(platform.key)}
                  className={`px-2 md:px-3 py-2 text-xs md:text-sm rounded-lg border transition-all text-left ${
                    selectedPlatform === platform.key
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                      : 'border-gray-200 hover:border-indigo-300 text-gray-600'
                  }`}
                >
                  <div className="truncate">{platform.name.split('(')[0]}</div>
                  <div className="text-xs text-gray-400">{platform.width}×{platform.height}</div>
                </button>
              ))}
            </div>
            {/* Platform size info */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="font-medium">{selectedPlatformInfo?.name}</span>
              <span>|</span>
              <span>尺寸: {selectedPlatformInfo?.width}×{selectedPlatformInfo?.height}px</span>
              <span>|</span>
              <span>比例: {previewAspect}</span>
            </div>
          </div>

          {/* Image Upload */}
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              上传产品图（可选）
            </label>
            <div
              className={`border-2 border-dashed rounded-xl p-4 md:p-8 text-center transition-all cursor-pointer ${
                isDragOver
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-300 hover:border-indigo-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('image-upload')?.click()}
            >
              {uploadedImage ? (
                <div className="relative">
                  <img
                    src={uploadedImage}
                    alt="Uploaded"
                    className="max-h-48 md:max-h-64 mx-auto rounded-lg object-contain"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setUploadedImage(null)
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors text-lg font-bold"
                  >
                    ×
                  </button>
                  <p className="mt-2 text-xs text-gray-500">点击或拖拽更换图片</p>
                </div>
              ) : (
                <div className="text-gray-500">
                  <svg className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="font-medium text-sm md:text-base">拖拽图片到此处，或点击上传</p>
                  <p className="text-xs md:text-sm mt-1">支持 JPG、PNG、WebP，最大 10MB</p>
                </div>
              )}
            </div>
            <input
              id="image-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Prompt Input */}
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                输入图片描述
              </label>
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
                  {QUICK_PROMPTS.map((template) => (
                    <button
                      key={template.label}
                      onClick={() => handleQuickPrompt(template.prompt)}
                      className="px-2 md:px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs md:text-sm hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                    >
                      {template.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="描述你想要的图片风格，例如：放在海边场景，突出清凉感，适合夏日营销..."
              className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm md:text-base"
              rows={3}
            />

            <div className="mt-3 md:mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                负面提示词（可选）
              </label>
              <input
                type="text"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="不想出现的内容，如：文字、水印、低质量"
                className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3 md:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-base md:text-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                使用 SiliconFlow (Kolors) 生成中 {Math.round(generationProgress)}%...
              </span>
            ) : (
              '🎨 使用 SiliconFlow (Kolors) 生成图片'
            )}
          </button>
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-4 md:space-y-6">
          {/* Preview Card */}
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">图片预览</h3>
              <div className="flex items-center gap-2">
                {selectedPlatformInfo && (
                  <span className="text-xs md:text-sm text-gray-500 hidden sm:block">
                    {selectedPlatformInfo.width}×{selectedPlatformInfo.height}
                  </span>
                )}
                {generatedImages.length > 0 && (
                  <button
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    className="text-xs md:text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    {isPreviewMode ? '关闭预览' : '平台预览'}
                  </button>
                )}
              </div>
            </div>

            {isGenerating ? (
              <div className="space-y-4">
                {/* Generation progress */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative w-24 h-24">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="#E5E7EB"
                          strokeWidth="8"
                          fill="none"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="url(#progress-gradient)"
                          strokeWidth="8"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={`${generationProgress * 2.51} 251`}
                        />
                        <defs>
                          <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#6366F1" />
                            <stop offset="100%" stopColor="#A855F7" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-700">
                        {Math.round(generationProgress)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-center text-gray-600 text-sm">AI正在生成图片，请稍候...</p>
                  <div className="mt-4 flex justify-center gap-1">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : generatedImages.length > 0 ? (
              <div className="space-y-4">
                {generatedImages.map((img) => (
                  <div key={img.id} className="space-y-3">
                    <div className="relative">
                      <img
                        src={img.url}
                        alt="Generated"
                        className="w-full rounded-lg"
                        style={{
                          aspectRatio: isPreviewMode && previewPlatform
                            ? PLATFORMS.find(p => p.key === previewPlatform)?.aspect || '1/1'
                            : `${img.width}/${img.height}`
                        }}
                      />
                      {/* Platform switcher when preview mode is on */}
                      {isPreviewMode && (
                        <div className="absolute top-2 left-2 right-2">
                          <div className="flex gap-1 overflow-x-auto pb-1">
                            {PLATFORMS.slice(0, 5).map((p) => (
                              <button
                                key={p.key}
                                onClick={() => setPreviewPlatform(p.key)}
                                className={`px-2 py-1 text-xs rounded whitespace-nowrap ${
                                  previewPlatform === p.key || (!previewPlatform && selectedPlatform === p.key)
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-black/50 text-white hover:bg-black/70'
                                }`}
                              >
                                {p.name.split('(')[0]}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownload(img)}
                        className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm"
                      >
                        ⬇️ 下载图片
                      </button>
                      <button
                        onClick={() => handleCopyLink(img)}
                        className="px-4 py-2 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors border text-sm"
                      >
                        复制链接
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden"
                style={{ aspectRatio: previewAspect }}
              >
                <div className="text-center text-gray-400 p-4">
                  <svg className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm md:text-base">生成的图片将在此处显示</p>
                  <p className="text-xs mt-1 text-gray-400">当前预览: {selectedPlatformInfo?.name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h4 className="font-medium text-yellow-800 mb-2">💡 生成技巧</h4>
            <ul className="text-xs md:text-sm text-yellow-700 space-y-1">
              <li>• 由 SiliconFlow (Kolors) 提供图像生成能力，当前为文生图模式</li>
              <li>• 参考图功能（img2img）暂未开放，请在中提示词里描述你想要的场景</li>
              <li>• 描述越具体（如"产品放在海边场景，清凉夏日感"），效果越好</li>
              <li>• 使用负面提示词可以避免不想要的元素</li>
              <li>• 可以在快捷模板中选择适合的风格</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useCallback } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

// Platform options with sizes
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

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('图片大小不能超过10MB')
      return
    }

    // Validate file type
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return

    // Validate
    if (file.size > 10 * 1024 * 1024) {
      setError('图片大小不能超过10MB')
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

    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        `${API_BASE}/images/generate`,
        {
          platform: selectedPlatform,
          prompt: customPrompt,
          negativePrompt,
          imageUrl: uploadedImage, // In production, upload to cloud first
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

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
      const message = err.response?.data?.message || '生成失败，请重试'
      setError(message)
    } finally {
      setIsGenerating(false)
    }
  }

  const selectedPlatformInfo = PLATFORMS.find((p) => p.key === selectedPlatform)

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">图片工作台</h1>
        <p className="text-gray-600">上传产品图，选择平台和风格，AI自动生成营销图片</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Input */}
        <div className="space-y-6">
          {/* Platform Selection */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              选择目标平台
            </label>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {PLATFORMS.map((platform) => (
                <option key={platform.key} value={platform.key}>
                  {platform.name} ({platform.width}×{platform.height})
                </option>
              ))}
            </select>
          </div>

          {/* Image Upload */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              上传产品图（可选）
            </label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => document.getElementById('image-upload')?.click()}
            >
              {uploadedImage ? (
                <div className="relative">
                  <img
                    src={uploadedImage}
                    alt="Uploaded"
                    className="max-h-64 mx-auto rounded-lg"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setUploadedImage(null)
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="font-medium">拖拽图片到此处，或点击上传</p>
                  <p className="text-sm mt-1">支持 JPG、PNG、WebP，最大 10MB</p>
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
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                输入图片描述
              </label>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                {showTemplates ? '收起模板' : '快捷模板'}
              </button>
            </div>

            {showTemplates && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-3">点击使用预设模板：</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((template) => (
                    <button
                      key={template.label}
                      onClick={() => handleQuickPrompt(template.prompt)}
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm hover:border-indigo-400 hover:text-indigo-600 transition-colors"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              rows={4}
            />

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                负面提示词（可选）
              </label>
              <input
                type="text"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="不想出现的内容，如：文字、水印、低质量"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                生成中，请稍候...
              </span>
            ) : (
              '🎨 AI生成图片'
            )}
          </button>
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-6">
          {/* Preview Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">图片预览</h3>
              {selectedPlatformInfo && (
                <span className="text-sm text-gray-500">
                  {selectedPlatformInfo.width}×{selectedPlatformInfo.height}
                </span>
              )}
            </div>

            {generatedImages.length > 0 ? (
              <div className="space-y-4">
                {generatedImages.map((img) => (
                  <div key={img.id} className="relative">
                    <img
                      src={img.url}
                      alt="Generated"
                      className="w-full rounded-lg"
                    />
                    <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                      <button className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                        下载图片
                      </button>
                      <button className="px-4 py-2 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors border">
                        复制链接
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>生成的图片将在此处显示</p>
                </div>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h4 className="font-medium text-yellow-800 mb-2">💡 生成技巧</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 上传清晰的产品图效果更好</li>
              <li>• 描述越具体，生成效果越符合预期</li>
              <li>• 使用负面提示词可以避免不想要的元素</li>
              <li>• 可以在快捷模板中选择适合的风格</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

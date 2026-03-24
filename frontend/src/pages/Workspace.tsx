import { useState, useRef, useCallback } from 'react'
import { useUserStore } from '../stores/userStore'
import { apiClient } from '../api'

const PLATFORMS = ['淘宝', '拼多多', '京东', '小红书', '抖音', '公众号']

const TEMPLATE_TAGS = ['夏日清凉', '简约风', '促销热卖', '高级感', 'ins风']

const EXPORT_SIZES = ['1:1', '3:4', '4:3', '16:9']

interface GeneratedImage {
  id: string
  url: string
  prompt: string
}

export default function Workspace() {
  const [platform, setPlatform] = useState('淘宝')
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [prompt, setPrompt] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { dailyQuota, refreshQuota } = useUserStore()

  const handleFile = useCallback((file: File) => {
    if (!file.type.match(/^image\/(jpeg|png)$/)) {
      alert('仅支持 JPG/PNG 格式')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('图片最大 10MB')
      return
    }
    setUploadedImage(file)
    setPreviewUrl(URL.createObjectURL(file))
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag === selectedTag ? '' : tag)
  }

  const handleGenerate = async () => {
    if (!uploadedImage) {
      alert('请先上传产品图')
      return
    }
    if (!prompt && !selectedTag) {
      alert('请输入需求描述或选择模板')
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('image', uploadedImage)
      formData.append('platform', platform)
      formData.append('prompt', selectedTag ? `[${selectedTag}] ${prompt}` : prompt)

      const res = await apiClient.post('/api/v1/generate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setImages(res.data.images)
      await refreshQuota()
    } catch {
      alert('生成失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (img: GeneratedImage) => {
    const a = document.createElement('a')
    a.href = img.url
    a.download = `prompt-studio-${img.id}.png`
    a.click()
  }

  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">创建营销图片</h1>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Upload + Prompt */}
        <div className="space-y-6">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            {previewUrl ? (
              <div className="relative">
                <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-lg object-contain" />
                <button
                  onClick={() => { setUploadedImage(null); setPreviewUrl('') }}
                  className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full text-sm hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div>
                <p className="text-gray-500 mb-4">拖拽产品图到此处，或</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  点击上传
                </button>
                <p className="text-xs text-gray-400 mt-2">支持 JPG/PNG，最大 10MB</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">需求描述</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="描述你想要的图片风格和场景，如：放在海边场景，突出清凉感，适合夏季促销"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Template Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">快捷模板</label>
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                    selectedTag === tag
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '生成中...' : '生成图片'}
            </button>
            <span className="text-sm text-gray-500">今日剩余次数: {dailyQuota}</span>
          </div>
        </div>

        {/* Right Column: Results */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">生成结果</h2>
          {images.length === 0 ? (
            <div className="h-80 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400">
              暂无生成结果
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {images.map((img) => (
                <div key={img.id} className="relative group">
                  <img src={img.url} alt={img.prompt} className="w-full rounded-lg object-cover aspect-square" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-2">
                    <button
                      onClick={() => handleDownload(img)}
                      className="px-3 py-1 bg-white text-gray-900 rounded text-sm hover:bg-gray-100"
                    >
                      下载
                    </button>
                    <div className="flex gap-1">
                      {EXPORT_SIZES.map((size) => (
                        <button
                          key={size}
                          className="px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

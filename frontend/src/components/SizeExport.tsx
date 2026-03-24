import { useState } from 'react'
import { Platform, SizeOption, getPlatformSizes, PLATFORM_SIZES } from '../utils/platform'

interface SizeExportProps {
  platform: Platform
  imageUrl: string
  onSizeChange?: (size: SizeOption) => void
}

export default function SizeExport({ platform, imageUrl, onSizeChange }: SizeExportProps) {
  const [selectedSize, setSelectedSize] = useState<SizeOption | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const sizes = getPlatformSizes(platform)
  const platformName = PLATFORM_SIZES[platform]?.name || platform

  const handleSizeSelect = (size: SizeOption) => {
    setSelectedSize(size)
    onSizeChange?.(size)
  }

  const handleDownload = async () => {
    if (!selectedSize || !imageUrl) return

    setIsDownloading(true)
    try {
      // Fetch the image
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const img = new Image()
      img.crossOrigin = 'anonymous'

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = URL.createObjectURL(blob)
      })

      // Create canvas for resizing
      const canvas = document.createElement('canvas')
      canvas.width = selectedSize.width
      canvas.height = selectedSize.height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Failed to get canvas context')

      // Calculate aspect-ratio-aware scaling
      const sourceRatio = img.width / img.height
      const targetRatio = selectedSize.width / selectedSize.height

      let sx = 0, sy = 0, sw = img.width, sh = img.height

      if (sourceRatio > targetRatio) {
        // Source is wider, crop sides
        sw = img.height * targetRatio
        sx = (img.width - sw) / 2
      } else if (sourceRatio < targetRatio) {
        // Source is taller, crop top/bottom
        sh = img.width / targetRatio
        sy = (img.height - sh) / 2
      }

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, selectedSize.width, selectedSize.height)

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${platform}_${selectedSize.key}_${selectedSize.width}x${selectedSize.height}.png`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }
        setIsDownloading(false)
      }, 'image/png')
    } catch (error) {
      console.error('Download failed:', error)
      setIsDownloading(false)
    }
  }

  if (sizes.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">
          多尺寸导出 - {platformName}
        </h3>
      </div>

      {/* Size options */}
      <div className="flex flex-wrap gap-2 mb-4">
        {sizes.map((size) => (
          <button
            key={size.key}
            onClick={() => handleSizeSelect(size)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              selectedSize?.key === size.key
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="font-medium">{size.label}</div>
            <div className="text-xs text-gray-500">
              {size.width}×{size.height}
              {size.maxSize && ` / ≤${size.maxSize}KB`}
            </div>
          </button>
        ))}
      </div>

      {/* Preview info */}
      {selectedSize && (
        <div className="bg-gray-50 rounded-md p-3 mb-4">
          <div className="text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span>
                <strong>尺寸:</strong> {selectedSize.width} × {selectedSize.height} px
              </span>
              {selectedSize.ratio && (
                <span>
                  <strong>比例:</strong> {selectedSize.ratio}
                </span>
              )}
              {selectedSize.maxSize && (
                <span>
                  <strong>大小限制:</strong> ≤{selectedSize.maxSize}KB
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={!selectedSize || isDownloading || !imageUrl}
        className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
          !selectedSize || isDownloading || !imageUrl
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isDownloading ? '导出中...' : '下载当前尺寸'}
      </button>
    </div>
  )
}

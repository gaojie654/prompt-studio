// Platform size configurations for multi-size adaptation

export const PLATFORM_SIZES = {
  // 电商平台
  taobao: {
    name: '淘宝',
    mainImage: { width: 800, height: 800, maxSize: 500 }, // KB
    detailPage: { width: 750 },
  },
  pinduoduo: {
    name: '拼多多',
    mainImage: { width: 750, height: 352, maxSize: 100 },
    carousel: { width: 800, height: 800 },
    detailPage: { width: 790 },
  },
  jingdong: {
    name: '京东',
    mainImage: { width: 800, height: 800, maxSize: 2048 },
    detailPagePC: { width: 750 },
    detailPageMobile: { width: 640 },
  },
  // 社交媒体
  xiaohongshu: {
    name: '小红书',
    coverVertical: { width: 1080, height: 1440, ratio: '3:4' },
    coverSquare: { width: 1080, height: 1080, ratio: '1:1' },
  },
  douyin: {
    name: '抖音',
    coverVertical: { width: 1080, height: 1920, ratio: '9:16' },
    post: { width: 1200, height: 627, ratio: '1.91:1' },
  },
  wechat: {
    name: '微信公众号',
    headLine: { width: 900, height: 383, ratio: '2.35:1' },
    second: { width: 200, height: 200, ratio: '1:1' },
  },
} as const

export type Platform = keyof typeof PLATFORM_SIZES

export type SizeType<P extends Platform> = keyof (typeof PLATFORM_SIZES)[P]

export interface SizeOption {
  key: string
  label: string
  width: number
  height: number
  maxSize?: number
  ratio?: string
}

export function getPlatformSizes<P extends Platform>(platform: P): SizeOption[] {
  const platformConfig = PLATFORM_SIZES[platform]
  const sizes: SizeOption[] = []

  for (const [key, value] of Object.entries(platformConfig)) {
    if (key === 'name') continue
    if (typeof value === 'object' && 'width' in value) {
      sizes.push({
        key,
        label: formatSizeLabel(key),
        width: value.width,
        height: value.height ?? 0,
        maxSize: value.maxSize,
        ratio: value.ratio,
      })
    }
  }

  return sizes
}

function formatSizeLabel(key: string): string {
  const labels: Record<string, string> = {
    mainImage: '主图',
    detailPage: '详情页',
    carousel: '轮播图',
    detailPagePC: 'PC详情页',
    detailPageMobile: '移动详情页',
    coverVertical: '竖版封面',
    coverSquare: '方版封面',
    post: '图文帖子',
    headLine: '头图',
    second: '次图',
  }
  return labels[key] || key
}

export const PLATFORM_CATEGORIES = {
  ecommerce: ['taobao', 'pinduoduo', 'jingdong'] as Platform[],
  social: ['xiaohongshu', 'douyin', 'wechat'] as Platform[],
}

export function getPlatformCategory(platform: Platform): 'ecommerce' | 'social' {
  if (PLATFORM_CATEGORIES.ecommerce.includes(platform)) return 'ecommerce'
  return 'social'
}

export const ALL_PLATFORMS = Object.keys(PLATFORM_SIZES) as Platform[]

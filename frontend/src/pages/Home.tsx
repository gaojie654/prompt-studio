import { Link } from 'react-router-dom'

const features = [
  {
    icon: '🎨',
    title: '智能提示词',
    description: '输入需求，AI匹配最佳提示词',
  },
  {
    icon: '🖼️',
    title: '一键生成',
    description: '上传产品图，生成营销图片',
  },
  {
    icon: '📐',
    title: '多平台适配',
    description: '支持淘宝/抖音/小红书/京东等',
  },
]

const pricingPlans = [
  { name: '免费', price: '¥0', quota: '每天5次' },
  { name: '月卡', price: '¥29', quota: '每天50次' },
  { name: '年卡', price: '¥199', quota: '每天100次' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-50 to-blue-100 py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">AI提示词生成神器</h1>
          <p className="text-xl text-gray-600 mb-10">
            为电商和自媒体创作者打造的营销图片生成工具
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/workspace"
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              立即开始
            </Link>
            <a
              href="#features"
              className="px-8 py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-50 transition-colors border border-indigo-200"
            >
              了解更多
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">核心功能</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="p-6 bg-gray-50 rounded-xl text-center hover:shadow-lg transition-shadow">
                <div className="text-5xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">定价方案</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan) => (
              <div key={plan.name} className="bg-white rounded-xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{plan.name}</h3>
                <div className="text-4xl font-bold text-indigo-600 mb-2">{plan.price}</div>
                <p className="text-gray-500">{plan.quota}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-indigo-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-white text-lg">
            还没有账号？{' '}
            <Link to="/workspace" className="underline font-medium hover:text-indigo-200">
              立即注册
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}

import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              AI驱动的营销图片
              <br />
              <span className="text-yellow-300">一键生成</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              上传产品图，AI自动生成适用于淘宝、抖音、小红书等平台的
              <br />
              营销图片，省时省力，提升转化率
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/workspace"
                className="px-8 py-4 bg-white text-indigo-600 rounded-lg font-semibold text-lg hover:bg-yellow-300 hover:text-indigo-700 transition-all shadow-lg"
              >
                立即开始免费试用
              </Link>
              <Link
                to="/prompts"
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold text-lg hover:bg-white/10 transition-all"
              >
                浏览提示词库
              </Link>
            </div>
            <p className="mt-6 text-white/70 text-sm">
              ✨ 每日免费100次生成额度，无需信用卡
            </p>
          </div>
        </div>

        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F9FAFB"/>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              为什么选择 Prompt Studio？
            </h2>
            <p className="text-xl text-gray-600">
              一站式AI营销图片解决方案
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">极速生成</h3>
              <p className="text-gray-600">
                10秒内即可生成多张高质量营销图片，支持多种尺寸规格，适配各大平台
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">多平台适配</h3>
              <p className="text-gray-600">
                淘宝、拼多多、京东、抖音、小红书、公众号，自动匹配最佳图片尺寸
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">海量提示词</h3>
              <p className="text-gray-600">
                内置丰富提示词库，覆盖各行业场景，也可自定义编辑，灵活适用
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Platforms */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              支持的主流平台
            </h2>
            <p className="text-xl text-gray-600">
              一键生成，覆盖电商与社交媒体全渠道
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: '淘宝', icon: '🛒' },
              { name: '拼多多', icon: '📦' },
              { name: '京东', icon: '📱' },
              { name: '小红书', icon: '📕' },
              { name: '抖音', icon: '🎵' },
              { name: '公众号', icon: '📰' },
            ].map((platform) => (
              <div
                key={platform.name}
                className="bg-gray-50 rounded-xl p-6 text-center hover:bg-indigo-50 transition-colors"
              >
                <div className="text-4xl mb-3">{platform.icon}</div>
                <div className="font-medium text-gray-900">{platform.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              使用步骤
            </h2>
            <p className="text-xl text-gray-600">
              三步完成AI图片生成
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                上传产品图
              </h3>
              <p className="text-gray-600">
                拖拽或点击上传您的产品图片，支持JPG、PNG格式
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                选择平台和风格
              </h3>
              <p className="text-gray-600">
                选目标平台，输入想要的风格或选择预设模板
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                AI一键生成
              </h3>
              <p className="text-gray-600">
                等待10秒，获得多张高质量营销图片，直接下载使用
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            准备好提升您的营销效率了吗？
          </h2>
          <p className="text-xl text-white/90 mb-8">
            加入 thousands of 商家，正在使用 Prompt Studio
          </p>
          <Link
            to="/workspace"
            className="inline-block px-10 py-4 bg-white text-indigo-600 rounded-lg font-semibold text-lg hover:bg-yellow-300 hover:text-indigo-700 transition-all shadow-lg"
          >
            立即免费试用
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="text-2xl font-bold text-white mb-2">Prompt Studio</div>
              <div className="text-sm">AI驱动的营销图片生成工具</div>
            </div>
            <div className="flex gap-6 text-sm">
              <Link to="/workspace" className="hover:text-white transition-colors">工作台</Link>
              <Link to="/prompts" className="hover:text-white transition-colors">提示词库</Link>
              <Link to="/profile" className="hover:text-white transition-colors">个人中心</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            © 2026 Prompt Studio. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

import { useState } from 'react'

export default function Settings() {
  const [apiKey, setApiKey] = useState('')
  const [pricePerImage, setPricePerImage] = useState('0.1')
  const [freeDailyLimit, setFreeDailyLimit] = useState('10')
  const [announcement, setAnnouncement] = useState('')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-xl font-semibold text-gray-800">系统设置</h2>

      {/* AI模型配置 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">AI模型配置</h3>
        <div>
          <label className="block text-sm text-gray-600 mb-2">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="请输入AI模型API Key"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 价格配置 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">价格配置</h3>
        <div>
          <label className="block text-sm text-gray-600 mb-2">生成单价（元/张）</label>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">¥</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={pricePerImage}
              onChange={(e) => setPricePerImage(e.target.value)}
              className="w-32 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 额度配置 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">额度配置</h3>
        <div>
          <label className="block text-sm text-gray-600 mb-2">免费用户每日次数</label>
          <input
            type="number"
            min="0"
            value={freeDailyLimit}
            onChange={(e) => setFreeDailyLimit(e.target.value)}
            className="w-32 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-500">次/天</span>
        </div>
      </div>

      {/* 公告管理 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">公告管理</h3>
        <div>
          <label className="block text-sm text-gray-600 mb-2">发布公告</label>
          <textarea
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            placeholder="请输入公告内容，留空则不显示公告"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>

      {/* 保存按钮 */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
        >
          保存设置
        </button>
        {saved && (
          <span className="text-sm text-green-600">✓ 保存成功</span>
        )}
      </div>
    </div>
  )
}

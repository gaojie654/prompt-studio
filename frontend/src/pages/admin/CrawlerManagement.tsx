import { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

interface CrawlerStatus {
  running: boolean
  startedAt: string | null
  completedAt: string | null
  total: number
  seeded: number
  skipped: number
  errors: number
  current: string | null
  logs: string[]
}

export default function CrawlerManagement() {
  const [status, setStatus] = useState<CrawlerStatus>({
    running: false,
    startedAt: null,
    completedAt: null,
    total: 0,
    seeded: 0,
    skipped: 0,
    errors: 0,
    current: null,
    logs: [],
  })
  const [loading, setLoading] = useState(false)

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await axios.get(`${API_BASE}/v1/admin/crawl/opennana/status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setStatus(response.data)
    } catch (err) {
      console.error('Failed to fetch crawler status')
    }
  }

  const startCrawler = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      await axios.post(`${API_BASE}/v1/admin/crawl/opennana`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      await fetchStatus()
    } catch (err) {
      console.error('Failed to start crawler')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 3000)
    return () => clearInterval(interval)
  }, [])

  const displayLogs = status.logs.slice(-20)

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">爬虫管理</h2>

      {/* 状态卡片 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">状态</p>
            <p className={`text-lg font-semibold ${status.running ? 'text-green-600' : 'text-gray-400'}`}>
              {status.running ? '运行中' : '空闲'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">开始时间</p>
            <p className="text-sm font-medium text-gray-700">
              {status.startedAt ? new Date(status.startedAt).toLocaleString('zh-CN') : '-'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">总数</p>
            <p className="text-lg font-semibold text-gray-800">{status.total.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">已爬</p>
            <p className="text-lg font-semibold text-green-600">{status.seeded.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">跳过</p>
            <p className="text-lg font-semibold text-yellow-600">{status.skipped.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">错误</p>
            <p className="text-lg font-semibold text-red-600">{status.errors.toLocaleString()}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-500 mb-1">当前URL</p>
            <p className="text-sm font-medium text-gray-700 truncate">
              {status.current || '-'}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={startCrawler}
            disabled={loading || status.running}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              status.running
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? '启动中...' : status.running ? '运行中...' : '启动爬虫'}
          </button>
          {status.completedAt && !status.running && (
            <span className="text-sm text-gray-500">
              完成时间：{new Date(status.completedAt).toLocaleString('zh-CN')}
            </span>
          )}
        </div>
      </div>

      {/* 日志列表 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">爬虫日志</h3>
          <p className="text-xs text-gray-500 mt-1">实时显示最近 20 条日志</p>
        </div>
        <div className="p-4 max-h-96 overflow-y-auto">
          {displayLogs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">暂无日志</p>
          ) : (
            <div className="space-y-1">
              {displayLogs.map((log, index) => (
                <div key={index} className="text-xs font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

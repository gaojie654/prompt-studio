import { useState } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

export default function Feedback() {
  const [feedbackType, setFeedbackType] = useState<'bug' | 'suggestion' | 'other'>('suggestion')
  const [content, setContent] = useState('')
  const [contact, setContact] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) {
      setError('请输入反馈内容')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      await axios.post(
        `${API_BASE}/feedback`,
        { type: feedbackType, content, contact },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      )
      setSubmitted(true)
      setContent('')
      setContact('')
    } catch (err: any) {
      setError(err.response?.data?.message || '提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✅</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">感谢您的反馈！</h2>
        <p className="text-gray-600 mb-6">我们已收到您的反馈，会认真处理并改进</p>
        <button
          onClick={() => setSubmitted(false)}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          继续反馈
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">意见反馈</h1>
        <p className="text-gray-600">我们重视您的每一条反馈，帮助我们做得更好</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Feedback Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              反馈类型
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'bug', label: '🐛 Bug报告', desc: '功能异常或错误' },
                { key: 'suggestion', label: '💡 功能建议', desc: '新功能或改进想法' },
                { key: 'other', label: '💬 其他', desc: '其他问题或留言' },
              ].map((type) => (
                <button
                  key={type.key}
                  type="button"
                  onClick={() => setFeedbackType(type.key as any)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    feedbackType === type.key
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              反馈内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请详细描述您遇到的问题或建议..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              rows={5}
            />
          </div>

          {/* Contact */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              联系方式（选填）
            </label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="邮箱或微信，方便我们联系您"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? '提交中...' : '提交反馈'}
          </button>
        </form>

        {/* Quick links */}
        <div className="mt-6 pt-6 border-t">
          <p className="text-sm text-gray-500 text-center mb-3">遇到紧急问题？</p>
          <div className="flex justify-center gap-4 text-sm">
            <a href="mailto:support@promptstudio.com" className="text-indigo-600 hover:text-indigo-700">
              📧 邮件联系
            </a>
            <span className="text-gray-300">|</span>
            <a href="https://github.com/gaojie654/prompt-studio/issues" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700">
              🐛 GitHub Issues
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

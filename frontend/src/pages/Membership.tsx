import { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

interface MembershipCard {
  id: string
  type: 'month' | 'year'
  durationDays: number
  price: number
  label: string
  description: string
  popular?: boolean
  benefits: string[]
}

type PaymentMethod = 'WECHAT' | 'ALIPAY'
type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'UNKNOWN'

interface OrderResult {
  order: {
    id: string
    orderNo: string
    amount: number
    status: string
  }
  payment: {
    codeUrl?: string
    qrCode?: string
    paymentUrl?: string
  }
}

export default function Membership() {
  const [cards, setCards] = useState<MembershipCard[]>([])
  const [selectedCard, setSelectedCard] = useState<MembershipCard | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('WECHAT')
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [qrCode, setQrCode] = useState<string>('')
  const [orderNo, setOrderNo] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PENDING')
  const [polling, setPolling] = useState(false)

  useEffect(() => {
    fetchCards()
  }, [])

  const fetchCards = async () => {
    try {
      const res = await axios.get(`${API_BASE}/v1/payment/packages/membership`)
      setCards(res.data.cards)
    } catch (err) {
      console.error('Failed to fetch cards:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async () => {
    if (!selectedCard) return
    setPaying(true)
    setShowQR(false)
    setPaymentStatus('PENDING')

    try {
      const token = localStorage.getItem('token')
      const res = await axios.post<OrderResult>(
        `${API_BASE}/v1/payment/membership`,
        {
          cardId: selectedCard.id,
          paymentMethod,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const { order, payment } = res.data
      setOrderNo(order.orderNo)

      if (paymentMethod === 'WECHAT') {
        if (payment.qrCode) {
          setQrCode(payment.qrCode)
        } else if (payment.codeUrl) {
          setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(payment.codeUrl)}`)
        }
        setShowQR(true)
        startPolling(order.orderNo)
      } else if (paymentMethod === 'ALIPAY') {
        if (payment.paymentUrl) {
          window.location.href = payment.paymentUrl
          startPolling(order.orderNo)
        }
      }
    } catch (err) {
      console.error('Payment failed:', err)
      alert('创建订单失败，请重试')
    } finally {
      setPaying(false)
    }
  }

  const startPolling = (currentOrderNo: string) => {
    setPolling(true)
    const poll = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await axios.get(`${API_BASE}/v1/payment/wechat/status/${currentOrderNo}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const status = res.data.status as PaymentStatus
        setPaymentStatus(status)

        if (status === 'PAID') {
          setPolling(false)
          return
        }
      } catch (err) {
        console.error('Polling error:', err)
      }

      if (paymentStatus !== 'PAID') {
        setTimeout(poll, 3000)
      }
    }
    setTimeout(poll, 3000)
  }

  const closeQRModal = () => {
    setShowQR(false)
    setQrCode('')
    setOrderNo('')
    setPaymentStatus('PENDING')
    setPolling(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">开通会员</h1>
        <p className="text-gray-600">解锁更多权益，享受专属服务</p>
      </div>

      {/* Membership Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => setSelectedCard(card)}
            className={`relative bg-white rounded-2xl p-6 text-left transition-all border-2 ${
              selectedCard?.id === card.id
                ? 'border-indigo-500 shadow-lg'
                : 'border-transparent shadow-sm hover:shadow-md'
            }`}
          >
            {card.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-medium rounded-full">
                ⭐ 推荐选择
              </span>
            )}

            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-bold text-gray-900">{card.label}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${card.type === 'year' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                {card.type === 'year' ? '年' : '月'}
              </span>
            </div>

            <div className="mb-4">
              <span className="text-3xl font-bold text-indigo-600">¥{card.price}</span>
              <span className="text-gray-500 ml-1">/{card.type === 'year' ? '年' : '月'}</span>
            </div>

            <p className="text-sm text-gray-500 mb-4">{card.description}</p>

            {/* Benefits */}
            <div className="space-y-2 mb-4">
              {card.benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {benefit}
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Payment Method */}
      {selectedCard && (
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">选择支付方式</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setPaymentMethod('WECHAT')}
              className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                paymentMethod === 'WECHAT'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <span className="text-2xl">💚</span>
              <span className="font-medium text-gray-900">微信支付</span>
            </button>
            <button
              onClick={() => setPaymentMethod('ALIPAY')}
              className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                paymentMethod === 'ALIPAY'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <span className="text-2xl">💙</span>
              <span className="font-medium text-gray-900">支付宝</span>
            </button>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">会员类型</span>
              <span className="font-semibold text-gray-900">{selectedCard.label}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-600">有效期</span>
              <span className="font-semibold text-gray-900">{selectedCard.durationDays}天</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-600">支付金额</span>
              <span className="text-2xl font-bold text-indigo-600">¥{selectedCard.price}</span>
            </div>
          </div>

          <button
            onClick={handlePurchase}
            disabled={paying}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
              paying
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg'
            }`}
          >
            {paying ? '正在跳转...' : `立即开通 ¥${selectedCard.price}`}
          </button>
        </div>
      )}

      {/* Benefits Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">会员专属权益</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 text-center">
            <div className="text-3xl mb-2">⚡</div>
            <div className="font-semibold text-gray-900 mb-1">优先队列</div>
            <div className="text-sm text-gray-500">高峰期优先排队，快速响应</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center">
            <div className="text-3xl mb-2">🎁</div>
            <div className="font-semibold text-gray-900 mb-1">每日赠送积分</div>
            <div className="text-sm text-gray-500">月卡每日500，年卡每日1000</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center">
            <div className="text-3xl mb-2">💬</div>
            <div className="font-semibold text-gray-900 mb-1">专属客服</div>
            <div className="text-sm text-gray-500">7x24小时在线支持</div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-gray-900 mb-2">💡 温馨提示</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 会员开通后即时生效</li>
          <li>• 年卡会员可享额外8折优惠</li>
          <li>• 会员权益不可叠加，以最高等级为准</li>
          <li>• 如有问题请联系客服</li>
        </ul>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-4">请扫码支付</h3>

            {qrCode && (
              <div className="mb-4">
                <img src={qrCode} alt="支付二维码" className="mx-auto w-48 h-48" />
              </div>
            )}

            <div className="mb-4">
              <p className="text-gray-600 text-sm">应付金额</p>
              <p className="text-2xl font-bold text-indigo-600">
                ¥{selectedCard?.price}
              </p>
            </div>

            <div className="mb-6">
              <p className="text-gray-500 text-sm">订单号</p>
              <p className="text-xs text-gray-400 font-mono">{orderNo}</p>
            </div>

            {/* Status indicator */}
            <div className={`mb-6 p-3 rounded-lg ${paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : paymentStatus === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {paymentStatus === 'PAID' && '✅ 支付成功！'}
              {paymentStatus === 'FAILED' && '❌ 支付失败'}
              {paymentStatus === 'PENDING' && `⏳ 等待支付${polling ? '...' : ''}`}
              {paymentStatus === 'UNKNOWN' && '❓ 状态未知'}
            </div>

            <button
              onClick={closeQRModal}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {paymentStatus === 'PAID' ? '完成' : '取消'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

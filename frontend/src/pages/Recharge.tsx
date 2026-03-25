import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

interface RechargePackage {
  id: string
  credits: number
  price: number
  label: string
  description: string
  popular?: boolean
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

export default function Recharge() {
  const [packages, setPackages] = useState<RechargePackage[]>([])
  const [selectedPackage, setSelectedPackage] = useState<RechargePackage | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('WECHAT')
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [qrCode, setQrCode] = useState<string>('')
  const [alipayUrl, setAlipayUrl] = useState<string>('')
  const [orderNo, setOrderNo] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PENDING')
  const [polling, setPolling] = useState(false)

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const res = await axios.get(`${API_BASE}/v1/payment/packages/recharge`)
      setPackages(res.data.packages)
    } catch (err) {
      console.error('Failed to fetch packages:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRecharge = async () => {
    if (!selectedPackage) return
    setPaying(true)
    setShowQR(false)
    setPaymentStatus('PENDING')

    try {
      const token = localStorage.getItem('token')
      const res = await axios.post<OrderResult>(
        `${API_BASE}/v1/payment/recharge`,
        {
          packageId: selectedPackage.id,
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
          // Generate QR code from URL
          setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(payment.codeUrl)}`)
        }
        setShowQR(true)
        startPolling(order.orderNo)
      } else if (paymentMethod === 'ALIPAY') {
        if (payment.paymentUrl) {
          setAlipayUrl(payment.paymentUrl)
          // Open alipay page
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
        <h1 className="text-3xl font-bold text-gray-900 mb-3">积分充值</h1>
        <p className="text-gray-600">选择充值档位，快速获取更多积分</p>
      </div>

      {/* Package Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {packages.map((pkg) => (
          <button
            key={pkg.id}
            onClick={() => setSelectedPackage(pkg)}
            className={`relative bg-white rounded-2xl p-6 text-left transition-all border-2 ${
              selectedPackage?.id === pkg.id
                ? 'border-indigo-500 shadow-lg scale-105'
                : 'border-transparent shadow-sm hover:shadow-md'
            }`}
          >
            {pkg.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-full">
                最受欢迎
              </span>
            )}
            <div className="text-3xl font-bold text-gray-900 mb-1">{pkg.label}</div>
            <div className="text-2xl font-bold text-indigo-600 mb-2">¥{pkg.price}</div>
            <div className="text-sm text-gray-500">{pkg.description}</div>
          </button>
        ))}
      </div>

      {/* Payment Method */}
      {selectedPackage && (
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
              <span className="text-gray-600">充值积分</span>
              <span className="font-semibold text-gray-900">{selectedPackage.label}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-600">支付金额</span>
              <span className="text-2xl font-bold text-indigo-600">¥{selectedPackage.price}</span>
            </div>
          </div>

          <button
            onClick={handleRecharge}
            disabled={paying}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
              paying
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg'
            }`}
          >
            {paying ? '正在跳转...' : `立即支付 ¥${selectedPackage.price}`}
          </button>
        </div>
      )}

      {/* Tips */}
      <div className="bg-indigo-50 rounded-xl p-4">
        <h4 className="font-semibold text-indigo-900 mb-2">💡 温馨提示</h4>
        <ul className="text-sm text-indigo-700 space-y-1">
          <li>• 积分充值成功后即时到账</li>
          <li>• 支付有效期为30分钟，请及时完成支付</li>
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
                ¥{selectedPackage?.price}
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

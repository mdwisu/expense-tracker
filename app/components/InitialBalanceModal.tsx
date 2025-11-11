'use client'

import { useState, useEffect } from 'react'

interface InitialBalanceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function InitialBalanceModal({
  isOpen,
  onClose,
  onSuccess,
}: InitialBalanceModalProps) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentBalance, setCurrentBalance] = useState<{
    amount: number
    note: string | null
  } | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchCurrentBalance()
    }
  }, [isOpen])

  const fetchCurrentBalance = async () => {
    try {
      const response = await fetch('/api/balance')
      const data = await response.json()
      setCurrentBalance(data)
      setAmount(data.amount?.toString() || '')
      setNote(data.note || '')
    } catch (error) {
      console.error('Error fetching balance:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          note: note || null,
        }),
      })

      if (response.ok) {
        onSuccess()
        onClose()
      }
    } catch (error) {
      console.error('Error setting balance:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Saldo Awal</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {currentBalance && currentBalance.amount !== 0 && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 mb-1">Saldo Awal Saat Ini:</p>
            <p className="text-xl font-bold text-blue-900">
              {formatCurrency(currentBalance.amount)}
            </p>
            {currentBalance.note && (
              <p className="text-sm text-blue-700 mt-2">{currentBalance.note}</p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah Saldo Awal <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="Masukkan saldo awal"
                required
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">
                Masukkan saldo yang Anda miliki saat mulai menggunakan aplikasi ini
              </p>
            </div>

            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                Catatan (Opsional)
              </label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="Contoh: Saldo dari tabungan bank, kas tunai, dll"
                rows={3}
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800">
                ⚠️ <strong>Catatan:</strong> Saldo awal akan digunakan untuk menghitung saldo kumulatif.
                Pastikan jumlah yang dimasukkan sesuai dengan kondisi keuangan Anda.
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !amount}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

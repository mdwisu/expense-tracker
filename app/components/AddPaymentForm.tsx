'use client'

import { useState, useEffect } from 'react'

interface Account {
  id: string
  name: string
  icon: string
  color: string
  type: string
}

interface Receivable {
  id: string
  debtorName: string
  remaining: number
}

interface AddPaymentFormProps {
  accounts: Account[]
  receivable: Receivable | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddPaymentForm({
  accounts,
  receivable,
  isOpen,
  onClose,
  onSuccess
}: AddPaymentFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    accountId: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  })

  useEffect(() => {
    if (isOpen && receivable) {
      // Reset form when modal opens
      setFormData({
        amount: '',
        accountId: '',
        date: new Date().toISOString().split('T')[0],
        note: '',
      })
    }
  }, [isOpen, receivable])

  if (!isOpen || !receivable) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handlePayFull = () => {
    setFormData({ ...formData, amount: receivable.remaining.toString() })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const amount = parseFloat(formData.amount)

      if (amount <= 0) {
        alert('Jumlah pembayaran harus lebih dari 0')
        setLoading(false)
        return
      }

      if (amount > receivable.remaining) {
        alert(`Jumlah pembayaran tidak boleh melebihi sisa piutang (${formatCurrency(receivable.remaining)})`)
        setLoading(false)
        return
      }

      const response = await fetch('/api/receivables/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receivableId: receivable.id,
          amount: formData.amount,
          accountId: formData.accountId,
          date: formData.date,
          note: formData.note || null,
        }),
      })

      if (response.ok) {
        setFormData({
          amount: '',
          accountId: '',
          date: new Date().toISOString().split('T')[0],
          note: '',
        })
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal menyimpan pembayaran')
      }
    } catch (error) {
      console.error('Error saving payment:', error)
      alert('Terjadi kesalahan saat menyimpan pembayaran')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Tambah Pembayaran
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {receivable.debtorName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Remaining info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-700">
            Sisa Piutang
          </p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(receivable.remaining)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Jumlah Dibayar (Rp) <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handlePayFull}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Bayar Lunas
              </button>
            </div>
            <input
              type="number"
              required
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
              placeholder="50000"
              max={receivable.remaining}
            />
            {formData.amount && parseFloat(formData.amount) > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Sisa setelah bayar: {formatCurrency(receivable.remaining - parseFloat(formData.amount))}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Akun Penerima <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
            >
              <option value="">Pilih akun</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.icon} {account.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Pembayaran akan ditambahkan sebagai pemasukan ke akun ini
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catatan (Opsional)
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
              placeholder="Catatan pembayaran"
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Pembayaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

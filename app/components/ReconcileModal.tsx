'use client'

import { useState, useEffect } from 'react'

interface Account {
  id: string
  name: string
  icon: string
  color: string
  type: string
}

interface AccountBalance {
  accountId: string
  accountName: string
  accountIcon: string
  balance: number
}

interface ReconcileModalProps {
  accounts: Account[]
  accountBalances: AccountBalance[]
  onSuccess: () => void
  isOpen: boolean
  onClose: () => void
}

export default function ReconcileModal({
  accounts,
  accountBalances,
  onSuccess,
  isOpen,
  onClose,
}: ReconcileModalProps) {
  const [loading, setLoading] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [actualBalance, setActualBalance] = useState('')
  const [note, setNote] = useState('')

  const selectedAccount = accounts.find((acc) => acc.id === selectedAccountId)
  const currentBalance = accountBalances.find((ab) => ab.accountId === selectedAccountId)
  const difference = actualBalance ? parseFloat(actualBalance) - (currentBalance?.balance || 0) : 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/adjustments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: selectedAccountId,
          actualBalance: parseFloat(actualBalance),
          note,
        }),
      })

      if (response.ok) {
        setSelectedAccountId('')
        setActualBalance('')
        setNote('')
        onClose()
        onSuccess()
      } else {
        const data = await response.json()
        alert(data.error || 'Gagal melakukan adjustment')
      }
    } catch (error) {
      console.error('Error creating adjustment:', error)
      alert('Terjadi kesalahan saat adjustment')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Sesuaikan Saldo Akun</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pilih Akun
            </label>
            <select
              required
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            >
              <option value="">Pilih akun</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.icon} {account.name}
                </option>
              ))}
            </select>
          </div>

          {selectedAccountId && currentBalance && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Saldo Tercatat di Sistem</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(currentBalance.balance)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Saldo Aktual (Sebenarnya)
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={actualBalance}
                  onChange={(e) => setActualBalance(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  placeholder="Masukkan saldo sebenarnya"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Masukkan saldo yang tertera di rekening/dompet Anda
                </p>
              </div>

              {actualBalance && (
                <div className={`rounded-lg p-4 ${difference >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className="text-sm text-gray-600 mb-1">Selisih</p>
                  <p className={`text-2xl font-bold ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {difference >= 0
                      ? 'Saldo aktual lebih besar (ada pemasukan tidak tercatat)'
                      : 'Saldo aktual lebih kecil (ada pengeluaran tidak tercatat)'}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan (opsional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  rows={2}
                  placeholder="Alasan penyesuaian..."
                />
              </div>
            </>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !selectedAccountId || !actualBalance}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Sesuaikan Saldo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

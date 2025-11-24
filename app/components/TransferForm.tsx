'use client'

import { useState, useEffect } from 'react'

interface Account {
  id: string
  name: string
  icon: string
  color: string
  type: string
}

interface TransferFormProps {
  accounts: Account[]
  onSuccess: () => void
  isOpen?: boolean
  onClose?: () => void
}

export default function TransferForm({
  accounts,
  onSuccess,
  isOpen: externalIsOpen,
  onClose: externalOnClose,
}: TransferFormProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    note: '',
    date: new Date().toISOString().split('T')[0],
  })

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen

  const handleClose = () => {
    if (externalOnClose) {
      externalOnClose()
    } else {
      setInternalIsOpen(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setFormData({
          fromAccountId: '',
          toAccountId: '',
          amount: '',
          note: '',
          date: new Date().toISOString().split('T')[0],
        })
        handleClose()
        onSuccess()
      } else {
        const data = await response.json()
        alert(data.error || 'Gagal melakukan transfer')
      }
    } catch (error) {
      console.error('Error creating transfer:', error)
      alert('Terjadi kesalahan saat transfer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {!externalIsOpen && (
        <button
          onClick={() => setInternalIsOpen(true)}
          className="w-full px-2 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 text-xs sm:text-sm"
          title="Transfer Antar Akun"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <span className="text-xs sm:text-sm whitespace-nowrap">Transfer</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Transfer Antar Akun</h2>
              <button
                onClick={handleClose}
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
                  Dari Akun
                </label>
                <select
                  required
                  value={formData.fromAccountId}
                  onChange={(e) => setFormData({ ...formData, fromAccountId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                >
                  <option value="">Pilih akun sumber</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.icon} {account.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ke Akun
                </label>
                <select
                  required
                  value={formData.toAccountId}
                  onChange={(e) => setFormData({ ...formData, toAccountId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                >
                  <option value="">Pilih akun tujuan</option>
                  {accounts
                    .filter((acc) => acc.id !== formData.fromAccountId)
                    .map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.icon} {account.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah (Rp)
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="1"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                  placeholder="100000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan (opsional)
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                  rows={2}
                  placeholder="Catatan transfer..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Memproses...' : 'Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

'use client'

import { useState, useEffect } from 'react'

interface Income {
  id: string
  title: string
  amount: number
  date: string
}

interface AddIncomeFormProps {
  onSuccess: () => void
  income?: Income | null
  isOpen?: boolean
  onClose?: () => void
}

export default function AddIncomeForm({
  onSuccess,
  income = null,
  isOpen: externalIsOpen,
  onClose: externalOnClose
}: AddIncomeFormProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  })

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const isEditMode = !!income

  useEffect(() => {
    if (income) {
      setFormData({
        title: income.title,
        amount: income.amount.toString(),
        date: new Date(income.date).toISOString().split('T')[0],
      })
    } else {
      setFormData({
        title: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
      })
    }
  }, [income])

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
      const url = '/api/income'
      const method = isEditMode ? 'PUT' : 'POST'
      const body = isEditMode
        ? JSON.stringify({ ...formData, id: income.id })
        : JSON.stringify(formData)

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      })

      if (response.ok) {
        setFormData({
          title: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
        })
        handleClose()
        onSuccess()
      }
    } catch (error) {
      console.error('Error saving income:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {!isEditMode && (
        <button
          onClick={() => setInternalIsOpen(true)}
          className="w-full px-2 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 text-xs sm:text-sm"
          title="Tambah Pemasukan"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="text-xs sm:text-sm whitespace-nowrap">+ Pemasukan</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {isEditMode ? 'Edit Pemasukan' : 'Tambah Pemasukan'}
              </h2>
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
                  Sumber
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
                  placeholder="Contoh: Gaji bulanan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah (Rp)
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
                  placeholder="5000000"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
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
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : isEditMode ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

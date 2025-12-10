'use client'

import { useState, useEffect } from 'react'

interface Receivable {
  id: string
  debtorName: string
  totalAmount: number
  description?: string | null
  date: string
  dueDate?: string | null
}

interface AddReceivableFormProps {
  onSuccess: () => void
  receivable?: Receivable | null
  isOpen?: boolean
  onClose?: () => void
}

export default function AddReceivableForm({
  onSuccess,
  receivable = null,
  isOpen: externalIsOpen,
  onClose: externalOnClose
}: AddReceivableFormProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    debtorName: '',
    totalAmount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
  })

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const isEditMode = !!receivable

  useEffect(() => {
    if (receivable) {
      setFormData({
        debtorName: receivable.debtorName,
        totalAmount: receivable.totalAmount.toString(),
        description: receivable.description || '',
        date: new Date(receivable.date).toISOString().split('T')[0],
        dueDate: receivable.dueDate ? new Date(receivable.dueDate).toISOString().split('T')[0] : '',
      })
    } else {
      setFormData({
        debtorName: '',
        totalAmount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
      })
    }
  }, [receivable])

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
      const url = '/api/receivables'
      const method = isEditMode ? 'PUT' : 'POST'

      const submitData: any = {
        debtorName: formData.debtorName,
        totalAmount: formData.totalAmount,
        description: formData.description || null,
        date: formData.date,
        dueDate: formData.dueDate || null,
      }

      if (isEditMode) {
        submitData.id = receivable.id
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        setFormData({
          debtorName: '',
          totalAmount: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          dueDate: '',
        })
        handleClose()
        onSuccess()
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal menyimpan piutang')
      }
    } catch (error) {
      console.error('Error saving receivable:', error)
      alert('Terjadi kesalahan saat menyimpan piutang')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {!isEditMode && (
        <button
          onClick={() => setInternalIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-transform hover:scale-110"
          title="Tambah Piutang"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {isEditMode ? 'Edit Piutang' : 'Tambah Piutang'}
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
                  Nama Orang <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.debtorName}
                  onChange={(e) => setFormData({ ...formData, debtorName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  placeholder="Contoh: Budi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  placeholder="100000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  placeholder="Catatan tambahan (opsional)"
                  rows={3}
                />
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jatuh Tempo (Opsional)
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
              </div>

              <div className="flex gap-3 pt-2">
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
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

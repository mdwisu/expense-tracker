'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AddReceivableForm from '../components/AddReceivableForm'
import ReceivableDetailModal from '../components/ReceivableDetailModal'
import AddPaymentForm from '../components/AddPaymentForm'

interface Account {
  id: string
  name: string
  icon: string
  color: string
  type: string
}

interface Payment {
  id: string
  amount: number
  date: string
  note?: string | null
  account: Account
  createdAt: string
}

interface Receivable {
  id: string
  debtorName: string
  totalAmount: number
  remaining: number
  description?: string | null
  date: string
  dueDate?: string | null
  status: string
  payments: Payment[]
  createdAt: string
}

export default function ReceivablesPage() {
  const router = useRouter()
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null)
  const [editingReceivable, setEditingReceivable] = useState<Receivable | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  useEffect(() => {
    fetchReceivables()
    fetchAccounts()
  }, [])

  const fetchReceivables = async () => {
    try {
      const response = await fetch('/api/receivables')
      if (response.ok) {
        const data = await response.json()
        setReceivables(data)
      }
    } catch (error) {
      console.error('Error fetching receivables:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts')
      if (response.ok) {
        const data = await response.json()
        setAccounts(data)
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    }
  }

  const handleDelete = async () => {
    if (!selectedReceivable) return

    if (!confirm(`Yakin ingin menghapus piutang dari ${selectedReceivable.debtorName}?`)) return

    try {
      const response = await fetch(`/api/receivables?id=${selectedReceivable.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setShowDetailModal(false)
        setSelectedReceivable(null)
        fetchReceivables()
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal menghapus piutang')
      }
    } catch (error) {
      console.error('Error deleting receivable:', error)
      alert('Terjadi kesalahan saat menghapus piutang')
    }
  }

  const handleDeletePayment = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/receivables/payments?id=${paymentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchReceivables()
        // Refresh the detail modal
        if (selectedReceivable) {
          const updatedReceivable = receivables.find(r => r.id === selectedReceivable.id)
          if (updatedReceivable) {
            setSelectedReceivable(updatedReceivable)
          }
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal menghapus pembayaran')
      }
    } catch (error) {
      console.error('Error deleting payment:', error)
      alert('Terjadi kesalahan saat menghapus pembayaran')
    }
  }

  const handleViewDetail = (receivable: Receivable) => {
    setSelectedReceivable(receivable)
    setShowDetailModal(true)
  }

  const handleEdit = () => {
    if (selectedReceivable) {
      setEditingReceivable(selectedReceivable)
      setShowDetailModal(false)
      setShowEditModal(true)
    }
  }

  const handleAddPayment = () => {
    setShowDetailModal(false)
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = () => {
    fetchReceivables()
    setShowPaymentModal(false)
    // Reopen detail modal with updated data
    setTimeout(() => {
      if (selectedReceivable) {
        const updatedReceivable = receivables.find(r => r.id === selectedReceivable.id)
        if (updatedReceivable) {
          setSelectedReceivable(updatedReceivable)
          setShowDetailModal(true)
        }
      }
    }, 100)
  }

  const handleFormSuccess = () => {
    fetchReceivables()
    setEditingReceivable(null)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 font-medium">Lunas</span>
      case 'partially_paid':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 font-medium">Sebagian</span>
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 font-medium">Belum Bayar</span>
    }
  }

  // Calculate stats
  const totalOutstanding = receivables
    .filter(r => r.status !== 'paid')
    .reduce((sum, r) => sum + r.remaining, 0)

  const totalPaid = receivables.reduce((sum, r) => sum + (r.totalAmount - r.remaining), 0)

  const totalCompleted = receivables.filter(r => r.status === 'paid').length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Memuat...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-800"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Kelola Piutang</h1>
                <p className="text-sm text-gray-600">Catat dan kelola piutang Anda</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">Total Piutang Aktif</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {receivables.filter(r => r.status !== 'paid').length} piutang
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">Total Terbayar</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
            <p className="text-xs text-gray-500 mt-1">Keseluruhan pembayaran</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">Piutang Lunas</p>
            <p className="text-2xl font-bold text-blue-600">{totalCompleted}</p>
            <p className="text-xs text-gray-500 mt-1">
              Dari {receivables.length} total piutang
            </p>
          </div>
        </div>

        {/* Receivables List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">Daftar Piutang</h2>
          </div>

          {receivables.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 mb-2">Belum ada piutang</p>
              <p className="text-sm text-gray-500">Klik tombol + di bawah untuk menambah piutang baru</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {receivables.map((receivable) => {
                const percentagePaid = ((receivable.totalAmount - receivable.remaining) / receivable.totalAmount) * 100
                return (
                  <div
                    key={receivable.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleViewDetail(receivable)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {receivable.debtorName}
                          </h3>
                          {getStatusBadge(receivable.status)}
                        </div>
                        {receivable.description && (
                          <p className="text-sm text-gray-600 mb-2">{receivable.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-800">
                          {formatCurrency(receivable.totalAmount)}
                        </p>
                        <p className="text-sm text-red-600">
                          Sisa: {formatCurrency(receivable.remaining)}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentagePaid}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Tanggal: {formatDate(receivable.date)}</span>
                      {receivable.dueDate && (
                        <span>Jatuh Tempo: {formatDate(receivable.dueDate)}</span>
                      )}
                      <span>{percentagePaid.toFixed(0)}% Terbayar</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Receivable Form */}
      <AddReceivableForm
        onSuccess={handleFormSuccess}
      />

      {/* Edit Receivable Modal */}
      {showEditModal && (
        <AddReceivableForm
          receivable={editingReceivable}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingReceivable(null)
            // Reopen detail modal
            setShowDetailModal(true)
          }}
          onSuccess={() => {
            handleFormSuccess()
            setShowEditModal(false)
            setEditingReceivable(null)
            // Refresh selected receivable
            if (selectedReceivable) {
              const updated = receivables.find(r => r.id === selectedReceivable.id)
              if (updated) {
                setSelectedReceivable(updated)
                setShowDetailModal(true)
              }
            }
          }}
        />
      )}

      {/* Detail Modal */}
      <ReceivableDetailModal
        receivable={selectedReceivable}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedReceivable(null)
        }}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddPayment={handleAddPayment}
        onDeletePayment={handleDeletePayment}
      />

      {/* Payment Modal */}
      <AddPaymentForm
        accounts={accounts}
        receivable={selectedReceivable}
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  )
}

'use client'

import { useState } from 'react'

interface Account {
  id: string
  name: string
  icon: string
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
}

interface ReceivableDetailModalProps {
  receivable: Receivable | null
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onAddPayment: () => void
  onDeletePayment: (paymentId: string) => void
}

export default function ReceivableDetailModal({
  receivable,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onAddPayment,
  onDeletePayment,
}: ReceivableDetailModalProps) {
  const [deletingPayment, setDeletingPayment] = useState<string | null>(null)

  if (!isOpen || !receivable) return null

  const paidAmount = receivable.totalAmount - receivable.remaining
  const percentagePaid = (paidAmount / receivable.totalAmount) * 100

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
      month: 'long',
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

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Yakin ingin menghapus pembayaran ini?')) return

    setDeletingPayment(paymentId)
    try {
      await onDeletePayment(paymentId)
    } finally {
      setDeletingPayment(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              Detail Piutang
            </h2>
            <p className="text-gray-600">{receivable.debtorName}</p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(receivable.status)}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Total Piutang</p>
              <p className="text-lg font-bold text-gray-800">{formatCurrency(receivable.totalAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Sisa</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(receivable.remaining)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Terbayar</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(paidAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Persentase</p>
              <p className="text-lg font-bold text-blue-600">{percentagePaid.toFixed(0)}%</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div
              className="bg-green-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${percentagePaid}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div>
              <span className="font-medium">Tanggal:</span> {formatDate(receivable.date)}
            </div>
            {receivable.dueDate && (
              <div>
                <span className="font-medium">Jatuh Tempo:</span> {formatDate(receivable.dueDate)}
              </div>
            )}
          </div>

          {receivable.description && (
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-medium">Catatan:</span> {receivable.description}
            </div>
          )}
        </div>

        {/* Payment History */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold text-gray-800">Riwayat Pembayaran</h3>
            {receivable.status !== 'paid' && (
              <button
                onClick={onAddPayment}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Tambah Pembayaran
              </button>
            )}
          </div>

          {receivable.payments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>Belum ada pembayaran</p>
            </div>
          ) : (
            <div className="space-y-2">
              {receivable.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-800">
                          {formatCurrency(payment.amount)}
                        </p>
                        <span className="text-xs text-gray-500">
                          → {payment.account.icon} {payment.account.name}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {formatDate(payment.date)}
                      </p>
                      {payment.note && (
                        <p className="text-sm text-gray-500 mt-1">{payment.note}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeletePayment(payment.id)}
                      disabled={deletingPayment === payment.id}
                      className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50"
                      title="Hapus pembayaran"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={onEdit}
            className="flex-1 px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
          >
            Edit Piutang
          </button>
          <button
            onClick={onDelete}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            disabled={receivable.payments.length > 0}
            title={receivable.payments.length > 0 ? 'Hapus semua pembayaran terlebih dahulu' : ''}
          >
            Hapus Piutang
          </button>
        </div>

        {receivable.payments.length > 0 && (
          <p className="text-xs text-gray-500 text-center mt-2">
            * Hapus semua pembayaran terlebih dahulu untuk menghapus piutang
          </p>
        )}
      </div>
    </div>
  )
}

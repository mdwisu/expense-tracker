'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Toast from '../components/Toast'
import { useToast } from '@/lib/useToast'

interface Account {
  id: string
  name: string
  type: string
  icon: string
  color: string
  initialBalance: number
  isDefault: boolean
  createdAt: string
}

interface AccountBalance {
  accountId: string
  accountName: string
  accountIcon: string
  accountColor: string
  accountType: string
  balance: number
}

interface Stats {
  accountBalances: AccountBalance[]
}

export default function AccountsPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'cash',
    icon: '💵',
    color: '#10b981',
    initialBalance: '0',
  })

  const { toasts, removeToast, success, error } = useToast()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [accountsRes, statsRes] = await Promise.all([
        fetch('/api/accounts'),
        fetch('/api/stats'),
      ])

      const [accountsData, statsData] = await Promise.all([
        accountsRes.json(),
        statsRes.json(),
      ])

      setAccounts(accountsData)
      setStats(statsData)
    } catch (err) {
      console.error('Error fetching data:', err)
      error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'bank':
        return 'Bank'
      case 'cash':
        return 'Tunai'
      case 'ewallet':
        return 'E-Wallet'
      default:
        return type
    }
  }

  const getAccountBalance = (accountId: string) => {
    return stats?.accountBalances.find((ab) => ab.accountId === accountId)?.balance || 0
  }

  const handleOpenForm = (account?: Account) => {
    if (account) {
      setEditingAccount(account)
      setFormData({
        name: account.name,
        type: account.type,
        icon: account.icon,
        color: account.color,
        initialBalance: account.initialBalance.toString(),
      })
    } else {
      setEditingAccount(null)
      setFormData({
        name: '',
        type: 'cash',
        icon: '💵',
        color: '#10b981',
        initialBalance: '0',
      })
    }
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingAccount(null)
    setFormData({
      name: '',
      type: 'cash',
      icon: '💵',
      color: '#10b981',
      initialBalance: '0',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = '/api/accounts'
      const method = editingAccount ? 'PUT' : 'POST'
      const body = editingAccount
        ? JSON.stringify({ ...formData, id: editingAccount.id })
        : JSON.stringify(formData)

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      })

      if (response.ok) {
        success(editingAccount ? 'Akun berhasil diupdate' : 'Akun berhasil ditambahkan')
        handleCloseForm()
        fetchData()
      } else {
        const data = await response.json()
        error(data.error || 'Gagal menyimpan akun')
      }
    } catch (err) {
      console.error('Error saving account:', err)
      error('Terjadi kesalahan saat menyimpan')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (account: Account) => {
    if (account.isDefault) {
      error('Tidak dapat menghapus akun default')
      return
    }

    if (!confirm(`Yakin ingin menghapus akun ${account.name}?`)) return

    setLoading(true)
    try {
      const response = await fetch(`/api/accounts?id=${account.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        success('Akun berhasil dihapus')
        fetchData()
      } else {
        const data = await response.json()
        error(data.error || 'Gagal menghapus akun')
      }
    } catch (err) {
      console.error('Error deleting account:', err)
      error('Terjadi kesalahan saat menghapus')
    } finally {
      setLoading(false)
    }
  }

  const typeIcons = {
    cash: '💵',
    bank: '🏦',
    ewallet: '📱',
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali
          </button>
          <button
            onClick={() => handleOpenForm()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Akun
          </button>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Kelola Akun</h1>
        <p className="text-gray-600 mt-1">Manage akun bank, dompet tunai, dan e-wallet Anda</p>
      </div>

      {/* Accounts List */}
      <div className="max-w-6xl mx-auto">
        {loading && accounts.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">Belum ada akun. Tambahkan akun pertama Anda!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => {
              const balance = getAccountBalance(account.id)
              return (
                <div
                  key={account.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border-l-4"
                  style={{ borderLeftColor: account.color }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{account.icon}</span>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">
                          {account.name}
                          {account.isDefault && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                              Default
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-500">{getTypeLabel(account.type)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Saldo Saat Ini</p>
                    <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(balance)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Saldo awal: {formatCurrency(account.initialBalance)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenForm(account)}
                      className="flex-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                    >
                      Edit
                    </button>
                    {!account.isDefault && (
                      <button
                        onClick={() => handleDelete(account)}
                        className="px-3 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editingAccount ? 'Edit Akun' : 'Tambah Akun Baru'}
              </h2>
              <button onClick={handleCloseForm} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Akun</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  placeholder="Contoh: BCA Utama"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value,
                      icon: typeIcons[e.target.value as keyof typeof typeIcons],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                >
                  <option value="cash">Tunai</option>
                  <option value="bank">Bank</option>
                  <option value="ewallet">E-Wallet</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <input
                  type="text"
                  required
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  placeholder="Contoh: 💰"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Emoji yang merepresentasikan akun (Windows + . untuk emoji picker)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warna</label>
                <input
                  type="color"
                  required
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-10 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Awal (Rp)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.initialBalance}
                  onChange={(e) => setFormData({ ...formData, initialBalance: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">Saldo awal saat membuat akun ini</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : editingAccount ? 'Update' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

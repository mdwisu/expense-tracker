'use client'

import { useEffect, useState } from 'react'
import AddExpenseForm from './components/AddExpenseForm'
import AddIncomeForm from './components/AddIncomeForm'

interface Category {
  id: string
  name: string
  icon: string
  color: string
}

interface Expense {
  id: string
  title: string
  amount: number
  description: string | null
  date: string
  category: Category
}

interface Stats {
  totalIncome: number
  totalExpenses: number
  balance: number
  categoryStats: {
    category: string
    icon: string
    color: string
    total: number
    count: number
  }[]
}

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [expensesRes, categoriesRes, statsRes] = await Promise.all([
        fetch(`/api/expenses?month=${selectedMonth}&year=${selectedYear}`),
        fetch('/api/categories'),
        fetch(`/api/stats?month=${selectedMonth}&year=${selectedYear}`),
      ])

      const [expensesData, categoriesData, statsData] = await Promise.all([
        expensesRes.json(),
        categoriesRes.json(),
        statsRes.json(),
      ])

      setExpenses(expensesData)
      setCategories(categoriesData)
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedMonth, selectedYear])

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

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setIsEditExpenseOpen(true)
  }

  const handleCloseEdit = () => {
    setEditingExpense(null)
    setIsEditExpenseOpen(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus pengeluaran ini?')) return

    try {
      const response = await fetch(`/api/expenses?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
    }
  }

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Expense Tracker</h1>
          <p className="text-gray-600">Kelola keuangan Anda dengan mudah</p>
        </div>

        {/* Month Selector */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex items-center justify-between">
          <div className="flex gap-4">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {months.map((month, index) => (
                <option key={index} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[2023, 2024, 2025, 2026].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <AddIncomeForm onSuccess={fetchData} />
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Pemasukan</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(stats.totalIncome)}
                  </p>
                </div>
                <div className="text-4xl">💰</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Pengeluaran</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(stats.totalExpenses)}
                  </p>
                </div>
                <div className="text-4xl">💸</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Saldo</p>
                  <p className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {formatCurrency(stats.balance)}
                  </p>
                </div>
                <div className="text-4xl">{stats.balance >= 0 ? '✅' : '⚠️'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Category Stats */}
        {stats && stats.categoryStats.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Pengeluaran per Kategori</h2>
            <div className="space-y-3">
              {stats.categoryStats.map((cat) => {
                const percentage = stats.totalExpenses > 0
                  ? (cat.total / stats.totalExpenses) * 100
                  : 0

                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        {cat.icon} {cat.category} ({cat.count}x)
                      </span>
                      <span className="font-semibold text-gray-800">
                        {formatCurrency(cat.total)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      {percentage.toFixed(1)}% dari total pengeluaran
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Expenses List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Riwayat Pengeluaran</h2>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Belum ada pengeluaran bulan ini
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                      style={{ backgroundColor: expense.category.color + '20' }}
                    >
                      {expense.category.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{expense.title}</h3>
                      <p className="text-sm text-gray-500">
                        {expense.category.name} • {formatDate(expense.date)}
                      </p>
                      {expense.description && (
                        <p className="text-sm text-gray-600 mt-1">{expense.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-red-600">
                      -{formatCurrency(expense.amount)}
                    </span>
                    <button
                      onClick={() => handleEdit(expense)}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title="Hapus"
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
      </div>

      {/* Add Expense Button */}
      <AddExpenseForm categories={categories} onSuccess={fetchData} />

      {/* Edit Expense Modal */}
      {editingExpense && (
        <AddExpenseForm
          categories={categories}
          onSuccess={() => {
            fetchData()
            handleCloseEdit()
          }}
          expense={{
            id: editingExpense.id,
            title: editingExpense.title,
            amount: editingExpense.amount,
            description: editingExpense.description || undefined,
            categoryId: editingExpense.category.id,
            date: editingExpense.date,
          }}
          isOpen={isEditExpenseOpen}
          onClose={handleCloseEdit}
        />
      )}
    </div>
  )
}
